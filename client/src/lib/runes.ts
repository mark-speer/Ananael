import { RUNES, type Rune } from '../data/runes';

export type CastMode = 'single' | 'norn' | 'cross';
export type RuneCastMode = CastMode;

export interface CastRune {
  rune: Rune;
  isReversed: boolean;
  position: string;
}

export const RUNE_POSITIONS: Record<CastMode, string[]> = {
  single: ['Guidance'],
  norn: ['Past', 'Present', 'Future'],
  cross: ['Overview', 'Challenge', 'Counsel', 'Foundation', 'Outcome'],
};

export function positionsForMode(mode: CastMode): string[] {
  return RUNE_POSITIONS[mode];
}

const REVERSAL_CHANCE = 0.2;

/** Draws the requested spread without replacement, with a ~20% reversal chance. */
export function castRunes(mode: CastMode): CastRune[] {
  const pool = [...RUNES];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return RUNE_POSITIONS[mode].map((position, index) => ({
    rune: pool[index],
    isReversed: Math.random() < REVERSAL_CHANCE,
    position,
  }));
}
