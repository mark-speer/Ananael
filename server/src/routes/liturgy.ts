import { Router } from 'express';

const router = Router();

const rites = [
  {
    id: 'lbrp',
    title: 'Lesser Banishing Ritual of the Pentagram',
    tradition: 'Golden Dawn',
    tags: ['banishing', 'pentagram', 'daily', 'qabalah'],
  },
  {
    id: 'middle-pillar',
    title: 'Middle Pillar Exercise',
    tradition: 'Golden Dawn',
    tags: ['qabalah', 'energy', 'balance', 'daily'],
  },
  {
    id: 'lhrp',
    title: 'Lesser Ritual of the Hexagram',
    tradition: 'Golden Dawn',
    tags: ['hexagram', 'planetary', 'banishing', 'invoking'],
  },
  {
    id: 'sirp',
    title: 'Supreme Invoking Ritual of the Pentagram',
    tradition: 'Golden Dawn',
    tags: ['invoking', 'pentagram', 'elemental', 'opening'],
  },
  {
    id: 'rose-cross',
    title: 'Ritual of the Rose Cross',
    tradition: 'Golden Dawn',
    tags: ['protection', 'hexagram', 'healing', 'invisibility'],
  },
  {
    id: 'watchtower',
    title: 'Opening by Watchtower',
    tradition: 'Golden Dawn',
    tags: ['enochian', 'elemental', 'opening', 'watchtower'],
  },
  {
    id: 'heptameron-orison',
    title: 'Heptameron-style Orison',
    tradition: 'Heptameron',
    tags: ['solomonic', 'orison', 'consecration', 'angels'],
  },
  {
    id: 'heptameron-angel',
    title: 'Heptameron — Angel of the Day',
    tradition: 'Heptameron',
    tags: ['solomonic', 'angels', 'planetary', 'invocation'],
  },
  {
    id: 'circle-consecration',
    title: 'Consecration of the Circle',
    tradition: 'Heptameron',
    tags: ['solomonic', 'circle', 'consecration', 'protection'],
  },
  {
    id: 'goetia-conjuration',
    title: 'Goetia — First Conjuration',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia', 'conjuration', 'spirit'],
  },
  {
    id: 'goetia-constraint',
    title: 'Goetia — Constraint',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia', 'constraint', 'spirit'],
  },
  {
    id: 'goetia-license',
    title: 'Goetia — License to Depart',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia', 'dismissal', 'closing'],
  },
  {
    id: 'solar-adorations',
    title: 'Solar Adorations (Liber Resh–style)',
    tradition: 'Thelemic',
    tags: ['solar', 'daily', 'adoration', 'liber-resh'],
  },
  {
    id: 'tool-consecration',
    title: 'Consecration of Implements',
    tradition: 'General',
    tags: ['consecration', 'tools', 'altar', 'preparation'],
  },
  {
    id: 'alchemy-vessel',
    title: 'Consecration of the Vessel',
    tradition: 'Alchemy',
    tags: ['alchemy', 'consecration', 'vessel', 'athanor', 'oratory'],
  },
  {
    id: 'alchemy-tria-prima',
    title: 'Oratory of the Tria Prima',
    tradition: 'Alchemy',
    tags: ['alchemy', 'salt', 'sulfur', 'mercury', 'oratory', 'principles'],
  },
  {
    id: 'alchemy-solve-coagula',
    title: 'Solve et Coagula Working',
    tradition: 'Alchemy',
    tags: ['alchemy', 'solve', 'coagula', 'spagyria', 'working'],
  },
  {
    id: 'alchemy-metal-day',
    title: 'Dedication of the Metal of the Day',
    tradition: 'Alchemy',
    tags: ['alchemy', 'metal', 'planetary', 'dedication', 'daily'],
  },
  {
    id: 'chakra-circulation',
    title: 'Seven-Center Breath & Light',
    tradition: 'Yoga',
    tags: ['chakra', 'energy', 'daily', 'pranayama'],
  },
  {
    id: 'nadi-shodhana',
    title: 'Alternate Nostril Breathing',
    tradition: 'Yoga',
    tags: ['pranayama', 'balance', 'daily'],
  },
  {
    id: 'ba-duan-jin',
    title: 'Eight Brocades (study outline)',
    tradition: 'Taoist',
    tags: ['qigong', 'movement', 'daily'],
  },
  {
    id: 'zhan-zhuang',
    title: 'Standing Meditation',
    tradition: 'Taoist',
    tags: ['qigong', 'stillness', 'daily'],
  },
  {
    id: 'microcosmic-orbit',
    title: 'Microcosmic Orbit (intro)',
    tradition: 'Taoist',
    tags: ['qigong', 'energy', 'neidan'],
  },
  {
    id: 'inner-smile',
    title: 'Inner Smile (intro)',
    tradition: 'Taoist',
    tags: ['meditation', 'taoist', 'daily'],
  },
];

router.get('/rites', (_req, res) => {
  res.json({ rites });
});

export default router;
