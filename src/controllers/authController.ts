import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser
} from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const authPayload = await registerUser(req.body);
  res.status(201).json(authPayload);
});

export const login = asyncHandler(async (req, res) => {
  const authPayload = await loginUser(req.body);
  res.status(200).json(authPayload);
});

export const refresh = asyncHandler(async (req, res) => {
  const authPayload = await refreshSession(req.body.refreshToken);
  res.status(200).json(authPayload);
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.body.refreshToken);
  res.status(204).send();
});
