import { Router } from 'express';
import {
  getAnalytics,
  getMySalons,
  getOwnerBookings,
  getSalonServices,
  patchBookingStatus,
  patchSalon,
  patchService,
  postSalon,
  postService,
  postStaff,
  removeService
} from '../controllers/ownerController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Role } from '../generated/prisma/enums.js';

export const ownerRoutes = Router();

ownerRoutes.use(requireAuth, requireRole(Role.SALON_OWNER, Role.ADMIN));

ownerRoutes.get('/analytics', getAnalytics);

ownerRoutes.get('/salons', getMySalons);
ownerRoutes.post('/salons', postSalon);
ownerRoutes.patch('/salons/:id', patchSalon);

ownerRoutes.get('/salons/:id/services', getSalonServices);
ownerRoutes.post('/salons/:id/services', postService);
ownerRoutes.post('/salons/:id/staff', postStaff);

ownerRoutes.patch('/services/:id', patchService);
ownerRoutes.delete('/services/:id', removeService);

ownerRoutes.get('/bookings', getOwnerBookings);
ownerRoutes.patch('/bookings/:id/status', patchBookingStatus);
