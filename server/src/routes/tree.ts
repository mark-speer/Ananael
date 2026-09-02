import { Router, Request, Response } from 'express';
import TreeNote, { TreeTargetType } from '../models/TreeNote';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';
import { Visibility } from '../types/visibility';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const VALID_TYPES: TreeTargetType[] = ['sephira', 'path'];

function isValidTarget(type: TreeTargetType, id: number): boolean {
  if (!Number.isInteger(id)) return false;
  if (type === 'sephira') return id >= 1 && id <= 10;
  if (type === 'path') return id >= 11 && id <= 32;
  return false;
}

function notePayload(note: {
  _id: unknown;
  userId?: unknown;
  date: Date;
  targetType: TreeTargetType;
  targetId: number;
  userNotes: string;
  visibility?: string;
}) {
  return {
    _id: note._id,
    date: note.date,
    targetType: note.targetType,
    targetId: note.targetId,
    userNotes: note.userNotes,
    visibility: note.visibility ?? Visibility.PRIVATE,
  };
}

/**
 * POST /api/tree/notes
 * Requires JWT. Saves a study note for a sephira or path.
 * Body: { targetType, targetId, userNotes }
 */
router.post('/notes', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, userNotes, visibility } = req.body as {
      targetType?: TreeTargetType;
      targetId?: number;
      userNotes?: string;
      visibility?: string;
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
      visibility: typeof visibility === 'string' && [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC].includes(visibility as any) ? visibility : Visibility.PRIVATE,
    });

    res.status(201).json({
      message: 'Note saved',
      note: notePayload(note),
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
      notes: notes.map((n) => notePayload(n as any)),
    });
  } catch (error) {
    console.error('Tree notes history error:', error);
    res.status(500).json({ message: 'Server error while loading notes' });
  }
});

/** Update sharing visibility for an owned tree note. */
router.put('/notes/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { visibility } = req.body as { visibility?: string };
    if (
      !visibility ||
      ![Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC].includes(
        visibility as Visibility
      )
    ) {
      res.status(400).json({ message: 'visibility must be private, unlisted, or public' });
      return;
    }
    const note = await TreeNote.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { visibility },
      { new: true }
    );
    if (!note) {
      res.status(404).json({ message: 'Tree note not found' });
      return;
    }
    res.json({ note: notePayload(note), message: 'Sharing settings updated' });
  } catch (error) {
    console.error('Tree note visibility update error:', error);
    res.status(500).json({ message: 'Server error while updating sharing settings' });
  }
});

/**
 * Public GET handler for shareable tree study notes.
 * Works without authentication if visibility is not private.
 */
const handlePublicTreeNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await TreeNote.findById(req.params.id);
    if (!note) {
      res.status(404).json({ message: 'Tree note not found' });
      return;
    }
    if (note.visibility === Visibility.PRIVATE) {
      res.status(403).json({ message: 'This tree note is private' });
      return;
    }
    const creatorUser = await User.findById(note.userId).lean();
    const creator = creatorUser ? toPublicUser(creatorUser) : null;
    res.json({
      ...notePayload(note),
      creator,
    });
  } catch (error) {
    console.error('Public tree note fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching public tree note' });
  }
};

router.get('/notes/:id/public', handlePublicTreeNote);
router.get('/:id/public', handlePublicTreeNote);

export default router;
