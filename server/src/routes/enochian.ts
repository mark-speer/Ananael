import { Router, Response } from 'express';
import { AuthRequest, protect } from '../middleware/auth';
import EnochianNote, {
  type EnochianTargetType,
} from '../models/EnochianNote';

const router = Router();
const VALID_TYPES: EnochianTargetType[] = ['tablet', 'call', 'hierarchy'];

router.post(
  '/notes',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { targetType, targetId, userNotes } = req.body as {
        targetType?: EnochianTargetType;
        targetId?: string;
        userNotes?: string;
      };

      if (!targetType || !VALID_TYPES.includes(targetType)) {
        res.status(400).json({
          message: 'targetType must be tablet, call, or hierarchy',
        });
        return;
      }
      if (
        typeof targetId !== 'string' ||
        !targetId.trim() ||
        targetId.length > 100
      ) {
        res.status(400).json({ message: 'targetId is required' });
        return;
      }
      if (
        typeof userNotes !== 'string' ||
        !userNotes.trim() ||
        userNotes.length > 5000
      ) {
        res.status(400).json({
          message: 'userNotes is required and must be at most 5000 characters',
        });
        return;
      }

      const note = await EnochianNote.create({
        userId: req.userId,
        date: new Date(),
        targetType,
        targetId: targetId.trim(),
        userNotes: userNotes.trim(),
      });

      res.status(201).json({ message: 'Note saved', note });
    } catch (error) {
      console.error('Enochian note save error:', error);
      res.status(500).json({ message: 'Server error while saving note' });
    }
  }
);

router.get(
  '/notes',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notes = await EnochianNote.find({ userId: req.userId })
        .sort({ date: -1 })
        .limit(20)
        .lean();

      res.json({
        notes: notes.map((note) => ({
          _id: note._id,
          date: note.date,
          targetType: note.targetType,
          targetId: note.targetId,
          userNotes: note.userNotes,
        })),
      });
    } catch (error) {
      console.error('Enochian notes history error:', error);
      res.status(500).json({ message: 'Server error while loading notes' });
    }
  }
);

export default router;
