import { Router } from 'express';
import {
  getMyBookings,
  patchCancelBooking,
  postBooking,
  postReview
} from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);

bookingRoutes.post('/bookings', postBooking);
bookingRoutes.get('/bookings', getMyBookings);
bookingRoutes.patch('/bookings/:id/cancel', patchCancelBooking);
bookingRoutes.post('/salons/:salonId/reviews', postReview);
