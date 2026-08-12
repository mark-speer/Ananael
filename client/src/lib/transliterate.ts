import {
  GREEK_TO_LATIN,
  HEBREW_FINAL_TO_LATIN,
  HEBREW_TO_LATIN,
  LATIN_DIGRAPHS,
  LATIN_TO_GREEK,
  LATIN_TO_HEBREW,
  LATIN_TO_RUNE,
  LATIN_TO_SANSKRIT,
  RUNE_DIGRAPHS,
  RUNE_TO_LATIN,
  SANSKRIT_DIGRAPHS,
  SANSKRIT_TO_LATIN,
  SCRIPTS,
  type ScriptId,
} from '../data/scripts/mappings';

export type { ScriptId };
export { SCRIPTS };

export interface TransliterateResult {
  output: string;
  /** Characters that could not be mapped (left as-is or skipped). */
  unmapped: string[];
}

function scriptToLatin(text: string, from: ScriptId): { latin: string; unmapped: string[] } {
  if (from === 'latin') {
    return { latin: text.toLowerCase(), unmapped: [] };
  }

  const unmapped: string[] = [];
  let latin = '';

  for (const ch of text) {
    if (/\s/.test(ch) || /[0-9.,;:!?'"()\-]/.test(ch)) {
      latin += ch;
      continue;
    }

    let mapped: string | undefined;
    if (from === 'hebrew') {
      mapped = HEBREW_TO_LATIN[ch] ?? HEBREW_FINAL_TO_LATIN[ch];
    } else if (from === 'greek') {
      mapped = GREEK_TO_LATIN[ch];
    } else if (from === 'runes') {
      mapped = RUNE_TO_LATIN[ch];
    } else if (from === 'sanskrit') {
      mapped = SANSKRIT_TO_LATIN[ch];
    }

    if (mapped !== undefined) {
      latin += mapped;
    } else {
      // Already-Latin letters pass through when converting from other scripts
      if (/[a-zA-Z]/.test(ch)) {
        latin += ch.toLowerCase();
      } else {
        unmapped.push(ch);
        latin += ch;
      }
    }
  }

  return { latin, unmapped };
}

function consumeDigraph(
  lower: string,
  i: number,
  digraphs: readonly string[],
  table: Record<string, string>
): { glyph: string; len: number } | null {
  for (const d of digraphs) {
    if (lower.startsWith(d, i) && table[d]) {
      return { glyph: table[d], len: d.length };
    }
  }
  return null;
}

function latinToScript(
  latin: string,
  to: ScriptId
): { output: string; unmapped: string[] } {
  if (to === 'latin') {
    return { output: latin, unmapped: [] };
  }

  const unmapped: string[] = [];
  let output = '';
  const lower = latin.toLowerCase();
  let i = 0;

  const digraphs =
    to === 'runes'
      ? [...RUNE_DIGRAPHS, ...LATIN_DIGRAPHS]
      : to === 'sanskrit'
        ? [...SANSKRIT_DIGRAPHS, ...LATIN_DIGRAPHS]
        : [...LATIN_DIGRAPHS];
  const table =
    to === 'hebrew'
      ? LATIN_TO_HEBREW
      : to === 'greek'
        ? LATIN_TO_GREEK
        : to === 'sanskrit'
          ? LATIN_TO_SANSKRIT
          : LATIN_TO_RUNE;

  while (i < lower.length) {
    const ch = lower[i];
    if (/\s/.test(ch) || /[0-9.,;:!?'"()\-]/.test(ch)) {
      output += latin[i];
      i += 1;
      continue;
    }

    const digraph = consumeDigraph(lower, i, digraphs, table);
    if (digraph) {
      output += digraph.glyph;
      i += digraph.len;
      continue;
    }

    const glyph = table[ch];
    if (glyph) {
      output += glyph;
    } else {
      unmapped.push(ch);
      output += latin[i];
    }
    i += 1;
  }

  return { output, unmapped };
}

/**
 * Bidirectional script transliteration via a Latin intermediate key.
 * Not semantic translation — phonetic / traditional letter mapping only.
 *
 * Round-trip notes:
 * - Hebrew ↔ Latin uses scholarly digraphs (ch, tz, sh, th, aa).
 * - Greek ↔ Latin uses digraphs (th, ph, ch, ps, ee, oo).
 * - Runes fold c→k and y→j on Latin→Rune; reverse uses canonical keys.
 * - Sanskrit uses IAST Latin keys (with diacritics) ↔ Devanagari; bija syllables map directly.
 */
export function transliterate(
  text: string,
  from: ScriptId,
  to: ScriptId
): TransliterateResult {
  if (from === to) {
    return { output: text, unmapped: [] };
  }

  const { latin, unmapped: u1 } = scriptToLatin(text, from);
  const { output, unmapped: u2 } = latinToScript(latin, to);
  return { output, unmapped: [...u1, ...u2] };
}
