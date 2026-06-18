import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { updateProfile } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userRoutes = Router();

userRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

userRoutes.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.user!.id, req.body);
    res.json({ user });
  })
);
