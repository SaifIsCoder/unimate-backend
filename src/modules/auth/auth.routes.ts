import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from './auth.schema';
import {
  loginController,
  refreshController,
  logoutController,
  forgotPasswordController,
  resetPasswordController
} from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', authRateLimiter, validate(loginSchema), loginController);
authRoutes.post('/refresh', validate(refreshTokenSchema), refreshController);
authRoutes.post('/logout', authenticate, logoutController);
authRoutes.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPasswordController);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);