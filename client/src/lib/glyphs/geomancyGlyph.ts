/**
 * Geomantic figure SVG — four rows of single (odd) or double (even) points.
 */

import {
  GEOMANTIC_FIGURES_BY_ID,
  type FigureId,
  type GeomanticRows,
} from '../../data/geomancy';
import {
  GEOMANCY_VIEW,
  GLYPH_GOLD,
  GLYPH_GOLD_DIM,
  wrapSvgDocument,
} from './theme';

export type GeomancyGlyphInput = FigureId | GeomanticRows;

function resolveRows(input: GeomancyGlyphInput): GeomanticRows {
  if (typeof input === 'string') {
    return GEOMANTIC_FIGURES_BY_ID[input].rows;
  }
  return input;
}

/** Inner markup (no root svg) for embedding. */
export function geomancyFigureInnerMarkup(
  input: GeomancyGlyphInput,
  opts?: { featured?: boolean }
): string {
  const rows = resolveRows(input);
  const fill = opts?.featured ? GLYPH_GOLD : GLYPH_GOLD_DIM;
  const cx = GEOMANCY_VIEW.w / 2;
  const rowYs = [22, 44, 66, 88];
  const r = 7;
  const gap = 11;

  const circles: string[] = [];
  rows.forEach((single, i) => {
    const y = rowYs[i];
    if (single) {
      circles.push(
        `<circle cx="${cx}" cy="${y}" r="${r}" fill="${fill}"/>`
      );
    } else {
      circles.push(
        `<circle cx="${cx - gap}" cy="${y}" r="${r}" fill="${fill}"/>`,
        `<circle cx="${cx + gap}" cy="${y}" r="${r}" fill="${fill}"/>`
      );
    }
  });

  return `  ${circles.join('\n  ')}`;
}

/** Full SVG document for export / data URLs. */
export function geomancyFigureSvgDocument(
  input: GeomancyGlyphInput,
  opts?: { featured?: boolean }
): string {
  return wrapSvgDocument(
    GEOMANCY_VIEW.w,
    GEOMANCY_VIEW.h,
    geomancyFigureInnerMarkup(input, opts)
  );
}
