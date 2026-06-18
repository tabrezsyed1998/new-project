import { cancelBooking, createBooking, listMyBookings } from '../services/bookingService.js';
import { createReview } from '../services/reviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const postBooking = asyncHandler(async (req, res) => {
  const booking = await createBooking(req.user!.id, req.body);
  res.status(201).json({ booking });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const result = await listMyBookings(req.user!.id, req.query as Record<string, string>);
  res.json(result);
});

export const patchCancelBooking = asyncHandler(async (req, res) => {
  const booking = await cancelBooking(req.user!.id, req.params.id);
  res.json({ booking });
});

export const postReview = asyncHandler(async (req, res) => {
  const review = await createReview(req.user!.id, req.params.salonId, req.body);
  res.status(201).json({ review });
});
