import { prisma } from '../db/prisma.js';
import { BookingStatus } from '../generated/prisma/enums.js';
import { ApiError } from '../utils/apiError.js';

export type CreateReviewInput = {
  rating?: number;
  comment?: string;
  bookingId?: string;
};

export async function createReview(customerId: string, salonId: string, input: CreateReviewInput) {
  const rating = Number(input.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be a whole number between 1 and 5.');
  }

  const salon = await prisma.salon.findFirst({
    where: { id: salonId, isActive: true },
    select: { id: true }
  });

  if (!salon) {
    throw new ApiError(404, 'Salon not found.');
  }

  if (input.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true, customerId: true, salonId: true, status: true, review: { select: { id: true } } }
    });

    if (!booking || booking.customerId !== customerId || booking.salonId !== salonId) {
      throw new ApiError(404, 'Booking not found for this salon.');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ApiError(409, 'You can only review a completed appointment.');
    }

    if (booking.review) {
      throw new ApiError(409, 'This appointment has already been reviewed.');
    }
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        salonId,
        customerId,
        bookingId: input.bookingId || null,
        rating,
        comment: input.comment?.trim() || null
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        customer: { select: { name: true, avatarUrl: true } }
      }
    });

    const aggregate = await tx.review.aggregate({
      where: { salonId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await tx.salon.update({
      where: { id: salonId },
      data: {
        ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
        ratingCount: aggregate._count.rating
      }
    });

    return review;
  });
}
