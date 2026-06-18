import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { bookingRoutes } from './routes/bookingRoutes.js';
import { catalogRoutes } from './routes/catalogRoutes.js';
import { ownerRoutes } from './routes/ownerRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api', catalogRoutes);
app.use('/api', bookingRoutes);
app.use('/api', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
