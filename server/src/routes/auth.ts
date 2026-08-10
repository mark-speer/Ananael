import { Router, Request, Response } from 'express';
import User, { type IUser, type IUserLocation } from '../models/User';
import { AuthRequest, protect } from '../middleware/auth';
import {
  clearAuthCookie,
  setAuthCookie,
  signToken,
} from '../lib/authCookie';

const router = Router();

function serializeLocation(
  location: IUser['location']
): IUserLocation | null {
  if (
    !location ||
    typeof location.lat !== 'number' ||
    typeof location.lon !== 'number'
  ) {
    return null;
  }
  return { lat: location.lat, lon: location.lon };
}

function publicUser(user: IUser) {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    location: serializeLocation(user.location),
  };
}

function parseLocationBody(
  body: Record<string, unknown>
): { ok: true; location: IUserLocation } | { ok: false; message: string } {
  const lat = Number(body.lat);
  const lon = Number(body.lon);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return {
      ok: false,
      message: 'lat and lon must be valid numbers within range',
    };
  }
  return { ok: true, location: { lat, lon } };
}

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 * Sets HttpOnly auth cookie; returns { user } only.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets HttpOnly auth cookie; returns { user } only.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Password is select:false — explicitly include it for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password'
    );

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const match = await user.comparePassword(password);
    if (!match) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.json({
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the HttpOnly auth cookie.
 */
router.post('/logout', (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(204).send();
});

/**
 * GET /api/auth/user-count
 * Public total of registered users (for Magical OS header).
 */
router.get('/user-count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('User count error:', error);
    res.status(500).json({ message: 'Server error while counting users' });
  }
});

/**
 * GET /api/auth/me
 * Return the authenticated user (includes saved location).
 */
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Server error while loading profile' });
  }
});

/**
 * PUT /api/auth/location
 * Body: { lat, lon } — persist coordinates for Celestial Timing / sky tags.
 */
router.put(
  '/location',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = parseLocationBody(req.body as Record<string, unknown>);
      if (!parsed.ok) {
        res.status(400).json({ message: parsed.message });
        return;
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { location: parsed.location },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ user: publicUser(user) });
    } catch (error) {
      console.error('Auth location error:', error);
      res.status(500).json({ message: 'Server error while saving location' });
    }
  }
);

export default router;
