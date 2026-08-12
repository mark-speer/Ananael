/**
 * Ofuda (御札) layout engine — vertical kanji columns, seal, optional bonji column.
 */

export const OFUDA_WIDTH = 240;
export const OFUDA_HEIGHT = 520;

export const OFUDA_FONT_JP = '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif';
export const OFUDA_FONT_DEVANAGARI =
  '"Noto Serif Devanagari", "Noto Sans Devanagari", serif';
export const OFUDA_FONT_LATIN = '"Source Sans 3", system-ui, sans-serif';

export interface OfudaGlyph {
  char: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface OfudaSeal {
  x: number;
  y: number;
  size: number;
  text: string;
}

export interface OfudaLayout {
  width: number;
  height: number;
  titleJp: string;
  purposeLabel: string;
  glyphs: OfudaGlyph[];
  seal: OfudaSeal | null;
  dedication: string | null;
}

export interface LayoutOfudaOptions {
  titleJp: string;
  purposeLabel: string;
  columns: string[];
  bonjiDevanagari?: string;
  sealText?: string;
  dedication?: string;
}

const MARGIN = 16;
const TITLE_HEIGHT = 44;
const DEDICATION_HEIGHT = 28;
const SEAL_SIZE = 44;
const KANJI_FONT = 20;
const KANJI_LINE = 24;
const KANJI_COL_GAP = 8;
const BONJI_FONT = 14;
const BONJI_LINE = 17;
const BONJI_COL_GAP = 10;

export function splitVerticalColumn(text: string): string[] {
  return [...text.replace(/\s/g, '')];
}

export function layoutOfuda(options: LayoutOfudaOptions): OfudaLayout {
  const {
    titleJp,
    purposeLabel,
    columns,
    bonjiDevanagari,
    sealText,
    dedication,
  } = options;

  const glyphs: OfudaGlyph[] = [];
  const bodyTop = MARGIN + TITLE_HEIGHT;
  const bodyBottom = OFUDA_HEIGHT - MARGIN - DEDICATION_HEIGHT;
  const sealReserve = SEAL_SIZE + 12;
  const rightEdge = OFUDA_WIDTH - MARGIN - sealReserve;

  let x = rightEdge;

  for (const col of columns) {
    const chars = splitVerticalColumn(col);
    if (chars.length === 0) continue;

    const colHeight = chars.length * KANJI_LINE;
    let y = bodyTop + Math.max(0, (bodyBottom - bodyTop - colHeight) / 2);

    for (const ch of chars) {
      glyphs.push({
        char: ch,
        x,
        y,
        fontSize: KANJI_FONT,
        fontFamily: OFUDA_FONT_JP,
        fill: '#e8dcc8',
      });
      y += KANJI_LINE;
    }

    x -= KANJI_FONT + KANJI_COL_GAP;
  }

  if (bonjiDevanagari?.trim()) {
    const bonjiChars = splitVerticalColumn(bonjiDevanagari.trim());
    if (bonjiChars.length > 0) {
      x = MARGIN + BONJI_FONT;
      const colHeight = bonjiChars.length * BONJI_LINE;
      let y = bodyTop + Math.max(0, (bodyBottom - bodyTop - colHeight) / 2);

      for (const ch of bonjiChars) {
        glyphs.push({
          char: ch,
          x,
          y,
          fontSize: BONJI_FONT,
          fontFamily: OFUDA_FONT_DEVANAGARI,
          fill: '#c9a227',
        });
        y += BONJI_LINE;
      }
    }
  }

  const seal: OfudaSeal | null =
    sealText?.trim()
      ? {
          x: OFUDA_WIDTH - MARGIN - SEAL_SIZE,
          y: OFUDA_HEIGHT - MARGIN - DEDICATION_HEIGHT - SEAL_SIZE - 8,
          size: SEAL_SIZE,
          text: sealText.trim().slice(0, 6),
        }
      : null;

  return {
    width: OFUDA_WIDTH,
    height: OFUDA_HEIGHT,
    titleJp,
    purposeLabel,
    glyphs,
    seal,
    dedication: dedication?.trim() || null,
  };
}
