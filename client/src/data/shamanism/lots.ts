/**
 * Generic cleromancy lots — a small public-domain-style casting set.
 * Not a named living bone, yarrow, or indigenous lots tradition.
 */

export const LOT_IDS = [
  'assent',
  'decline',
  'delay',
  'hidden',
  'ally',
  'warning',
  'path',
  'return',
] as const;

export type LotId = (typeof LOT_IDS)[number];

export interface CleromancyLot {
  id: LotId;
  name: string;
  keywords: readonly string[];
  meaning: string;
}

export const LOTS: readonly CleromancyLot[] = [
  {
    id: 'assent',
    name: 'Assent',
    keywords: ['yes', 'open', 'permission', 'go'],
    meaning:
      'The way is open. Affirmation, consent, or a green light — still walk with care.',
  },
  {
    id: 'decline',
    name: 'Decline',
    keywords: ['no', 'closed', 'refuse', 'stop'],
    meaning:
      'Not this, not now. A closed gate; forcing the matter would cost more than it returns.',
  },
  {
    id: 'delay',
    name: 'Delay',
    keywords: ['wait', 'timing', 'not-yet', 'patience'],
    meaning:
      'The answer is later. Hold the intention; conditions have not ripened.',
  },
  {
    id: 'hidden',
    name: 'Hidden',
    keywords: ['occult', 'unknown', 'veil', 'ask-again'],
    meaning:
      'Something essential is not in view. Seek another angle, ally, or night of work.',
  },
  {
    id: 'ally',
    name: 'Ally',
    keywords: ['help', 'companion', 'support', 'other'],
    meaning:
      'Do not go alone. A person, spirit-category, or skill wants to stand with you.',
  },
  {
    id: 'warning',
    name: 'Warning',
    keywords: ['caution', 'boundary', 'risk', 'shadow'],
    meaning:
      'A limit or hazard is live. Slow down; name what you will not bargain.',
  },
  {
    id: 'path',
    name: 'Path',
    keywords: ['way', 'movement', 'choice', 'road'],
    meaning:
      'Motion is the counsel. A road is indicated more than a destination.',
  },
  {
    id: 'return',
    name: 'Return',
    keywords: ['home', 'cycle', 'ground', 'integration'],
    meaning:
      'Come back. Integration, rest, or repeating a known good is wiser than a new departure.',
  },
];

export function getLot(id: string): CleromancyLot | undefined {
  return LOTS.find((l) => l.id === id);
}

export function searchLots(query: string): CleromancyLot[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...LOTS];
  return LOTS.filter((l) => {
    const hay = [l.id, l.name, l.meaning, ...l.keywords].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
