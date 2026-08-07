export type FigureId =
  | 'via'
  | 'populus'
  | 'conjunctio'
  | 'carcer'
  | 'fortuna-major'
  | 'fortuna-minor'
  | 'acquisitio'
  | 'amissio'
  | 'laetitia'
  | 'tristitia'
  | 'albus'
  | 'rubeus'
  | 'puer'
  | 'puella'
  | 'caput-draconis'
  | 'cauda-draconis';

export type GeomanticRows = readonly [boolean, boolean, boolean, boolean];

export interface GeomanticFigure {
  id: FigureId;
  latin: string;
  english: string;
  /** Fire, air, water, earth; true is a single (odd/active) point. */
  rows: GeomanticRows;
  planet: string;
  zodiac: string;
  keywords: readonly string[];
  meaning: string;
}

export const GEOMANTIC_FIGURES: readonly GeomanticFigure[] = [
  {
    id: 'via', latin: 'Via', english: 'The Way',
    rows: [true, true, true, true], planet: 'Moon', zodiac: 'Cancer',
    keywords: ['change', 'journey', 'movement', 'transition'],
    meaning: 'Via opens a road and sets events in motion. It favors travel and change, though the outcome may remain fluid.',
  },
  {
    id: 'populus', latin: 'Populus', english: 'The People',
    rows: [false, false, false, false], planet: 'Moon', zodiac: 'Cancer',
    keywords: ['community', 'receptivity', 'reflection', 'multitude'],
    meaning: 'Populus receives and reflects surrounding influences. Groups and circumstances matter more than individual initiative.',
  },
  {
    id: 'conjunctio', latin: 'Conjunctio', english: 'Conjunction',
    rows: [false, true, true, false], planet: 'Mercury', zodiac: 'Virgo',
    keywords: ['meeting', 'union', 'communication', 'exchange'],
    meaning: 'Conjunctio brings separate paths together for exchange or agreement. The result depends on what is being joined.',
  },
  {
    id: 'carcer', latin: 'Carcer', english: 'The Prison',
    rows: [true, false, false, true], planet: 'Saturn', zodiac: 'Capricorn',
    keywords: ['restriction', 'structure', 'delay', 'endurance'],
    meaning: 'Carcer binds, limits, and stabilizes. It warns of delay but supports discipline, boundaries, and durable work.',
  },
  {
    id: 'fortuna-major', latin: 'Fortuna Major', english: 'Greater Fortune',
    rows: [true, true, false, false], planet: 'Sun', zodiac: 'Leo',
    keywords: ['success', 'power', 'stability', 'protection'],
    meaning: 'Fortuna Major promises lasting success grounded in inner strength. It favors important undertakings and sustained achievement.',
  },
  {
    id: 'fortuna-minor', latin: 'Fortuna Minor', english: 'Lesser Fortune',
    rows: [false, false, true, true], planet: 'Sun', zodiac: 'Leo',
    keywords: ['swift success', 'assistance', 'momentum', 'opportunity'],
    meaning: 'Fortuna Minor grants quick or outward success, often through timely help. Its benefits may fade unless firmly established.',
  },
  {
    id: 'acquisitio', latin: 'Acquisitio', english: 'Gain',
    rows: [false, true, false, true], planet: 'Jupiter', zodiac: 'Sagittarius',
    keywords: ['gain', 'growth', 'profit', 'expansion'],
    meaning: 'Acquisitio increases what is sought and favors material or spiritual gain. It encourages expansion and opportunity.',
  },
  {
    id: 'amissio', latin: 'Amissio', english: 'Loss',
    rows: [true, false, true, false], planet: 'Venus', zodiac: 'Taurus',
    keywords: ['loss', 'release', 'sacrifice', 'letting go'],
    meaning: 'Amissio signifies decrease, surrender, or something passing away. It can favor release or freedom from attachment.',
  },
  {
    id: 'laetitia', latin: 'Laetitia', english: 'Joy',
    rows: [true, false, false, false], planet: 'Jupiter', zodiac: 'Pisces',
    keywords: ['joy', 'uplift', 'hope', 'spiritual growth'],
    meaning: 'Laetitia rises toward happiness, relief, and a widening horizon. It favors spiritual matters and hopeful beginnings.',
  },
  {
    id: 'tristitia', latin: 'Tristitia', english: 'Sorrow',
    rows: [false, false, false, true], planet: 'Saturn', zodiac: 'Aquarius',
    keywords: ['sorrow', 'gravity', 'decline', 'contemplation'],
    meaning: 'Tristitia descends into seriousness or necessary withdrawal. It favors sober reflection and patient, deep work.',
  },
  {
    id: 'albus', latin: 'Albus', english: 'The White',
    rows: [false, true, false, false], planet: 'Mercury', zodiac: 'Gemini',
    keywords: ['wisdom', 'clarity', 'peace', 'counsel'],
    meaning: 'Albus brings calm intelligence, clear speech, and prudent counsel. It favors study, healing, and measured decisions.',
  },
  {
    id: 'rubeus', latin: 'Rubeus', english: 'The Red',
    rows: [false, false, true, false], planet: 'Mars', zodiac: 'Scorpio',
    keywords: ['passion', 'danger', 'impulse', 'upheaval'],
    meaning: 'Rubeus unleashes passion, volatility, and disruptive force. It counsels restraint unless rupture is truly required.',
  },
  {
    id: 'puer', latin: 'Puer', english: 'The Boy',
    rows: [true, true, false, true], planet: 'Mars', zodiac: 'Aries',
    keywords: ['action', 'courage', 'conflict', 'impulse'],
    meaning: 'Puer acts quickly with courage and martial force. It helps decisive action but can bring rashness or contention.',
  },
  {
    id: 'puella', latin: 'Puella', english: 'The Girl',
    rows: [true, false, true, true], planet: 'Venus', zodiac: 'Libra',
    keywords: ['harmony', 'beauty', 'relationship', 'reconciliation'],
    meaning: 'Puella seeks harmony, attraction, and graceful accord. It favors relationships and artistry over force.',
  },
  {
    id: 'caput-draconis', latin: 'Caput Draconis', english: "Dragon's Head",
    rows: [false, true, true, true], planet: 'North Node', zodiac: 'Sagittarius',
    keywords: ['beginning', 'entrance', 'increase', 'opening'],
    meaning: 'Caput Draconis marks an entrance, auspicious beginning, or upward turn. It supports matters that should grow.',
  },
  {
    id: 'cauda-draconis', latin: 'Cauda Draconis', english: "Dragon's Tail",
    rows: [true, true, true, false], planet: 'South Node', zodiac: 'Gemini',
    keywords: ['ending', 'departure', 'purging', 'release'],
    meaning: 'Cauda Draconis closes a cycle and expels what has run its course. It favors endings, cleansing, and separation.',
  },
];

export const GEOMANTIC_FIGURES_BY_ID = Object.fromEntries(
  GEOMANTIC_FIGURES.map((figure) => [figure.id, figure])
) as Record<FigureId, GeomanticFigure>;

const IDS_BY_ROWS = new Map(
  GEOMANTIC_FIGURES.map((figure) => [
    figure.rows.map(Number).join(''),
    figure.id,
  ])
);

export function figureIdFromRows(rows: GeomanticRows): FigureId {
  const id = IDS_BY_ROWS.get(rows.map(Number).join(''));
  if (!id) throw new Error('Unknown geomantic figure');
  return id;
}
