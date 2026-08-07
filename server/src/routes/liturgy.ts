import { Router } from 'express';

const router = Router();

const rites = [
  {
    id: 'lbrp',
    title: 'Lesser Banishing Ritual of the Pentagram',
    tradition: 'Golden Dawn',
    tags: ['banishing', 'pentagram', 'daily'],
  },
  {
    id: 'middle-pillar',
    title: 'Middle Pillar Exercise',
    tradition: 'Golden Dawn',
    tags: ['qabalah', 'energy', 'balance'],
  },
  {
    id: 'lhrp',
    title: 'Lesser Ritual of the Hexagram (sketch)',
    tradition: 'Golden Dawn',
    tags: ['hexagram', 'planetary'],
  },
  {
    id: 'heptameron-orison',
    title: 'Heptameron-style Orison (study sketch)',
    tradition: 'Heptameron',
    tags: ['solomonic', 'orison'],
  },
  {
    id: 'goetia-constraint',
    title: 'Goetia Constraint Prayer (study sketch)',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia'],
  },
];

router.get('/rites', (_req, res) => {
  res.json({ rites });
});

export default router;
