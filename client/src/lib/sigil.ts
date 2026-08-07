/**
 * Sigil path helpers — kamea tracing and chaos letter-elimination.
 */

import { findCell, getKamea, type KameaPlanet } from './kamea';

export function normalizeLetters(text: string): string {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

export const normalizeName = normalizeLetters;

/** A=1 … I=9, J=1 … R=9, S=1 … Z=8 (Agrippa-style reduction onto 1–9). */
export function letterToKameaValue(ch: string): number {
  const code = ch.toUpperCase().charCodeAt(0) - 64;
  if (code < 1 || code > 26) return 0;
  const v = ((code - 1) % 9) + 1;
  return v;
}

export interface Point {
  x: number;
  y: number;
}

export type SigilPoint = Point;

/** Map name onto kamea cell centers in a square viewBox of side `size`. */
export function kameaSigilPath(
  planet: KameaPlanet,
  name: string,
  size = 100
): Point[] {
  const grid = getKamea(planet);
  const n = grid.length;
  const cell = size / n;
  const letters = normalizeLetters(name);
  const points: Point[] = [];
  for (const ch of letters) {
    let value = letterToKameaValue(ch);
    if (!value) continue;
    // Wrap into square range
    const max = n * n;
    while (value > max) value -= 9;
    if (value < 1) continue;
    const cellPos = findCell(grid, value);
    if (!cellPos) continue;
    points.push({
      x: cellPos.col * cell + cell / 2,
      y: cellPos.row * cell + cell / 2,
    });
  }
  return points;
}

/**
 * Chaos-style: remove vowels, collapse duplicate consonants, place on a circle.
 */
export function chaosSigilPoints(
  text: string,
  width: number,
  height: number
): Point[] {
  const letters = normalizeLetters(text)
    .replace(/[AEIOU]/g, '')
    .split('')
    .filter((ch, i, arr) => arr.indexOf(ch) === i);
  if (letters.length === 0) return [];
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;
  return letters.map((ch, i) => {
    const angle =
      -Math.PI / 2 + (i / letters.length) * Math.PI * 2 + (ch.charCodeAt(0) % 7) * 0.05;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

export function pointsToPolyline(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}
