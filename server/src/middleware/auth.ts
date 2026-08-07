import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_COOKIE, getJwtSecret } from '../lib/authCookie';

/** Augmented request with the authenticated user's id. */
export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  id: string;
}

/**
 * Verify HttpOnly JWT cookie and attach `userId` to the request.
 * Responds 401 when the token is missing or invalid.
 */
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;

  if (!token) {
    res.status(401).json({ message: 'Not authorized — no token provided' });
    return;
  }

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch {
    res.status(500).json({ message: 'JWT_SECRET is not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as JwtPayload;
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized — token invalid or expired' });
  }
};
