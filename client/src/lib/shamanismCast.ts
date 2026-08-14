/**
 * Cleromancy casts and pendulum log helpers.
 */

import { LOTS, getLot, type CleromancyLot, type LotId } from '../data/shamanism';

export type ShamanicCastMode = 'single' | 'three' | 'pendulum';

export const CAST_MODES: {
  id: ShamanicCastMode;
  label: string;
  description: string;
}[] = [
  { id: 'single', label: 'Single lot', description: 'One cleromancy lot' },
  {
    id: 'three',
    label: 'Three lots',
    description: 'Situation · Obstacle · Counsel',
  },
  {
    id: 'pendulum',
    label: 'Pendulum log',
    description: 'You record yes / maybe / no',
  },
];

export const THREE_POSITIONS = ['Situation', 'Obstacle', 'Counsel'] as const;

export type PendulumAnswer = 'yes' | 'maybe' | 'no';

export interface CastLot {
  lot: CleromancyLot;
  position: string;
}

export function positionsForMode(mode: ShamanicCastMode): string[] {
  if (mode === 'single') return ['Guidance'];
  if (mode === 'three') return [...THREE_POSITIONS];
  return ['Pendulum'];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export function castLots(mode: 'single' | 'three'): CastLot[] {
  const positions = positionsForMode(mode);
  const drawn = shuffle([...LOTS]).slice(0, positions.length);
  return drawn.map((lot, i) => ({
    lot,
    position: positions[i] ?? 'Guidance',
  }));
}

export function lotsFromIds(
  ids: LotId[],
  positions: string[]
): CastLot[] {
  return ids.map((id, i) => {
    const lot = getLot(id);
    if (!lot) throw new Error(`Unknown lot ${id}`);
    return { lot, position: positions[i] ?? 'Guidance' };
  });
}
