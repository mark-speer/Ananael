import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';

export const AUTH_COOKIE = 'ananael_token';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Require a strong JWT_SECRET (fail closed). */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is not configured or is too short (min 32 characters)'
    );
  }
  return secret;
}

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

/** Secure cookies require HTTPS — set COOKIE_SECURE=true behind TLS. */
function useSecureCookies(): boolean {
  return process.env.COOKIE_SECURE === 'true';
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
    secure: useSecureCookies(),
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: useSecureCookies(),
  });
}
