import { Router, Request, Response } from 'express';
import PracticeVessel from '../models/PracticeVessel';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';
import { Visibility } from '../types/visibility';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

interface VesselBody {
  name?: string;
  config?: unknown;
  notes?: string;
  visibility?: string;
}

const VALID_VISIBILITIES = [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC];

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
  if (body.visibility !== undefined && (typeof body.visibility !== 'string' || !VALID_VISIBILITIES.includes(body.visibility as any))) {
    return 'visibility must be private, unlisted, or public';
  }
  return null;
}

function payload(vessel: {
  _id: unknown;
  date: Date;
  name: string;
  config: Record<string, unknown>;
  notes?: string;
  visibility?: string;
}) {
  return {
    _id: vessel._id,
    date: vessel.date,
    name: vessel.name,
    config: vessel.config,
    notes: vessel.notes ?? '',
    visibility: vessel.visibility ?? Visibility.PRIVATE,
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
      visibility: (body.visibility as any) ?? Visibility.PRIVATE,
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
    if (body.visibility) {
      vessel.visibility = body.visibility as any;
    }
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

/**
 * Public GET handler for shareable practice vessels.
 * Works without authentication if visibility is not private.
 */
const handlePublicPracticeVessel = async (req: Request, res: Response): Promise<void> => {
  try {
    const vessel = await PracticeVessel.findById(req.params.id);
    if (!vessel) {
      res.status(404).json({ message: 'Practice vessel not found' });
      return;
    }
    if (vessel.visibility === Visibility.PRIVATE) {
      res.status(403).json({ message: 'This practice vessel is private' });
      return;
    }
    const creatorUser = await User.findById(vessel.userId).lean();
    const creator = creatorUser ? toPublicUser(creatorUser) : null;
    res.json({
      ...payload(vessel),
      creator,
    });
  } catch (error) {
    console.error('Public practice vessel fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching public practice vessel' });
  }
};

router.get('/vessels/:id/public', handlePublicPracticeVessel);
router.get('/:id/public', handlePublicPracticeVessel);

export default router;
