import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { validateLoginInput, validateRegisterInput } from '../utils/validators.js';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken
} from './tokenService.js';

type AuthInput = {
  name?: string;
  email?: string;
  password?: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export type AuthPayload = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true
} as const;

export async function registerUser(input: AuthInput): Promise<AuthPayload> {
  validateRegisterInput(input);

  const name = input.name!.trim();
  const email = input.email!.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password!, 12);

  try {
    return await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingUser) {
        throw new ApiError(409, 'Email is already registered.');
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash
        },
        select: publicUserSelect
      });

      return issueTokens(tx, user);
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'Email is already registered.');
    }

    throw error;
  }
}

export async function loginUser(input: AuthInput): Promise<AuthPayload> {
  validateLoginInput(input);

  const email = input.email!.trim().toLowerCase();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true
      }
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(input.password!, user.passwordHash);

    if (!passwordMatches) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    return issueTokens(tx, toPublicUser(user));
  });
}

export async function refreshSession(refreshToken: string | undefined): Promise<AuthPayload> {
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required.');
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const tokenHash = hashToken(refreshToken);

  return prisma.$transaction(async (tx) => {
    const tokenRecord = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: publicUserSelect
        }
      }
    });

    if (!tokenRecord || tokenRecord.userId !== payload.sub) {
      throw new ApiError(401, 'Invalid refresh token.');
    }

    const now = new Date();

    if (tokenRecord.revokedAt || tokenRecord.expiresAt <= now) {
      throw new ApiError(401, 'Refresh token has expired or was revoked.');
    }

    const accessToken = createAccessToken(tokenRecord.user);
    const newRefreshToken = createRefreshToken(tokenRecord.userId);

    const insertedToken = await tx.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: newRefreshToken.tokenHash,
        expiresAt: newRefreshToken.expiresAt
      },
      select: {
        id: true
      }
    });

    const revoked = await tx.refreshToken.updateMany({
      where: {
        id: tokenRecord.id,
        revokedAt: null,
        expiresAt: {
          gt: now
        }
      },
      data: {
        revokedAt: now,
        replacedByTokenId: insertedToken.id
      }
    });

    if (revoked.count !== 1) {
      throw new ApiError(401, 'Refresh token has expired or was revoked.');
    }

    return {
      user: tokenRecord.user,
      accessToken,
      refreshToken: newRefreshToken.token
    };
  });
}

export async function logoutUser(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required.');
  }

  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

async function issueTokens(
  tx: PrismaTransaction,
  user: PublicUser
): Promise<AuthPayload> {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user.id);

  await tx.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt
    }
  });

  return {
    user,
    accessToken,
    refreshToken: refreshToken.token
  };
}

function toPublicUser(user: PublicUser & { passwordHash?: string }): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
