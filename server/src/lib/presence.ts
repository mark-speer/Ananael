import User from '../models/User';

/** Users seen within this window count as online. */
export const ONLINE_WINDOW_MS = 10 * 60 * 1000;

/** Skip DB writes if lastSeenAt was updated more recently than this. */
const TOUCH_THROTTLE_MS = 2 * 60 * 1000;

/**
 * Throttled presence update for an authenticated user.
 * Fire-and-forget safe: swallows errors so callers are not blocked.
 */
export async function touchLastSeen(userId: string): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - TOUCH_THROTTLE_MS);
    await User.updateOne(
      {
        _id: userId,
        $or: [{ lastSeenAt: null }, { lastSeenAt: { $exists: false } }, { lastSeenAt: { $lt: cutoff } }],
      },
      { $set: { lastSeenAt: new Date() } }
    );
  } catch (error) {
    console.error('touchLastSeen error:', error);
  }
}

/** Count users with lastSeenAt inside the online window. */
export async function countOnlineUsers(): Promise<number> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  return User.countDocuments({ lastSeenAt: { $gte: since } });
}
