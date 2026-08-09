import { Router, Response } from 'express';
import PlanetaryChart from '../models/PlanetaryChart';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

interface ChartBody {
  name?: string;
  config?: unknown;
  notes?: string;
}

function bodyError(body: ChartBody): string | null {
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

function payload(chart: {
  _id: unknown;
  date: Date;
  name: string;
  config: Record<string, unknown>;
  notes?: string;
}) {
  return {
    _id: chart._id,
    date: chart.date,
    name: chart.name,
    config: chart.config,
    notes: chart.notes ?? '',
  };
}

router.post('/charts', protect, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as ChartBody;
    const error = bodyError(body);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const chart = await PlanetaryChart.create({
      userId: req.userId,
      date: new Date(),
      name: body.name!.trim(),
      config: body.config as Record<string, unknown>,
      notes: body.notes?.trim() ?? '',
    });
    res.status(201).json({
      message: 'Chart saved',
      chart: payload(chart),
    });
  } catch (error) {
    console.error('Planetary chart save error:', error);
    res.status(500).json({ message: 'Server error while saving chart' });
  }
});

router.get('/charts', protect, async (req: AuthRequest, res: Response) => {
  try {
    const charts = await PlanetaryChart.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();
    res.json({ charts });
  } catch (error) {
    console.error('Planetary charts history error:', error);
    res.status(500).json({ message: 'Server error while loading charts' });
  }
});

router.put('/charts/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as ChartBody;
    const error = bodyError(body);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const chart = await PlanetaryChart.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!chart) {
      res.status(404).json({ message: 'Chart not found' });
      return;
    }
    chart.name = body.name!.trim();
    chart.config = body.config as Record<string, unknown>;
    chart.notes = body.notes?.trim() ?? '';
    chart.date = new Date();
    chart.markModified('config');
    await chart.save();
    res.json({
      message: 'Chart updated',
      chart: payload(chart),
    });
  } catch (error) {
    console.error('Planetary chart update error:', error);
    res.status(500).json({ message: 'Server error while updating chart' });
  }
});

export default router;
