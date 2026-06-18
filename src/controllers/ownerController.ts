import { listSalonBookingsForOwner, updateBookingStatusAsOwner } from '../services/bookingService.js';
import {
  createSalon,
  createService,
  createStaff,
  deleteService,
  getOwnerAnalytics,
  listMySalons,
  listServices,
  updateSalon,
  updateService
} from '../services/salonAdminService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMySalons = asyncHandler(async (req, res) => {
  const salons = await listMySalons(req.user!.id);
  res.json({ salons });
});

export const postSalon = asyncHandler(async (req, res) => {
  const salon = await createSalon(req.user!.id, req.body);
  res.status(201).json({ salon });
});

export const patchSalon = asyncHandler(async (req, res) => {
  const salon = await updateSalon(req.user!.id, req.params.id, req.body);
  res.json({ salon });
});

export const getSalonServices = asyncHandler(async (req, res) => {
  const services = await listServices(req.user!.id, req.params.id);
  res.json({ services });
});

export const postService = asyncHandler(async (req, res) => {
  const service = await createService(req.user!.id, req.params.id, req.body);
  res.status(201).json({ service });
});

export const patchService = asyncHandler(async (req, res) => {
  const service = await updateService(req.user!.id, req.params.id, req.body);
  res.json({ service });
});

export const removeService = asyncHandler(async (req, res) => {
  await deleteService(req.user!.id, req.params.id);
  res.status(204).send();
});

export const postStaff = asyncHandler(async (req, res) => {
  const staff = await createStaff(req.user!.id, req.params.id, req.body);
  res.status(201).json({ staff });
});

export const getOwnerBookings = asyncHandler(async (req, res) => {
  const salonId = typeof req.query.salonId === 'string' ? req.query.salonId : undefined;
  const result = await listSalonBookingsForOwner(req.user!.id, salonId, req.query as Record<string, string>);
  res.json(result);
});

export const patchBookingStatus = asyncHandler(async (req, res) => {
  const booking = await updateBookingStatusAsOwner(req.user!.id, req.params.id, req.body.status);
  res.json({ booking });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const salonId = typeof req.query.salonId === 'string' ? req.query.salonId : undefined;
  const analytics = await getOwnerAnalytics(req.user!.id, salonId);
  res.json({ analytics });
});
