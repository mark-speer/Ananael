import { Router, Response } from 'express';
import TalismanDesign, {
  type TalismanKind,
} from '../models/TalismanDesign';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

interface DesignBody {
  name?: string;
  kind?: string;
  config?: unknown;
  notes?: string;
}

function bodyError(body: DesignBody): string | null {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return 'name is required';
  }
  if (body.name.trim().length > 100) {
    return 'name must be at most 100 characters';
  }
  if (body.kind !== 'kamea' && body.kind !== 'sigil') {
    return 'kind must be kamea or sigil';
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
  return null;
}

function payload(design: {
  _id: unknown;
  date: Date;
  name: string;
  kind: TalismanKind;
  config: Record<string, unknown>;
  notes?: string;
}) {
  return {
    _id: design._id,
    date: design.date,
    name: design.name,
    kind: design.kind,
    config: design.config,
    notes: design.notes ?? '',
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

export default router;
