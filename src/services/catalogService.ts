import { prisma } from '../db/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';
import { ApiError } from '../utils/apiError.js';
import { buildPage, parsePagination, type Paginated } from '../utils/pagination.js';

const salonCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  coverImage: true,
  city: true,
  area: true,
  priceLevel: true,
  isVerified: true,
  ratingAvg: true,
  ratingCount: true,
  category: { select: { name: true, slug: true, icon: true } },
  services: {
    where: { isActive: true },
    select: { priceInr: true }
  }
} satisfies Prisma.SalonSelect;

type SalonCardRow = Prisma.SalonGetPayload<{ select: typeof salonCardSelect }>;

export type SalonCard = Omit<SalonCardRow, 'services'> & {
  startingPriceInr: number | null;
  serviceCount: number;
};

function toSalonCard(row: SalonCardRow): SalonCard {
  const prices = row.services.map((service) => service.priceInr);
  const { services, ...rest } = row;
  return {
    ...rest,
    serviceCount: services.length,
    startingPriceInr: prices.length ? Math.min(...prices) : null
  };
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
      _count: { select: { salons: true } }
    }
  });
}

export type SalonQuery = {
  q?: string;
  city?: string;
  category?: string;
  priceLevel?: string;
  verified?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
};

export async function listSalons(query: SalonQuery): Promise<Paginated<SalonCard>> {
  const pagination = parsePagination(query);

  const where: Prisma.SalonWhereInput = { isActive: true };

  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { tagline: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { city: { contains: term, mode: 'insensitive' } },
      { area: { contains: term, mode: 'insensitive' } }
    ];
  }

  if (query.city?.trim()) {
    where.city = { equals: query.city.trim(), mode: 'insensitive' };
  }

  if (query.category?.trim()) {
    where.category = { slug: query.category.trim() };
  }

  if (query.priceLevel && ['BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY'].includes(query.priceLevel)) {
    where.priceLevel = query.priceLevel as Prisma.SalonWhereInput['priceLevel'];
  }

  if (query.verified === 'true') {
    where.isVerified = true;
  }

  const orderBy = resolveSort(query.sort);

  const [rows, total] = await Promise.all([
    prisma.salon.findMany({
      where,
      orderBy,
      select: salonCardSelect,
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.salon.count({ where })
  ]);

  return buildPage(rows.map(toSalonCard), total, pagination);
}

function resolveSort(sort?: string): Prisma.SalonOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'popular':
      return [{ ratingCount: 'desc' }, { ratingAvg: 'desc' }];
    case 'rating':
    default:
      return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
  }
}

export async function getSalonBySlug(slug: string) {
  const salon = await prisma.salon.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      coverImage: true,
      images: true,
      phone: true,
      email: true,
      addressLine: true,
      area: true,
      city: true,
      state: true,
      pincode: true,
      latitude: true,
      longitude: true,
      priceLevel: true,
      isVerified: true,
      openingHours: true,
      ratingAvg: true,
      ratingCount: true,
      category: { select: { name: true, slug: true, icon: true } },
      services: {
        where: { isActive: true },
        orderBy: { priceInr: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          durationMin: true,
          priceInr: true,
          category: true
        }
      },
      staff: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, title: true, bio: true, avatarUrl: true }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { name: true, avatarUrl: true } }
        }
      }
    }
  });

  if (!salon) {
    throw new ApiError(404, 'Salon not found.');
  }

  return salon;
}

/** Distinct list of cities that currently have active salons (for filters). */
export async function listCities(): Promise<string[]> {
  const rows = await prisma.salon.findMany({
    where: { isActive: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
    select: { city: true }
  });

  return rows.map((row) => row.city);
}
