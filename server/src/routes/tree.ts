import { Router, Response } from 'express';
import TreeNote, { TreeTargetType } from '../models/TreeNote';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const VALID_TYPES: TreeTargetType[] = ['sephira', 'path'];

function isValidTarget(type: TreeTargetType, id: number): boolean {
  if (!Number.isInteger(id)) return false;
  if (type === 'sephira') return id >= 1 && id <= 10;
  if (type === 'path') return id >= 11 && id <= 32;
  return false;
}

/**
 * POST /api/tree/notes
 * Requires JWT. Saves a study note for a sephira or path.
 * Body: { targetType, targetId, userNotes }
 */
router.post('/notes', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, userNotes } = req.body as {
      targetType?: TreeTargetType;
      targetId?: number;
      userNotes?: string;
    };

    if (!targetType || !VALID_TYPES.includes(targetType)) {
      res.status(400).json({
        message: 'targetType must be one of: sephira, path',
      });
      return;
    }

    if (typeof targetId !== 'number' || !isValidTarget(targetType, targetId)) {
      res.status(400).json({
        message:
          targetType === 'sephira'
            ? 'targetId must be an integer from 1 to 10 for sephira'
            : 'targetId must be an integer from 11 to 32 for path',
      });
      return;
    }

    if (typeof userNotes !== 'string' || !userNotes.trim()) {
      res.status(400).json({ message: 'userNotes is required' });
      return;
    }

    if (userNotes.length > 5000) {
      res.status(400).json({ message: 'userNotes must be at most 5000 characters' });
      return;
    }

    const note = await TreeNote.create({
      userId: req.userId,
      date: new Date(),
      targetType,
      targetId,
      userNotes: userNotes.trim(),
    });

    res.status(201).json({
      message: 'Note saved',
      note: {
        _id: note._id,
        userId: note.userId,
        date: note.date,
        targetType: note.targetType,
        targetId: note.targetId,
        userNotes: note.userNotes,
      },
    });
  } catch (error) {
    console.error('Tree note save error:', error);
    res.status(500).json({ message: 'Server error while saving note' });
  }
});

/**
 * GET /api/tree/notes
 * Requires JWT. Returns the authenticated user's recent study notes (newest first).
 */
router.get('/notes', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notes = await TreeNote.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    res.json({
      notes: notes.map((n) => ({
        _id: n._id,
        date: n.date,
        targetType: n.targetType,
        targetId: n.targetId,
        userNotes: n.userNotes,
      })),
    });
  } catch (error) {
    console.error('Tree notes history error:', error);
    res.status(500).json({ message: 'Server error while loading notes' });
  }
});

export default router;
