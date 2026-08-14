/**
 * Direction-wheel SVG — labeled quarters on a circle.
 */

import type { DirectionId } from '../../data/shamanism';
import { GLYPH_GOLD, GLYPH_GOLD_DIM, GLYPH_MUTED, wrapSvgDocument } from './theme';

export const DIRECTION_WHEEL_VIEW = { w: 220, h: 220 } as const;

const PLACEMENTS: Record<DirectionId, { x: number; y: number }> = {
  east: { x: 190, y: 114 },
  south: { x: 110, y: 198 },
  west: { x: 30, y: 114 },
  north: { x: 110, y: 28 },
  above: { x: 148, y: 58 },
  below: { x: 72, y: 168 },
  center: { x: 110, y: 114 },
};

export function directionWheelInnerMarkup(
  ids: DirectionId[],
  selectedId?: string
): string {
  const cx = 110;
  const cy = 110;
  const ring = `<circle cx="${cx}" cy="${cy}" r="78" fill="none" stroke="${GLYPH_GOLD_DIM}" stroke-width="1.25"/>
<line x1="${cx}" y1="32" x2="${cx}" y2="188" stroke="${GLYPH_GOLD_DIM}" stroke-width="0.75" opacity="0.6"/>
<line x1="32" y1="${cy}" x2="188" y2="${cy}" stroke="${GLYPH_GOLD_DIM}" stroke-width="0.75" opacity="0.6"/>`;
  const labels = ids
    .map((id) => {
      const p = PLACEMENTS[id];
      const active = selectedId === id;
      const fill = active ? GLYPH_GOLD : GLYPH_MUTED;
      const r = id === 'center' ? 10 : 6;
      return `<g>
  <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${active ? GLYPH_GOLD : 'none'}" stroke="${fill}" stroke-width="1.25"/>
  <text x="${p.x}" y="${p.y + (id === 'center' ? 22 : -10)}" text-anchor="middle" fill="${fill}" font-size="9" font-family="serif">${id}</text>
</g>`;
    })
    .join('');
  return `${ring}${labels}`;
}

export function directionWheelSvgDocument(
  ids: DirectionId[],
  selectedId?: string
): string {
  return wrapSvgDocument(
    DIRECTION_WHEEL_VIEW.w,
    DIRECTION_WHEEL_VIEW.h,
    directionWheelInnerMarkup(ids, selectedId)
  );
}
