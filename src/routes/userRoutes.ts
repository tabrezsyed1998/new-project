import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user
  });
});
