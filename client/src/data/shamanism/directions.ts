/**
 * Direction-wheel presets. Labels are comparative study defaults
 * (elemental quarters), not a closed indigenous medicine-wheel teaching.
 */

export type DirectionId =
  | 'east'
  | 'south'
  | 'west'
  | 'north'
  | 'above'
  | 'below'
  | 'center';

export type DirectionTraditionId = 'four' | 'six' | 'seven';

export interface ShamanicDirection {
  id: DirectionId;
  name: string;
  element?: string;
  keywords: string[];
  notes?: string;
}

export interface DirectionTradition {
  id: DirectionTraditionId;
  name: string;
  description: string;
  directionIds: DirectionId[];
}

export const DIRECTIONS: ShamanicDirection[] = [
  {
    id: 'east',
    name: 'East',
    element: 'Air',
    keywords: ['dawn', 'breath', 'beginnings', 'vision'],
    notes: 'Quarter of sunrise in many circular cosmologies (study default).',
  },
  {
    id: 'south',
    name: 'South',
    element: 'Fire',
    keywords: ['noon', 'vitality', 'growth', 'heat'],
    notes: 'Quarter of height and warmth in the common elemental wheel.',
  },
  {
    id: 'west',
    name: 'West',
    element: 'Water',
    keywords: ['dusk', 'emotion', 'release', 'dream'],
    notes: 'Quarter of sunset and the waters in the common elemental wheel.',
  },
  {
    id: 'north',
    name: 'North',
    element: 'Earth',
    keywords: ['midnight', 'ancestors', 'endurance', 'body'],
    notes: 'Quarter of night and earth in the common elemental wheel.',
  },
  {
    id: 'above',
    name: 'Above',
    element: 'Spirit',
    keywords: ['sky', 'upper', 'teachers', 'stars'],
    notes: 'Zenith / Upper World marker on six- and seven-direction wheels.',
  },
  {
    id: 'below',
    name: 'Below',
    element: 'Earth',
    keywords: ['roots', 'lower', 'underworld', 'soil'],
    notes: 'Nadir / Lower World marker on six- and seven-direction wheels.',
  },
  {
    id: 'center',
    name: 'Center',
    element: 'Spirit',
    keywords: ['axis', 'self', 'hearth', 'world-tree'],
    notes: 'The practitioner and the axis mundi; seven-direction wheels include it explicitly.',
  },
];

export const DIRECTION_TRADITIONS: DirectionTradition[] = [
  {
    id: 'four',
    name: 'Four quarters',
    description: 'East, South, West, North — elemental wheel used as a study default.',
    directionIds: ['east', 'south', 'west', 'north'],
  },
  {
    id: 'six',
    name: 'Six directions',
    description: 'The four quarters plus Above and Below (axis mundi).',
    directionIds: ['east', 'south', 'west', 'north', 'above', 'below'],
  },
  {
    id: 'seven',
    name: 'Seven directions',
    description: 'Six directions plus Center — the practitioner as the axis.',
    directionIds: ['east', 'south', 'west', 'north', 'above', 'below', 'center'],
  },
];

export function getDirection(id: string): ShamanicDirection | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}

export function getDirectionTradition(
  id: string
): DirectionTradition | undefined {
  return DIRECTION_TRADITIONS.find((t) => t.id === id);
}

export function directionsForTradition(
  traditionId: string
): ShamanicDirection[] {
  const t = getDirectionTradition(traditionId);
  if (!t) return [];
  return t.directionIds
    .map((id) => getDirection(id))
    .filter((d): d is ShamanicDirection => Boolean(d));
}

export function searchDirections(query: string): ShamanicDirection[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...DIRECTIONS];
  return DIRECTIONS.filter((d) => {
    const hay = [d.id, d.name, d.element ?? '', d.notes ?? '', ...d.keywords]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
