import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';
import { sendSuccess } from '../../shared/response';

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await AuthService.login(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await AuthService.refreshAccessToken(req.body.refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await AuthService.logout(req.user!.userId);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await AuthService.forgotPassword(req.body);
    sendSuccess(res, { message: 'If this email exists, an OTP has been sent' });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await AuthService.resetPassword(req.body);
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}