import {
  ENGLISH_AGRIPPA,
  GEMATRIA_SYSTEMS,
  GREEK_LOWER,
  GREEK_VALUES,
  HEBREW_GLYPH_TO_LATIN,
  HEBREW_ORDINAL,
  HEBREW_SOFIT_VALUES,
  HEBREW_STANDARD,
  type GematriaSystemId,
} from '../data/gematria/tables';

export type { GematriaSystemId };
export { GEMATRIA_SYSTEMS };

export interface GematriaBreakdownItem {
  char: string;
  value: number | null;
  /** False when character is ignored (space, punctuation, unknown). */
  counted: boolean;
}

export interface GematriaResult {
  total: number;
  breakdown: GematriaBreakdownItem[];
  ignoredCount: number;
}

function reduceToSingleDigitCycle(n: number): number {
  if (n <= 0) return 0;
  const r = n % 9;
  return r === 0 ? 9 : r;
}

function hebrewKeyFromChar(ch: string): { key: string; sofitGlyph?: string } | null {
  if (HEBREW_SOFIT_VALUES[ch] !== undefined) {
    return { key: HEBREW_GLYPH_TO_LATIN[ch], sofitGlyph: ch };
  }
  const latin = HEBREW_GLYPH_TO_LATIN[ch];
  if (latin) return { key: latin };
  // Allow Latin transliteration single letters for convenience
  const lower = ch.toLowerCase();
  if (HEBREW_STANDARD[lower] !== undefined) return { key: lower };
  return null;
}

function greekUpper(ch: string): string | null {
  if (GREEK_VALUES[ch] !== undefined) return ch;
  const mapped = GREEK_LOWER[ch];
  if (mapped) return mapped;
  return null;
}

function valueForHebrew(
  system: GematriaSystemId,
  key: string,
  sofitGlyph?: string
): number | null {
  if (system === 'hebrew_sofit' && sofitGlyph) {
    return HEBREW_SOFIT_VALUES[sofitGlyph] ?? null;
  }
  if (system === 'hebrew_ordinal') {
    return HEBREW_ORDINAL[key] ?? null;
  }
  if (system === 'hebrew_reduced') {
    const base = HEBREW_STANDARD[key];
    return base !== undefined ? reduceToSingleDigitCycle(base) : null;
  }
  // hebrew_sofit uses standard for non-finals
  return HEBREW_STANDARD[key] ?? null;
}

/**
 * Compute gematria for `text` under the selected system.
 * Unknown characters are left in the breakdown with value null and not summed.
 */
export function computeGematria(
  text: string,
  system: GematriaSystemId
): GematriaResult {
  const breakdown: GematriaBreakdownItem[] = [];
  let total = 0;
  let ignoredCount = 0;

  const isHebrew = system.startsWith('hebrew');
  const isGreek = system === 'greek_isopsephy';
  const isEnglish = system.startsWith('english');

  for (const char of text) {
    if (/\s/.test(char)) {
      breakdown.push({ char, value: null, counted: false });
      continue;
    }

    let value: number | null = null;

    if (isHebrew) {
      const resolved = hebrewKeyFromChar(char);
      if (resolved) {
        value = valueForHebrew(system, resolved.key, resolved.sofitGlyph);
      }
    } else if (isGreek) {
      const upper = greekUpper(char);
      if (upper) value = GREEK_VALUES[upper] ?? null;
    } else if (isEnglish) {
      const lower = char.toLowerCase();
      if (system === 'english_simple') {
        if (/^[a-z]$/.test(lower)) value = lower.charCodeAt(0) - 96;
      } else {
        value = ENGLISH_AGRIPPA[lower] ?? null;
      }
    }

    if (value === null) {
      ignoredCount += 1;
      breakdown.push({ char, value: null, counted: false });
    } else {
      total += value;
      breakdown.push({ char, value, counted: true });
    }
  }

  return { total, breakdown, ignoredCount };
}
