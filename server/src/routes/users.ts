import { Router, Request, Response } from 'express';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';

const router = Router();

/**
 * GET /api/users/:userId/public
 * Public user profile (no authentication required).
 * Returns PublicUser DTO: _id, username, traditions, profileImageUrl, createdAt.
 * Never includes: email, natal, location, lastSeenAt, passwordHash.
 * 
 * Visibility:
 * - private: returns 403 Forbidden (or 404 to not leak existence)
 * - unlisted: returns full profile
 * - public: returns full profile
 */
router.get('/:userId/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate userId looks like a valid ObjectId
    if (!userId || !/^[a-f0-9]{24}$/.test(userId)) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check visibility
    if (user.visibility === 'private') {
      res.status(403).json({ message: 'This profile is private' });
      return;
    }

    const publicUser = toPublicUser({
      _id: user._id.toString(),
      username: user.username,
      createdAt: user.createdAt,
    });

    res.json(publicUser);
  } catch (error) {
    console.error('Get public user error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

/**
 * GET /api/users/by-username/:username/public
 * Public user lookup by username.
 * Respects visibility field (private returns 403).
 */
router.get('/by-username/:username/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    if (!username || !/^[a-zA-Z0-9_]{3,40}$/.test(username)) {
      res.status(400).json({ message: 'Invalid username format' });
      return;
    }
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check visibility
    if (user.visibility === 'private') {
      res.status(403).json({ message: 'This profile is private' });
      return;
    }

    res.json(
      toPublicUser({
        _id: user._id.toString(),
        username: user.username,
        createdAt: user.createdAt,
      })
    );
  } catch (error) {
    console.error('Get public user by username error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

export default router;
