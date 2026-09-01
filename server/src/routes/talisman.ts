import { Router, Request, Response } from 'express';
import TalismanDesign, {
  type TalismanKind,
} from '../models/TalismanDesign';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';
import { Visibility } from '../types/visibility';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

interface DesignBody {
  name?: string;
  kind?: string;
  config?: unknown;
  notes?: string;
  visibility?: string;
}

const VALID_VISIBILITIES = [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC];

function bodyError(body: DesignBody): string | null {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return 'name is required';
  }
  if (body.name.trim().length > 100) {
    return 'name must be at most 100 characters';
  }
  if (body.kind !== 'kamea' && body.kind !== 'sigil' && body.kind !== 'sutra') {
    return 'kind must be kamea, sigil, or sutra';
  }
  if (
    !body.config ||
    typeof body.config !== 'object' ||
    Array.isArray(body.config)
  ) {
    return 'config must be an object';
  }
  if (JSON.stringify(body.config).length > 100_000) {
    return 'config is too large';
  }
  if (body.notes !== undefined && typeof body.notes !== 'string') {
    return 'notes must be a string';
  }
  if (typeof body.notes === 'string' && body.notes.length > 5000) {
    return 'notes must be at most 5000 characters';
  }
  if (body.visibility !== undefined && (typeof body.visibility !== 'string' || !VALID_VISIBILITIES.includes(body.visibility as any))) {
    return 'visibility must be private, unlisted, or public';
  }
  return null;
}

function payload(design: {
  _id: unknown;
  date: Date;
  name: string;
  kind: TalismanKind;
  config: Record<string, unknown>;
  notes?: string;
  visibility?: string;
}) {
  return {
    _id: design._id,
    date: design.date,
    name: design.name,
    kind: design.kind,
    config: design.config,
    notes: design.notes ?? '',
    visibility: design.visibility ?? Visibility.PRIVATE,
  };
}

router.post('/designs', protect, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as DesignBody;
    const error = bodyError(body);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const design = await TalismanDesign.create({
      userId: req.userId,
      date: new Date(),
      name: body.name!.trim(),
      kind: body.kind as TalismanKind,
      config: body.config as Record<string, unknown>,
      notes: body.notes?.trim() ?? '',
      visibility: (body.visibility as any) ?? Visibility.PRIVATE,
    });
    res.status(201).json({
      message: 'Talisman design saved',
      design: payload(design),
    });
  } catch (error) {
    console.error('Talisman design save error:', error);
    res.status(500).json({ message: 'Server error while saving design' });
  }
});

router.get('/designs', protect, async (req: AuthRequest, res: Response) => {
  try {
    const designs = await TalismanDesign.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();
    res.json({ designs });
  } catch (error) {
    console.error('Talisman designs history error:', error);
    res.status(500).json({ message: 'Server error while loading designs' });
  }
});

router.put('/designs/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as DesignBody;
    const error = bodyError(body);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const design = await TalismanDesign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!design) {
      res.status(404).json({ message: 'Design not found' });
      return;
    }
    design.name = body.name!.trim();
    design.kind = body.kind as TalismanKind;
    design.config = body.config as Record<string, unknown>;
    design.notes = body.notes?.trim() ?? '';
    if (body.visibility) {
      design.visibility = body.visibility as any;
    }
    design.date = new Date();
    design.markModified('config');
    await design.save();
    res.json({
      message: 'Talisman design updated',
      design: payload(design),
    });
  } catch (error) {
    console.error('Talisman design update error:', error);
    res.status(500).json({ message: 'Server error while updating design' });
  }
});

router.delete(
  '/designs/:id',
  protect,
  async (req: AuthRequest, res: Response) => {
    try {
      const design = await TalismanDesign.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!design) {
        res.status(404).json({ message: 'Design not found' });
        return;
      }
      res.json({ message: 'Talisman design deleted' });
    } catch (error) {
      console.error('Talisman design delete error:', error);
      res.status(500).json({ message: 'Server error while deleting design' });
    }
  }
);

/**
 * Public GET handler for shareable talisman designs.
 * Works without authentication if visibility is not private.
 */
const handlePublicTalisman = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await TalismanDesign.findById(req.params.id);
    if (!design) {
      res.status(404).json({ message: 'Talisman design not found' });
      return;
    }
    if (design.visibility === Visibility.PRIVATE) {
      res.status(403).json({ message: 'This talisman design is private' });
      return;
    }
    const creatorUser = await User.findById(design.userId).lean();
    const creator = creatorUser ? toPublicUser(creatorUser) : null;
    res.json({
      ...payload(design),
      creator,
    });
  } catch (error) {
    console.error('Public talisman design fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching public design' });
  }
};

router.get('/designs/:id/public', handlePublicTalisman);
router.get('/:id/public', handlePublicTalisman);

export default router;
