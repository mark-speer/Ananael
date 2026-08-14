/**
 * Elder Futhark rune SVG paths — stroke geometry keyed by rune id.
 * Unicode glyphs remain in data/runes.ts for Script Translator.
 */

import { GLYPH_GOLD, RUNE_VIEW, wrapSvgDocument } from './theme';

/** Stroke path `d` values in a 100×140 viewBox (centered stem). */
const RUNE_PATHS: Record<string, string> = {
  // ᚠ Fehu — vertical + two up-right arms
  fehu: 'M50 20 V120 M50 40 L82 22 M50 62 L82 44',
  // ᚢ Uruz — open n / u with angled right
  uruz: 'M28 120 V35 L50 20 L72 35 V120',
  // ᚦ Thurisaz — stem + thorn
  thurisaz: 'M40 20 V120 M40 55 L78 70 L40 85',
  // ᚨ Ansuz — stem + two down-right arms
  ansuz: 'M40 20 V120 M40 35 L78 55 M40 58 L78 78',
  // ᚱ Raidho — R
  raidho: 'M35 20 V120 M35 20 H68 L82 42 L68 64 H35 M55 64 L82 120',
  // ᚲ Kenaz — < angle (torch)
  kenaz: 'M78 28 L32 70 L78 112',
  // ᚷ Gebo — X
  gebo: 'M28 28 L72 112 M72 28 L28 112',
  // ᚹ Wunjo — P / flag
  wunjo: 'M35 20 V120 M35 20 H68 L82 45 L68 70 H35',
  // ᚺ Hagalaz — H with cross
  hagalaz: 'M30 20 V120 M70 20 V120 M30 70 H70',
  // ᚾ Nauthiz — stem + diagonal
  nauthiz: 'M50 20 V120 M32 45 L68 95',
  // ᛁ Isa — single stave
  isa: 'M50 20 V120',
  // ᛃ Jera — two angled hooks
  jera: 'M62 28 L38 55 L62 70 M38 70 L62 85 L38 112',
  // ᛇ Eihwaz — yew axis
  eihwaz: 'M50 20 V120 M32 38 L50 55 L68 38 M32 102 L50 85 L68 102',
  // ᛈ Perthro — open cup
  perthro: 'M72 28 H42 L30 45 V95 L42 112 H72',
  // ᛉ Algiz — elk / protection
  algiz: 'M50 120 V45 M50 45 L28 20 M50 45 L72 20 M50 45 L50 20',
  // ᛊ Sowilo — lightning / sun
  sowilo: 'M62 22 L38 60 H62 L38 118',
  // ᛏ Tiwaz — up arrow
  tiwaz: 'M50 120 V35 M28 58 L50 28 L72 58',
  // ᛒ Berkano — B with two bows
  berkano: 'M35 20 V120 M35 20 H62 L78 42 L62 64 H35 M35 64 H62 L78 92 L62 120 H35',
  // ᛖ Ehwaz — twin horse / M on side
  ehwaz: 'M28 120 V35 L50 55 L72 35 V120',
  // ᛗ Mannaz — M
  mannaz: 'M28 120 V35 L50 70 L72 35 V120 M28 35 L50 70 L72 35',
  // ᛚ Laguz — wave / L
  laguz: 'M42 20 L42 100 L70 120',
  // ᛜ Ingwaz — diamond
  ingwaz: 'M50 35 L72 70 L50 105 L28 70 Z',
  // ᛞ Dagaz — hourglass / day
  dagaz: 'M28 28 L72 112 M72 28 L28 112 M28 28 L72 28 M28 112 L72 112',
  // ᛟ Othala — estate / diamond with legs
  othala: 'M50 28 L78 62 L50 96 L22 62 Z M50 96 L32 120 M50 96 L68 120',
};

export function runePathForId(runeId: string): string | undefined {
  return RUNE_PATHS[runeId];
}

/** Inner markup (no root svg). */
export function runeInnerMarkup(
  runeId: string,
  opts?: { reversed?: boolean }
): string {
  const d = RUNE_PATHS[runeId];
  if (!d) {
    return `  <text x="50" y="78" text-anchor="middle" fill="${GLYPH_GOLD}" font-size="48">?</text>`;
  }

  const strokeAttrs = `fill="none" stroke="${GLYPH_GOLD}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const path = `<path d="${d}" ${strokeAttrs}/>`;

  if (opts?.reversed) {
    const cx = RUNE_VIEW.w / 2;
    const cy = RUNE_VIEW.h / 2;
    return `  <g transform="rotate(180 ${cx} ${cy})">\n    ${path}\n  </g>`;
  }

  return `  ${path}`;
}

/** Full SVG document for export / data URLs. */
export function runeSvgDocument(
  runeId: string,
  opts?: { reversed?: boolean }
): string {
  return wrapSvgDocument(
    RUNE_VIEW.w,
    RUNE_VIEW.h,
    runeInnerMarkup(runeId, opts)
  );
}
