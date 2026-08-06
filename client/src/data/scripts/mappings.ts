import {
  GREEK_LETTERS,
  HEBREW_LETTERS,
  type AlphabetLetter,
} from '../gematria/alphabets';

export type ScriptId = 'latin' | 'hebrew' | 'greek' | 'runes';

export interface ScriptMeta {
  id: ScriptId;
  label: string;
  description: string;
}

export const SCRIPTS: ScriptMeta[] = [
  { id: 'latin', label: 'Latin', description: 'ASCII Latin letters' },
  {
    id: 'hebrew',
    label: 'Hebrew',
    description: 'Aleph-bet (scholarly Latin keys)',
  },
  {
    id: 'greek',
    label: 'Greek',
    description: 'Classical Greek capitals (via Latin keys)',
  },
  {
    id: 'runes',
    label: 'Elder Futhark',
    description: '24-rune Elder Futhark',
  },
];

/** Multi-character Latin digraphs sorted longest-first for greedy match. */
export const LATIN_DIGRAPHS = [
  'th',
  'sh',
  'tz',
  'ch',
  'ph',
  'ps',
  'aa',
  'ee',
  'oo',
] as const;

/**
 * Latin key → Hebrew glyph (from shared gematria alphabet).
 * Digraphs (ch, tz, sh, th, aa) take precedence when scanning Latin → Hebrew.
 */
export const LATIN_TO_HEBREW: Record<string, string> = Object.fromEntries(
  HEBREW_LETTERS.map((l: AlphabetLetter) => [l.latin, l.glyph])
);

export const HEBREW_TO_LATIN: Record<string, string> = Object.fromEntries(
  HEBREW_LETTERS.map((l: AlphabetLetter) => [l.glyph, l.latin])
);

/** Finals fold back to their base Latin keys. */
export const HEBREW_FINAL_TO_LATIN: Record<string, string> = {
  ך: 'k',
  ם: 'm',
  ן: 'n',
  ף: 'p',
  ץ: 'tz',
};

export const LATIN_TO_GREEK: Record<string, string> = Object.fromEntries(
  GREEK_LETTERS.map((l: AlphabetLetter) => [l.latin, l.glyph])
);

export const GREEK_TO_LATIN: Record<string, string> = {
  ...Object.fromEntries(
    GREEK_LETTERS.map((l: AlphabetLetter) => [l.glyph, l.latin])
  ),
  // Lowercase forms
  α: 'a',
  β: 'b',
  γ: 'g',
  δ: 'd',
  ε: 'e',
  ζ: 'z',
  η: 'ee',
  θ: 'th',
  ι: 'i',
  κ: 'k',
  λ: 'l',
  μ: 'm',
  ν: 'n',
  ξ: 'x',
  ο: 'o',
  π: 'p',
  ρ: 'r',
  σ: 's',
  ς: 's',
  τ: 't',
  υ: 'y',
  φ: 'ph',
  χ: 'ch',
  ψ: 'ps',
  ω: 'oo',
};

/**
 * Elder Futhark — conventional English phonetic mapping.
 * Some Latin letters share runes; reverse maps prefer a canonical Latin letter.
 */
export const LATIN_TO_RUNE: Record<string, string> = {
  f: 'ᚠ',
  u: 'ᚢ',
  th: 'ᚦ',
  a: 'ᚨ',
  r: 'ᚱ',
  k: 'ᚲ',
  c: 'ᚲ',
  g: 'ᚷ',
  w: 'ᚹ',
  h: 'ᚺ',
  n: 'ᚾ',
  i: 'ᛁ',
  j: 'ᛃ',
  y: 'ᛃ',
  p: 'ᛈ',
  z: 'ᛉ',
  s: 'ᛊ',
  t: 'ᛏ',
  b: 'ᛒ',
  e: 'ᛖ',
  m: 'ᛗ',
  l: 'ᛚ',
  ng: 'ᛜ',
  o: 'ᛟ',
  d: 'ᛞ',
};

export const RUNE_TO_LATIN: Record<string, string> = {
  ᚠ: 'f',
  ᚢ: 'u',
  ᚦ: 'th',
  ᚨ: 'a',
  ᚱ: 'r',
  ᚲ: 'k',
  ᚷ: 'g',
  ᚹ: 'w',
  ᚺ: 'h',
  ᚻ: 'h',
  ᚾ: 'n',
  ᛁ: 'i',
  ᛃ: 'j',
  ᛈ: 'p',
  ᛉ: 'z',
  ᛊ: 's',
  ᛋ: 's',
  ᛏ: 't',
  ᛒ: 'b',
  ᛖ: 'e',
  ᛗ: 'm',
  ᛚ: 'l',
  ᛜ: 'ng',
  ᛝ: 'ng',
  ᛟ: 'o',
  ᛞ: 'd',
};

/** Digraphs for Latin → runes (longest first). */
export const RUNE_DIGRAPHS = ['th', 'ng'] as const;
