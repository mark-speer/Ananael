import { Router, Request, Response } from 'express';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';

const router = Router();

/**
 * GET /api/users/:userId/public
 * Public user profile (no authentication required).
 * Returns PublicUser DTO: _id, username, traditions, profileImageUrl, createdAt.
 * Never includes: email, natal, location, lastSeenAt, passwordHash.
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

export default router;
