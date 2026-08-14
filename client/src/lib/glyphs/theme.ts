/**
 * Shared visual language for Divination SVG glyphs (Phase 40).
 */

export const GLYPH_GOLD = '#e8c547';
export const GLYPH_GOLD_DIM = '#c4a035';
export const GLYPH_MUTED = '#a1a1aa';

export const GEOMANCY_VIEW = { w: 80, h: 120 } as const;
export const ICHING_VIEW = { w: 140, h: 160 } as const;
export const RUNE_VIEW = { w: 100, h: 140 } as const;

export function wrapSvgDocument(
  viewW: number,
  viewH: number,
  body: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" fill="none">
${body}
</svg>
`;
}
