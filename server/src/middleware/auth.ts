import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** Augmented request with the authenticated user's id. */
export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  id: string;
}

/**
 * Verify Bearer JWT and attach `userId` to the request.
 * Responds 401 when the token is missing or invalid.
 */
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized — no token provided' });
    return;
  }

  const token = header.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: 'JWT_SECRET is not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized — token invalid or expired' });
  }
};
