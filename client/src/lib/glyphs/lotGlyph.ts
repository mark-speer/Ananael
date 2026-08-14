/**
 * Cleromancy lot token — disc with a short label.
 */

import { GLYPH_GOLD, GLYPH_GOLD_DIM, wrapSvgDocument } from './theme';

export const LOT_VIEW = { w: 80, h: 80 } as const;

const MARKS: Record<string, string> = {
  assent: 'Y',
  decline: 'N',
  delay: '…',
  hidden: '?',
  ally: 'A',
  warning: '!',
  path: '/',
  return: '↩',
};

export function lotInnerMarkup(lotId: string): string {
  const mark = MARKS[lotId] ?? '·';
  return `<circle cx="40" cy="40" r="28" fill="none" stroke="${GLYPH_GOLD}" stroke-width="2"/>
<circle cx="40" cy="40" r="22" fill="none" stroke="${GLYPH_GOLD_DIM}" stroke-width="0.75"/>
<text x="40" y="46" text-anchor="middle" fill="${GLYPH_GOLD}" font-size="20" font-family="serif">${mark}</text>`;
}

export function lotSvgDocument(lotId: string): string {
  return wrapSvgDocument(LOT_VIEW.w, LOT_VIEW.h, lotInnerMarkup(lotId));
}
