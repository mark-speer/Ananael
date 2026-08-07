import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE } from '../lib/authCookie';
import { getAllowedOrigins, isOriginAllowed } from '../lib/origins';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Paths that establish a session and do not yet rely on an auth cookie. */
const CSRF_SKIP_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
]);

/**
 * Origin/Referer CSRF check for cookie-authenticated mutating requests.
 * When an auth cookie is present, Origin (or Referer) must match CLIENT_ORIGIN.
 * Wildcard CLIENT_ORIGIN is rejected for these requests in production.
 */
export function csrfProtect(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (CSRF_SKIP_PATHS.has(req.path)) {
    next();
    return;
  }

  const hasAuthCookie = Boolean(req.cookies?.[AUTH_COOKIE]);
  if (!hasAuthCookie) {
    next();
    return;
  }

  const allowed = getAllowedOrigins();
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && allowed.includes('*')) {
    res.status(403).json({
      message: 'CSRF rejected — CLIENT_ORIGIN must not be * in production',
    });
    return;
  }

  const originHeader = req.get('origin');
  let origin = originHeader || null;

  if (!origin) {
    const referer = req.get('referer');
    if (referer) {
      try {
        origin = new URL(referer).origin;
      } catch {
        origin = null;
      }
    }
  }

  if (!origin || !isOriginAllowed(origin, allowed)) {
    res.status(403).json({ message: 'CSRF check failed — invalid origin' });
    return;
  }

  next();
}
