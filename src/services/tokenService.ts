import crypto from 'crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

type TokenUser = {
  id: string;
  email: string;
};

export type RefreshTokenPayload = JwtPayload & {
  sub: string;
  jti: string;
};

export function createAccessToken(user: TokenUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenExpiresIn as SignOptions['expiresIn']
    }
  );
}

export function createRefreshToken(userId: string): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = jwt.sign(
    {
      sub: userId,
      jti: crypto.randomUUID()
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.refreshTokenExpiresIn as SignOptions['expiresIn']
    }
  );

  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new Error('Refresh token expiry could not be calculated.');
  }

  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(decoded.exp * 1000)
  };
}

export function verifyAccessToken(token: string): JwtPayload & { sub: string } {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  return assertTokenPayload(payload);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret);
  return assertTokenPayload(payload, true);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function assertTokenPayload(payload: string | JwtPayload, requireJti = false): RefreshTokenPayload {
  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    (requireJti && typeof payload.jti !== 'string')
  ) {
    throw new ApiError(401, 'Invalid token payload.');
  }

  return payload as RefreshTokenPayload;
}
