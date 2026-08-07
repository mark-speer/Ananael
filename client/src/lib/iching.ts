/**
 * I Ching casting: three-coin and yarrow stalk simulation.
 * Line values: 6 old yin, 7 young yang, 8 young yin, 9 old yang.
 * Lines are ordered bottom → top (index 0 = first / bottom line).
 */

import { KING_WEN_BY_BINARY } from '../data/iching';

export type CastMethod = 'coins' | 'yarrow';

export type LineValue = 6 | 7 | 8 | 9;

export interface CastResult {
  method: CastMethod;
  /** Six lines, bottom → top */
  lines: LineValue[];
  /** King Wen numbers 1–64 */
  primaryNumber: number;
  /** Relating hexagram when any line changes; null otherwise */
  relatingNumber: number | null;
  /** 0-based line indices that are changing (6 or 9) */
  changingLines: number[];
}

/** True if the line is yang (solid). */
export function isYang(line: LineValue): boolean {
  return line === 7 || line === 9;
}

/** True if the line is changing (old). */
export function isChanging(line: LineValue): boolean {
  return line === 6 || line === 9;
}

/** Convert six lines to a 0–63 binary index (bottom = LSB). */
export function linesToBinary(lines: LineValue[]): number {
  let value = 0;
  for (let i = 0; i < 6; i++) {
    if (isYang(lines[i])) {
      value |= 1 << i;
    }
  }
  return value;
}

/** Map six lines to King Wen hexagram number 1–64. */
export function linesToKingWen(lines: LineValue[]): number {
  return KING_WEN_BY_BINARY[linesToBinary(lines)];
}

/** Flip a changing line for the relating hexagram. */
function flipLine(line: LineValue): LineValue {
  if (line === 6) return 7; // old yin → young yang
  if (line === 9) return 8; // old yang → young yin
  return line;
}

/**
 * Three-coin method.
 * Heads = 3, tails = 2. Sums: 6/7/8/9 each with coin probabilities 1/8, 3/8, 3/8, 1/8.
 */
export function castCoinLine(): LineValue {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += Math.random() < 0.5 ? 2 : 3;
  }
  return sum as LineValue;
}

/**
 * Yarrow stalk probabilities (traditional):
 * 6: 1/16, 7: 5/16, 8: 7/16, 9: 3/16.
 */
export function castYarrowLine(): LineValue {
  const r = Math.floor(Math.random() * 16);
  if (r === 0) return 6;
  if (r <= 5) return 7;
  if (r <= 12) return 8;
  return 9;
}

function buildCast(method: CastMethod, lines: LineValue[]): CastResult {
  const changingLines = lines
    .map((line, index) => (isChanging(line) ? index : -1))
    .filter((index) => index >= 0);

  const primaryNumber = linesToKingWen(lines);

  let relatingNumber: number | null = null;
  if (changingLines.length > 0) {
    const relatingLines = lines.map(flipLine) as LineValue[];
    relatingNumber = linesToKingWen(relatingLines);
  }

  return {
    method,
    lines,
    primaryNumber,
    relatingNumber,
    changingLines,
  };
}

/** Cast six lines with the three-coin method (bottom → top). */
export function castCoins(): CastResult {
  const lines: LineValue[] = [];
  for (let i = 0; i < 6; i++) {
    lines.push(castCoinLine());
  }
  return buildCast('coins', lines);
}

/** Cast six lines with yarrow stalk probabilities (bottom → top). */
export function castYarrow(): CastResult {
  const lines: LineValue[] = [];
  for (let i = 0; i < 6; i++) {
    lines.push(castYarrowLine());
  }
  return buildCast('yarrow', lines);
}

export function cast(method: CastMethod): CastResult {
  return method === 'yarrow' ? castYarrow() : castCoins();
}
