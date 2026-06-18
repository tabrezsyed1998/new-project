import { getSalonBySlug, listCategories, listCities, listSalons } from '../services/catalogService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.json({ categories });
});

export const getCities = asyncHandler(async (_req, res) => {
  const cities = await listCities();
  res.json({ cities });
});

export const getSalons = asyncHandler(async (req, res) => {
  const result = await listSalons(req.query as Record<string, string>);
  res.json(result);
});

export const getSalon = asyncHandler(async (req, res) => {
  const salon = await getSalonBySlug(req.params.slug);
  res.json({ salon });
});
