import { Router } from 'express';
import { getCategories, getCities, getSalon, getSalons } from '../controllers/catalogController.js';

export const catalogRoutes = Router();

catalogRoutes.get('/categories', getCategories);
catalogRoutes.get('/cities', getCities);
catalogRoutes.get('/salons', getSalons);
catalogRoutes.get('/salons/:slug', getSalon);
