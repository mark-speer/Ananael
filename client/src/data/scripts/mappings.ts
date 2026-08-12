import {
  GREEK_LETTERS,
  HEBREW_LETTERS,
  type AlphabetLetter,
} from '../gematria/alphabets';

export type ScriptId = 'latin' | 'hebrew' | 'greek' | 'runes' | 'sanskrit';

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
  {
    id: 'sanskrit',
    label: 'Sanskrit (Devanagari)',
    description: 'IAST Latin ↔ Devanagari (bija and basic alphabet)',
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

/** IAST multi-char sequences for Sanskrit (longest first). */
export const SANSKRIT_DIGRAPHS = [
  'aum',
  'om',
  'lam',
  'vam',
  'ram',
  'yam',
  'ham',
  'ksh',
  'jñ',
  'sh',
  'ch',
  'th',
  'dh',
  'bh',
  'ph',
  'gh',
  'kh',
  'ṭh',
  'ḍh',
  'ṇ',
  'ṃ',
  'ḥ',
  'ā',
  'ī',
  'ū',
  'ṛ',
  'ai',
  'au',
] as const;

/** IAST Latin keys → Devanagari glyphs (basic alphabet + common bija). */
export const LATIN_TO_SANSKRIT: Record<string, string> = {
  om: 'ॐ',
  aum: 'ॐ',
  lam: 'लं',
  vam: 'वं',
  ram: 'रं',
  yam: 'यं',
  ham: 'हं',
  a: 'अ',
  ā: 'आ',
  i: 'इ',
  ī: 'ई',
  u: 'उ',
  ū: 'ऊ',
  ṛ: 'ऋ',
  e: 'ए',
  ai: 'ऐ',
  o: 'ओ',
  au: 'औ',
  k: 'क',
  kh: 'ख',
  g: 'ग',
  gh: 'घ',
  ṅ: 'ङ',
  c: 'च',
  ch: 'छ',
  j: 'ज',
  jh: 'झ',
  ñ: 'ञ',
  ṭ: 'ट',
  ṭh: 'ठ',
  ḍ: 'ड',
  ḍh: 'ढ',
  ṇ: 'ण',
  t: 'त',
  th: 'थ',
  d: 'द',
  dh: 'ध',
  n: 'न',
  p: 'प',
  ph: 'फ',
  b: 'ब',
  bh: 'भ',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  w: 'व',
  sh: 'श',
  ṣ: 'ष',
  s: 'स',
  h: 'ह',
  ksh: 'क्ष',
  jñ: 'ज्ञ',
  ṁ: 'ं',
  ḥ: 'ः',
};

export const SANSKRIT_TO_LATIN: Record<string, string> = Object.fromEntries(
  Object.entries(LATIN_TO_SANSKRIT).map(([k, v]) => [v, k])
);
// Prefer om over aum for ॐ
SANSKRIT_TO_LATIN['ॐ'] = 'om';
