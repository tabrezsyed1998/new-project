import { ApiError } from './apiError.js';

type RegisterInput = {
  name?: string;
  email?: string;
  password?: string;
};

type LoginInput = {
  email?: string;
  password?: string;
};

export function validateRegisterInput({ name, email, password }: RegisterInput): void {
  if (!name || String(name).trim().length < 2) {
    throw new ApiError(400, 'Name must be at least 2 characters long.');
  }

  validateEmail(email);
  validatePassword(password);
}

export function validateLoginInput({ email, password }: LoginInput): void {
  validateEmail(email);

  if (!password) {
    throw new ApiError(400, 'Password is required.');
  }
}

function validateEmail(email?: string): void {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw new ApiError(400, 'A valid email is required.');
  }
}

function validatePassword(password?: string): void {
  if (!password || String(password).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }
}
