import { prisma } from '../db/prisma.js';
import { BookingStatus, PriceLevel } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { ApiError } from '../utils/apiError.js';
import { slugify, uniqueSlug } from '../utils/slug.js';

const PRICE_LEVELS = Object.values(PriceLevel) as string[];

async function assertSalonOwnership(ownerId: string, salonId: string): Promise<void> {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { ownerId: true }
  });

  if (!salon || salon.ownerId !== ownerId) {
    throw new ApiError(404, 'Salon not found.');
  }
}

export async function listMySalons(ownerId: string) {
  return prisma.salon.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      coverImage: true,
      city: true,
      area: true,
      priceLevel: true,
      isVerified: true,
      isActive: true,
      ratingAvg: true,
      ratingCount: true,
      category: { select: { name: true, slug: true } },
      _count: { select: { services: true, bookings: true } }
    }
  });
}

export type SalonInput = {
  name?: string;
  categoryId?: string;
  categorySlug?: string;
  tagline?: string;
  description?: string;
  coverImage?: string;
  images?: string[];
  phone?: string;
  email?: string;
  addressLine?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  priceLevel?: string;
  openingHours?: unknown;
  isActive?: boolean;
};

async function resolveCategoryId(input: SalonInput): Promise<string | null> {
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    return category?.id ?? null;
  }
  if (input.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: input.categorySlug }, select: { id: true } });
    return category?.id ?? null;
  }
  return null;
}

export async function createSalon(ownerId: string, input: SalonInput) {
  if (!input.name || input.name.trim().length < 2) {
    throw new ApiError(400, 'Salon name must be at least 2 characters long.');
  }
  if (!input.city || input.city.trim().length < 2) {
    throw new ApiError(400, 'City is required.');
  }

  const categoryId = await resolveCategoryId(input);
  if (!categoryId) {
    throw new ApiError(400, 'A valid category is required.');
  }

  const slug = await uniqueSlug(input.name, async (candidate) => {
    const existing = await prisma.salon.findUnique({ where: { slug: candidate }, select: { id: true } });
    return Boolean(existing);
  });

  return prisma.salon.create({
    data: {
      ownerId,
      categoryId,
      slug,
      name: input.name.trim(),
      tagline: input.tagline?.trim() || null,
      description: input.description?.trim() || null,
      coverImage: input.coverImage?.trim() || null,
      images: sanitizeImages(input.images),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      addressLine: input.addressLine?.trim() || null,
      area: input.area?.trim() || null,
      city: input.city.trim(),
      state: input.state?.trim() || null,
      pincode: input.pincode?.trim() || null,
      priceLevel: normalizePriceLevel(input.priceLevel),
      openingHours: (input.openingHours as Prisma.InputJsonValue) ?? undefined
    },
    select: { id: true, slug: true, name: true }
  });
}

export async function updateSalon(ownerId: string, salonId: string, input: SalonInput) {
  await assertSalonOwnership(ownerId, salonId);

  const data: Prisma.SalonUpdateInput = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.tagline !== undefined) data.tagline = input.tagline.trim() || null;
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage.trim() || null;
  if (input.images !== undefined) data.images = sanitizeImages(input.images);
  if (input.phone !== undefined) data.phone = input.phone.trim() || null;
  if (input.email !== undefined) data.email = input.email.trim() || null;
  if (input.addressLine !== undefined) data.addressLine = input.addressLine.trim() || null;
  if (input.area !== undefined) data.area = input.area.trim() || null;
  if (input.city !== undefined) data.city = input.city.trim();
  if (input.state !== undefined) data.state = input.state.trim() || null;
  if (input.pincode !== undefined) data.pincode = input.pincode.trim() || null;
  if (input.priceLevel !== undefined) data.priceLevel = normalizePriceLevel(input.priceLevel);
  if (input.openingHours !== undefined) data.openingHours = input.openingHours as Prisma.InputJsonValue;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  if (input.categoryId || input.categorySlug) {
    const categoryId = await resolveCategoryId(input);
    if (!categoryId) throw new ApiError(400, 'A valid category is required.');
    data.category = { connect: { id: categoryId } };
  }

  return prisma.salon.update({
    where: { id: salonId },
    data,
    select: { id: true, slug: true, name: true }
  });
}

export type ServiceInput = {
  name?: string;
  description?: string;
  durationMin?: number;
  priceInr?: number;
  category?: string;
  isActive?: boolean;
};

function validateService(input: ServiceInput, partial = false): void {
  if (!partial || input.name !== undefined) {
    if (!input.name || input.name.trim().length < 2) {
      throw new ApiError(400, 'Service name is required.');
    }
  }
  if (!partial || input.durationMin !== undefined) {
    if (!Number.isInteger(input.durationMin) || (input.durationMin as number) <= 0) {
      throw new ApiError(400, 'Duration must be a positive number of minutes.');
    }
  }
  if (!partial || input.priceInr !== undefined) {
    if (!Number.isInteger(input.priceInr) || (input.priceInr as number) < 0) {
      throw new ApiError(400, 'Price must be a non-negative whole number.');
    }
  }
}

export async function createService(ownerId: string, salonId: string, input: ServiceInput) {
  await assertSalonOwnership(ownerId, salonId);
  validateService(input);

  return prisma.service.create({
    data: {
      salonId,
      name: input.name!.trim(),
      description: input.description?.trim() || null,
      durationMin: input.durationMin!,
      priceInr: input.priceInr!,
      category: input.category?.trim() || null
    }
  });
}

export async function updateService(ownerId: string, serviceId: string, input: ServiceInput) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, salon: { select: { ownerId: true } } }
  });

  if (!service || service.salon.ownerId !== ownerId) {
    throw new ApiError(404, 'Service not found.');
  }

  validateService(input, true);

  const data: Prisma.ServiceUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.durationMin !== undefined) data.durationMin = input.durationMin;
  if (input.priceInr !== undefined) data.priceInr = input.priceInr;
  if (input.category !== undefined) data.category = input.category.trim() || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return prisma.service.update({ where: { id: serviceId }, data });
}

export async function deleteService(ownerId: string, serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, salon: { select: { ownerId: true } } }
  });

  if (!service || service.salon.ownerId !== ownerId) {
    throw new ApiError(404, 'Service not found.');
  }

  // Soft-delete so historical bookings keep their service reference.
  await prisma.service.update({ where: { id: serviceId }, data: { isActive: false } });
}

export async function listServices(ownerId: string, salonId: string) {
  await assertSalonOwnership(ownerId, salonId);
  return prisma.service.findMany({
    where: { salonId },
    orderBy: [{ isActive: 'desc' }, { priceInr: 'asc' }]
  });
}

export type StaffInput = {
  name?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  isActive?: boolean;
};

export async function createStaff(ownerId: string, salonId: string, input: StaffInput) {
  await assertSalonOwnership(ownerId, salonId);
  if (!input.name || input.name.trim().length < 2) {
    throw new ApiError(400, 'Staff name is required.');
  }

  return prisma.staffMember.create({
    data: {
      salonId,
      name: input.name.trim(),
      title: input.title?.trim() || null,
      bio: input.bio?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null
    }
  });
}

export async function getOwnerAnalytics(ownerId: string, salonId?: string) {
  if (salonId) {
    await assertSalonOwnership(ownerId, salonId);
  }

  const salonFilter: Prisma.BookingWhereInput = salonId
    ? { salonId }
    : { salon: { ownerId } };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [statusGroups, revenue, monthRevenue, upcoming, recent, salonCount] = await Promise.all([
    prisma.booking.groupBy({
      by: ['status'],
      where: salonFilter,
      _count: { _all: true }
    }),
    prisma.booking.aggregate({
      where: { ...salonFilter, status: BookingStatus.COMPLETED },
      _sum: { totalInr: true }
    }),
    prisma.booking.aggregate({
      where: { ...salonFilter, status: BookingStatus.COMPLETED, scheduledAt: { gte: startOfMonth } },
      _sum: { totalInr: true }
    }),
    prisma.booking.count({
      where: { ...salonFilter, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }, scheduledAt: { gte: now } }
    }),
    prisma.booking.findMany({
      where: salonFilter,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        totalInr: true,
        service: { select: { name: true } },
        customer: { select: { name: true } },
        salon: { select: { name: true } }
      }
    }),
    salonId ? Promise.resolve(1) : prisma.salon.count({ where: { ownerId } })
  ]);

  const byStatus: Record<string, number> = {};
  let totalBookings = 0;
  for (const group of statusGroups) {
    byStatus[group.status] = group._count._all;
    totalBookings += group._count._all;
  }

  return {
    totalBookings,
    upcomingBookings: upcoming,
    completedBookings: byStatus[BookingStatus.COMPLETED] ?? 0,
    noShowBookings: byStatus[BookingStatus.NO_SHOW] ?? 0,
    cancelledBookings: byStatus[BookingStatus.CANCELLED] ?? 0,
    bookingsByStatus: byStatus,
    lifetimeRevenueInr: revenue._sum.totalInr ?? 0,
    monthRevenueInr: monthRevenue._sum.totalInr ?? 0,
    salonCount,
    recentBookings: recent
  };
}

function normalizePriceLevel(value?: string): PriceLevel {
  if (value && PRICE_LEVELS.includes(value)) {
    return value as PriceLevel;
  }
  return PriceLevel.MODERATE;
}

function sanitizeImages(images?: string[]): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((image) => String(image).trim()).filter(Boolean).slice(0, 10);
}
