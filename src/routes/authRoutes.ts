import { Router } from 'express';
import { login, logout, refresh, register } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
