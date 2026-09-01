import { Router, Request, Response } from 'express';
import User, {
  type IUser,
  type IUserLocation,
  type IUserNatal,
} from '../models/User';
import { AuthRequest, protect } from '../middleware/auth';
import {
  clearAuthCookie,
  setAuthCookie,
  signToken,
} from '../lib/authCookie';
import { countOnlineUsers } from '../lib/presence';

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

function serializeNatal(natal: IUser['natal']): IUserNatal | null {
  if (!natal || typeof natal.birthDate !== 'string' || !natal.birthDate) {
    return null;
  }
  return {
    birthDate: natal.birthDate,
    birthTime: natal.birthTime ?? null,
    birthPlace: serializeLocation(natal.birthPlace ?? undefined),
    label: natal.label ?? null,
  };
}

/**
 * Returns full user data for authenticated endpoints (login, /auth/me).
 * Includes email, natal, location (private fields visible to account owner only).
 */
function fullUserResponse(user: IUser) {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    location: serializeLocation(user.location),
    natal: serializeNatal(user.natal),
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

function isValidBirthDate(date: unknown): date is string {
  if (typeof date !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function isValidBirthTime(time: unknown): time is string {
  if (typeof time !== 'string' || time === '') return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hh, mm] = time.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function parseNatalBody(
  body: Record<string, unknown>
): { ok: true; natal: IUserNatal } | { ok: false; message: string } {
  if (!isValidBirthDate(body.birthDate)) {
    return {
      ok: false,
      message: 'birthDate must be a valid YYYY-MM-DD date',
    };
  }

  let birthTime: string | null = null;
  if (body.birthTime != null && body.birthTime !== '') {
    if (!isValidBirthTime(body.birthTime)) {
      return { ok: false, message: 'birthTime must be HH:MM (24h)' };
    }
    birthTime = body.birthTime;
  }

  let birthPlace: IUserLocation | null = null;
  if (body.birthPlace != null && body.birthPlace !== '') {
    if (typeof body.birthPlace !== 'object') {
      return { ok: false, message: 'birthPlace must be { lat, lon }' };
    }
    const place = body.birthPlace as Record<string, unknown>;
    const parsed = parseLocationBody(place);
    if (!parsed.ok) {
      return { ok: false, message: `birthPlace: ${parsed.message}` };
    }
    birthPlace = parsed.location;
  }

  const label =
    typeof body.label === 'string' && body.label.trim()
      ? body.label.trim().slice(0, 80)
      : null;

  return {
    ok: true,
    natal: {
      birthDate: body.birthDate,
      birthTime,
      birthPlace,
      label,
    },
  };
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
      lastSeenAt: new Date(),
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({
      user: fullUserResponse(user),
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

    try {
      await User.updateOne(
        { _id: user._id },
        { $set: { lastSeenAt: new Date() } }
      );
    } catch (error) {
      console.error('Login lastSeenAt update error:', error);
    }

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.json({
      user: fullUserResponse(user),
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
 * Public total registered users and currently online practitioners.
 */
router.get('/user-count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [count, online] = await Promise.all([
      User.countDocuments(),
      countOnlineUsers(),
    ]);
    res.json({ count, online });
  } catch (error) {
    console.error('User count error:', error);
    res.status(500).json({ message: 'Server error while counting users' });
  }
});

/**
 * POST /api/auth/presence
 * Heartbeat for idle authenticated clients (updates lastSeenAt).
 */
router.post(
  '/presence',
  protect,
  (_req: AuthRequest, res: Response): void => {
    // protect already touches lastSeenAt
    res.status(204).send();
  }
);

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
    res.json({ user: fullUserResponse(user) });
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

      res.json({ user: fullUserResponse(user) });
      res.status(500).json({ message: 'Server error while saving location' });
    }
  }
);

/**
 * PUT /api/auth/natal
 * Body: { birthDate, birthTime?, birthPlace?, label? } — natal birth profile.
 */
router.put(
  '/natal',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = parseNatalBody(req.body as Record<string, unknown>);
      if (!parsed.ok) {
        res.status(400).json({ message: parsed.message });
        return;
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { natal: parsed.natal },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ user: fullUserResponse(user) });
    } catch (error) {
      console.error('Auth natal error:', error);
      res.status(500).json({ message: 'Server error while saving natal profile' });
    }
  }
);

export default router;
