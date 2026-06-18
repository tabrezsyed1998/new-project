import { prisma } from '../db/prisma.js';
import { BookingStatus } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { ApiError } from '../utils/apiError.js';
import { buildPage, parsePagination, type Paginated } from '../utils/pagination.js';

const customerBookingSelect = {
  id: true,
  scheduledAt: true,
  durationMin: true,
  status: true,
  totalInr: true,
  tokenPaidInr: true,
  notes: true,
  createdAt: true,
  salon: {
    select: { id: true, name: true, slug: true, coverImage: true, city: true, area: true, phone: true }
  },
  service: { select: { id: true, name: true, durationMin: true, priceInr: true } },
  staff: { select: { id: true, name: true } },
  review: { select: { id: true, rating: true } }
} satisfies Prisma.BookingSelect;

const ownerBookingSelect = {
  id: true,
  scheduledAt: true,
  durationMin: true,
  status: true,
  totalInr: true,
  tokenPaidInr: true,
  notes: true,
  createdAt: true,
  salon: { select: { id: true, name: true, slug: true } },
  service: { select: { id: true, name: true, durationMin: true, priceInr: true } },
  staff: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, phone: true, avatarUrl: true } }
} satisfies Prisma.BookingSelect;

export type CreateBookingInput = {
  salonId?: string;
  serviceId?: string;
  staffId?: string;
  scheduledAt?: string;
  notes?: string;
};

/** A refundable booking token: 10% of the service price, clamped to ₹50–₹200. */
function bookingToken(priceInr: number): number {
  if (priceInr <= 50) return priceInr;
  return Math.min(priceInr, Math.max(50, Math.min(200, Math.round(priceInr * 0.1))));
}

export async function createBooking(customerId: string, input: CreateBookingInput) {
  if (!input.salonId || !input.serviceId) {
    throw new ApiError(400, 'salonId and serviceId are required.');
  }

  if (!input.scheduledAt) {
    throw new ApiError(400, 'scheduledAt is required.');
  }

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new ApiError(400, 'scheduledAt must be a valid date-time.');
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw new ApiError(400, 'Appointments can only be booked for a future time.');
  }

  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, salonId: input.salonId, isActive: true },
    select: { id: true, durationMin: true, priceInr: true, salon: { select: { isActive: true } } }
  });

  if (!service || !service.salon.isActive) {
    throw new ApiError(404, 'The selected service is not available.');
  }

  const endsAt = new Date(scheduledAt.getTime() + service.durationMin * 60_000);

  if (input.staffId) {
    const staff = await prisma.staffMember.findFirst({
      where: { id: input.staffId, salonId: input.salonId, isActive: true },
      select: { id: true }
    });

    if (!staff) {
      throw new ApiError(404, 'The selected staff member is not available.');
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        staffId: input.staffId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        scheduledAt: { lt: endsAt },
        // Existing bookings whose window overlaps the requested window.
        AND: [
          {
            scheduledAt: {
              gte: new Date(scheduledAt.getTime() - 4 * 60 * 60_000)
            }
          }
        ]
      },
      select: { id: true, scheduledAt: true, durationMin: true }
    });

    if (conflict) {
      const conflictEnd = new Date(conflict.scheduledAt.getTime() + conflict.durationMin * 60_000);
      if (conflictEnd > scheduledAt) {
        throw new ApiError(409, 'That time slot is no longer available for the selected professional.');
      }
    }
  }

  return prisma.booking.create({
    data: {
      customerId,
      salonId: input.salonId,
      serviceId: service.id,
      staffId: input.staffId || null,
      scheduledAt,
      durationMin: service.durationMin,
      totalInr: service.priceInr,
      tokenPaidInr: bookingToken(service.priceInr),
      notes: input.notes?.trim() || null,
      status: BookingStatus.PENDING
    },
    select: customerBookingSelect
  });
}

export async function listMyBookings(
  customerId: string,
  query: { status?: string; page?: string; pageSize?: string }
): Promise<Paginated<Prisma.BookingGetPayload<{ select: typeof customerBookingSelect }>>> {
  const pagination = parsePagination(query);
  const where: Prisma.BookingWhereInput = { customerId };

  if (query.status && isBookingStatus(query.status)) {
    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      select: customerBookingSelect,
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.booking.count({ where })
  ]);

  return buildPage(items, total, pagination);
}

export async function cancelBooking(customerId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerId: true, status: true, scheduledAt: true }
  });

  if (!booking || booking.customerId !== customerId) {
    throw new ApiError(404, 'Booking not found.');
  }

  const cancellable: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
  if (!cancellable.includes(booking.status)) {
    throw new ApiError(409, `A ${booking.status.toLowerCase()} booking cannot be cancelled.`);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
    select: customerBookingSelect
  });
}

const OWNER_TRANSITIONS: Record<string, BookingStatus[]> = {
  [BookingStatus.CONFIRMED]: [BookingStatus.PENDING],
  [BookingStatus.COMPLETED]: [BookingStatus.CONFIRMED],
  [BookingStatus.NO_SHOW]: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
  [BookingStatus.CANCELLED]: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
};

export async function updateBookingStatusAsOwner(
  ownerId: string,
  bookingId: string,
  nextStatus: string
) {
  if (!isBookingStatus(nextStatus)) {
    throw new ApiError(400, 'Invalid booking status.');
  }

  const allowedFrom = OWNER_TRANSITIONS[nextStatus];
  if (!allowedFrom) {
    throw new ApiError(400, `Salon owners cannot set status to ${nextStatus}.`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, salon: { select: { ownerId: true } } }
  });

  if (!booking || booking.salon.ownerId !== ownerId) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (!allowedFrom.includes(booking.status)) {
    throw new ApiError(409, `Cannot move a ${booking.status.toLowerCase()} booking to ${nextStatus.toLowerCase()}.`);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: nextStatus },
    select: ownerBookingSelect
  });
}

export async function listSalonBookingsForOwner(
  ownerId: string,
  salonId: string | undefined,
  query: { status?: string; page?: string; pageSize?: string }
): Promise<Paginated<Prisma.BookingGetPayload<{ select: typeof ownerBookingSelect }>>> {
  const pagination = parsePagination(query);
  const where: Prisma.BookingWhereInput = { salon: { ownerId } };

  if (salonId) {
    where.salonId = salonId;
  }

  if (query.status && isBookingStatus(query.status)) {
    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      select: ownerBookingSelect,
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.booking.count({ where })
  ]);

  return buildPage(items, total, pagination);
}

function isBookingStatus(value: string): value is BookingStatus {
  return (Object.values(BookingStatus) as string[]).includes(value);
}
