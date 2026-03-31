import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../shared/errors';
import { supabase } from '../config/supabase';

export interface JwtPayload {
  userId: string;
  role: 'student' | 'teacher' | 'admin';
}

// Extend Express Request to carry user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as JwtPayload;

    req.user = payload;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

// Check if deactivated user is trying to access
export async function checkActive(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', req.user!.userId)
      .single();

    if (error || !data) return next(new AppError('User not found', 404));
    if (!data.is_active) return next(new AppError('Account deactivated. Please contact admin.', 403));

    next();
  } catch (err) {
    next(err);
  }
}

// Role guard factory
export function requireRole(...roles: Array<'student' | 'teacher' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Access denied', 403));
    }
    next();
  };
}