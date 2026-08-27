/**
 * Script-character options for glyph pickers, grouped by supported script.
 * Sourced from the shared transliteration / gematria alphabets so the
 * available characters always match what Script Translator supports.
 */

import { GREEK_LETTERS, HEBREW_LETTERS } from './gematria/alphabets';
import { LATIN_TO_RUNE, LATIN_TO_SANSKRIT } from './scripts/mappings';

export interface ScriptCharOption {
  /** The character(s) rendered as the glyph. */
  char: string;
  /** Dropdown label, e.g. "א · Aleph". */
  label: string;
}

export interface ScriptCharGroup {
  label: string;
  options: ScriptCharOption[];
}

const LATIN_OPTIONS: ScriptCharOption[] = Array.from({ length: 26 }, (_, i) => {
  const ch = String.fromCharCode(65 + i);
  return { char: ch, label: ch };
});

const HEBREW_OPTIONS: ScriptCharOption[] = HEBREW_LETTERS.map((l) => ({
  char: l.glyph,
  label: `${l.glyph} · ${l.name}`,
}));

const GREEK_OPTIONS: ScriptCharOption[] = GREEK_LETTERS.map((l) => ({
  char: l.glyph,
  label: `${l.glyph} · ${l.name}`,
}));

/** Dedupe shared runes (k/c, j/y) keeping the first Latin key as label. */
const RUNE_OPTIONS: ScriptCharOption[] = (() => {
  const seen = new Set<string>();
  const options: ScriptCharOption[] = [];
  for (const [latin, glyph] of Object.entries(LATIN_TO_RUNE)) {
    if (seen.has(glyph)) continue;
    seen.add(glyph);
    options.push({ char: glyph, label: `${glyph} · ${latin}` });
  }
  return options;
})();

/** Combining marks (anusvara/visarga) render poorly standalone. */
const SANSKRIT_EXCLUDED = new Set(['ं', 'ः']);

const SANSKRIT_OPTIONS: ScriptCharOption[] = (() => {
  const seen = new Set<string>();
  const options: ScriptCharOption[] = [];
  for (const [latin, glyph] of Object.entries(LATIN_TO_SANSKRIT)) {
    if (seen.has(glyph) || SANSKRIT_EXCLUDED.has(glyph)) continue;
    seen.add(glyph);
    options.push({ char: glyph, label: `${glyph} · ${latin}` });
  }
  return options;
})();

export const SCRIPT_CHAR_GROUPS: ScriptCharGroup[] = [
  { label: 'Latin', options: LATIN_OPTIONS },
  { label: 'Hebrew', options: HEBREW_OPTIONS },
  { label: 'Greek', options: GREEK_OPTIONS },
  { label: 'Elder Futhark', options: RUNE_OPTIONS },
  { label: 'Sanskrit (Devanagari)', options: SANSKRIT_OPTIONS },
];

/** Every catalogued character, for select-membership checks. */
export const SCRIPT_CHARS: ReadonlySet<string> = new Set(
  SCRIPT_CHAR_GROUPS.flatMap((group) => group.options.map((o) => o.char))
);
