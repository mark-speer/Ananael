/**
 * Stroke-path definitions for classic alchemical glyphs.
 * Coordinates are in a 100×100 viewBox; renderers scale/rotate around (50,50).
 */

export type AlchemicalGlyphId =
  | 'alchemy_fire'
  | 'alchemy_water'
  | 'alchemy_air'
  | 'alchemy_earth'
  | 'alchemy_sun'
  | 'alchemy_moon'
  | 'alchemy_mercury'
  | 'alchemy_venus'
  | 'alchemy_mars'
  | 'alchemy_jupiter'
  | 'alchemy_saturn'
  | 'alchemy_salt'
  | 'alchemy_sulfur';

export const ALCHEMICAL_VIEWBOX = 100;
export const ALCHEMICAL_CENTER = 50;

/** Closed or open stroke paths for each symbol (fill=none). */
export const ALCHEMICAL_GLYPH_PATHS: Record<AlchemicalGlyphId, string[]> = {
  // △ upright triangle
  alchemy_fire: ['M 50 12 L 88 82 L 12 82 Z'],
  // ▽ inverted triangle
  alchemy_water: ['M 12 18 L 88 18 L 50 88 Z'],
  // △ with mid bar
  alchemy_air: ['M 50 12 L 88 82 L 12 82 Z', 'M 28 52 L 72 52'],
  // ▽ with mid bar
  alchemy_earth: ['M 12 18 L 88 18 L 50 88 Z', 'M 28 48 L 72 48'],
  // ☉ circle + center dot (dot as small crosshair circle)
  alchemy_sun: ['M 50 18 A 32 32 0 1 1 49.99 18', 'M 50 44 A 6 6 0 1 1 49.99 44'],
  // ☽ crescent (two arcs)
  alchemy_moon: ['M 62 20 A 30 30 0 1 0 62 80 A 22 22 0 1 1 62 20'],
  // ☿ horns + circle + cross
  alchemy_mercury: [
    'M 32 22 A 18 14 0 0 1 68 22',
    'M 50 28 A 18 18 0 1 1 49.99 28',
    'M 50 64 L 50 88',
    'M 36 76 L 64 76',
  ],
  // ♀ circle + cross
  alchemy_venus: [
    'M 50 18 A 22 22 0 1 1 49.99 18',
    'M 50 62 L 50 88',
    'M 34 74 L 66 74',
  ],
  // ♂ circle + arrow NE
  alchemy_mars: [
    'M 42 38 A 22 22 0 1 1 41.99 38',
    'M 56 28 L 78 12',
    'M 60 12 L 78 12 L 78 30',
  ],
  // ♃ stylized (curve + crosses)
  alchemy_jupiter: [
    'M 68 18 Q 28 22 32 52 Q 36 78 72 82',
    'M 28 48 L 58 48',
    'M 44 36 L 44 62',
  ],
  // ♄ cross + sickle
  alchemy_saturn: [
    'M 58 18 L 58 72',
    'M 42 42 L 74 42',
    'M 58 18 A 22 22 0 0 0 28 42',
  ],
  // 🜔 circle with diameter
  alchemy_salt: [
    'M 50 18 A 32 32 0 1 1 49.99 18',
    'M 18 50 L 82 50',
  ],
  // 🜍 upright triangle on cross
  alchemy_sulfur: [
    'M 50 10 L 82 52 L 18 52 Z',
    'M 50 52 L 50 90',
    'M 32 72 L 68 72',
  ],
};

export function isAlchemicalGlyphId(value: string): value is AlchemicalGlyphId {
  return value in ALCHEMICAL_GLYPH_PATHS;
}
