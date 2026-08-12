import { Router, Response } from 'express';
import PracticeVessel from '../models/PracticeVessel';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

interface VesselBody {
  name?: string;
  config?: unknown;
  notes?: string;
}

function bodyError(body: VesselBody): string | null {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return 'name is required';
  }
  if (body.name.trim().length > 100) {
    return 'name must be at most 100 characters';
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

function payload(vessel: {
  _id: unknown;
  date: Date;
  name: string;
  config: Record<string, unknown>;
  notes?: string;
}) {
  return {
    _id: vessel._id,
    date: vessel.date,
    name: vessel.name,
    config: vessel.config,
    notes: vessel.notes ?? '',
  };
}

router.post('/vessels', protect, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as VesselBody;
    const error = bodyError(body);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const vessel = await PracticeVessel.create({
      userId: req.userId,
      date: new Date(),
      name: body.name!.trim(),
      config: body.config as Record<string, unknown>,
      notes: body.notes?.trim() ?? '',
    });
    res.status(201).json({
      message: 'Practice vessel saved',
      vessel: payload(vessel),
    });
  } catch (error) {
    console.error('Practice vessel save error:', error);
    res.status(500).json({ message: 'Server error while saving practice vessel' });
  }
});

router.get('/vessels', protect, async (req: AuthRequest, res: Response) => {
  try {
    const vessels = await PracticeVessel.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();
    res.json({ vessels });
  } catch (error) {
    console.error('Practice vessels history error:', error);
    res.status(500).json({ message: 'Server error while loading practice vessels' });
  }
});

router.put('/vessels/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as VesselBody;
    const error = bodyError(body);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const vessel = await PracticeVessel.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!vessel) {
      res.status(404).json({ message: 'Practice vessel not found' });
      return;
    }
    vessel.name = body.name!.trim();
    vessel.config = body.config as Record<string, unknown>;
    vessel.notes = body.notes?.trim() ?? '';
    vessel.date = new Date();
    vessel.markModified('config');
    await vessel.save();
    res.json({
      message: 'Practice vessel updated',
      vessel: payload(vessel),
    });
  } catch (error) {
    console.error('Practice vessel update error:', error);
    res.status(500).json({ message: 'Server error while updating practice vessel' });
  }
});

export default router;
