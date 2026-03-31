import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabase';
import { redis } from '../../config/redis';
import { AppError } from '../../shared/errors';
import { LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  // 1. Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash, role, is_active')
    .eq('email', input.email)
    .single();

  if (error || !user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Check if active
  if (!user.is_active) {
    throw new AppError('Account deactivated. Please contact admin.', 403);
  }

  // 3. Verify password
  const isValid = await bcrypt.compare(input.password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // 4. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // 5. Store refresh token in Redis
  await redis.setex(
    `refresh:${user.id}`,
    REFRESH_TOKEN_EXPIRY_SECONDS,
    refreshToken
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

export async function refreshAccessToken(token: string) {
  // 1. Verify refresh token signature
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // 2. Check token exists in Redis
  const stored = await redis.get(`refresh:${payload.userId}`);
  if (!stored || stored !== token) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  // 3. Issue new access token
  const accessToken = jwt.sign(
    { userId: payload.userId, role: payload.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return { accessToken };
}

export async function logout(userId: string) {
  await redis.del(`refresh:${userId}`);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  // 1. Check user exists
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', input.email)
    .single();

  // Always return success (don't reveal if email exists)
  if (!user) return;

  // 2. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Store OTP in Redis (10 min expiry)
  await redis.setex(`otp:${user.email}`, OTP_EXPIRY_SECONDS, otp);

  // 4. TODO: Send OTP via email (add email service later)
  // For now log it in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`OTP for ${user.email}: ${otp}`);
  }
}

export async function resetPassword(input: ResetPasswordInput) {
  // 1. Get OTP from Redis
  const stored = await redis.get(`otp:${input.email}`);
  if (!stored || stored !== input.otp) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  // 2. Hash new password
  const password_hash = await bcrypt.hash(input.newPassword, 12);

  // 3. Update password in DB
  const { error } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('email', input.email);

  if (error) throw new AppError('Failed to reset password', 500);

  // 4. Delete OTP from Redis
  await redis.del(`otp:${input.email}`);

  // 5. Invalidate any existing refresh tokens
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.email)
    .single();

  if (user) await redis.del(`refresh:${user.id}`);
}