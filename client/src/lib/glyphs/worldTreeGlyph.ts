/**
 * Axis mundi / world-tree SVG — three stacked worlds on a central trunk.
 */

import { GLYPH_GOLD, GLYPH_GOLD_DIM, GLYPH_MUTED, wrapSvgDocument } from './theme';

export const WORLD_TREE_VIEW = { w: 160, h: 280 } as const;

const ZONE_Y: Record<string, { cy: number; label: string }> = {
  upper: { cy: 48, label: 'Upper' },
  middle: { cy: 140, label: 'Middle' },
  lower: { cy: 232, label: 'Lower' },
};

export function worldTreeInnerMarkup(selectedId?: string): string {
  const trunk = `<line x1="80" y1="18" x2="80" y2="262" stroke="${GLYPH_GOLD_DIM}" stroke-width="3"/>`;
  const canopy = `<path d="M80 18 L118 70 L42 70 Z" fill="none" stroke="${GLYPH_GOLD}" stroke-width="1.5"/>`;
  const roots = `<path d="M80 262 L48 268 M80 262 L80 272 M80 262 L112 268" fill="none" stroke="${GLYPH_GOLD_DIM}" stroke-width="1.5"/>`;
  const zones = Object.entries(ZONE_Y)
    .map(([id, z]) => {
      const active = selectedId === id;
      const stroke = active ? GLYPH_GOLD : GLYPH_MUTED;
      const width = active ? 2.5 : 1.25;
      return `<g>
  <circle cx="80" cy="${z.cy}" r="28" fill="none" stroke="${stroke}" stroke-width="${width}"/>
  <text x="80" y="${z.cy + 4}" text-anchor="middle" fill="${stroke}" font-size="9" font-family="serif">${z.label}</text>
</g>`;
    })
    .join('');
  return `${trunk}${canopy}${roots}${zones}`;
}

export function worldTreeSvgDocument(selectedId?: string): string {
  return wrapSvgDocument(
    WORLD_TREE_VIEW.w,
    WORLD_TREE_VIEW.h,
    worldTreeInnerMarkup(selectedId)
  );
}
