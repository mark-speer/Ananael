import {
  GREEK_LETTERS,
  GREEK_LOWER,
  HEBREW_LETTERS,
  HEBREW_SOFIT,
} from './alphabets';

export type GematriaSystemId =
  | 'hebrew_ordinal'
  | 'hebrew_reduced'
  | 'hebrew_sofit'
  | 'greek_isopsephy'
  | 'english_simple'
  | 'english_agrippa';

export interface GematriaSystemMeta {
  id: GematriaSystemId;
  label: string;
  description: string;
}

export const GEMATRIA_SYSTEMS: GematriaSystemMeta[] = [
  {
    id: 'hebrew_ordinal',
    label: 'Hebrew Ordinal',
    description: 'א=1 … ת=22',
  },
  {
    id: 'hebrew_reduced',
    label: 'Hebrew Reduced',
    description: 'Mispar katan — digital root style 1–9 cycle',
  },
  {
    id: 'hebrew_sofit',
    label: 'Hebrew Sofit (Mispar Gadol)',
    description: 'Standard values; finals ך=500 … ץ=900',
  },
  {
    id: 'greek_isopsephy',
    label: 'Greek Isopsephy',
    description: 'Α=1 … Ω=800 (classical)',
  },
  {
    id: 'english_simple',
    label: 'English Simple',
    description: 'A=1 … Z=26',
  },
  {
    id: 'english_agrippa',
    label: 'English Agrippa',
    description: 'Classical Agrippa English table (A=1 … Z=800)',
  },
];

/** Standard Mispar Hechrachi / Gadol base values (non-final). */
const HEBREW_STANDARD: Record<string, number> = {
  a: 1,
  b: 2,
  g: 3,
  d: 4,
  h: 5,
  v: 6,
  z: 7,
  ch: 8,
  t: 9,
  y: 10,
  k: 20,
  l: 30,
  m: 40,
  n: 50,
  s: 60,
  aa: 70,
  p: 80,
  tz: 90,
  q: 100,
  r: 200,
  sh: 300,
  th: 400,
};

const HEBREW_SOFIT_VALUES: Record<string, number> = {
  ך: 500,
  ם: 600,
  ן: 700,
  ף: 800,
  ץ: 900,
};

/** Ordinal: position in aleph-bet 1–22. */
const HEBREW_ORDINAL: Record<string, number> = Object.fromEntries(
  HEBREW_LETTERS.map((l, i) => [l.latin, i + 1])
);

const GREEK_VALUES: Record<string, number> = {
  Α: 1,
  Β: 2,
  Γ: 3,
  Δ: 4,
  Ε: 5,
  Ζ: 7,
  Η: 8,
  Θ: 9,
  Ι: 10,
  Κ: 20,
  Λ: 30,
  Μ: 40,
  Ν: 50,
  Ξ: 60,
  Ο: 70,
  Π: 80,
  Ρ: 100,
  Σ: 200,
  Τ: 300,
  Υ: 400,
  Φ: 500,
  Χ: 600,
  Ψ: 700,
  Ω: 800,
};

/** Agrippa English (Three Books of Occult Philosophy style table). */
const ENGLISH_AGRIPPA: Record<string, number> = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8,
  i: 9,
  k: 10,
  l: 20,
  m: 30,
  n: 40,
  o: 50,
  p: 60,
  q: 70,
  r: 80,
  s: 90,
  t: 100,
  u: 200,
  x: 300,
  y: 400,
  z: 500,
  j: 600,
  v: 700,
  w: 800,
};

const HEBREW_GLYPH_TO_LATIN: Record<string, string> = {
  ...Object.fromEntries(HEBREW_LETTERS.map((l) => [l.glyph, l.latin])),
  ...HEBREW_SOFIT,
};

const GREEK_GLYPH_TO_LATIN: Record<string, string> = Object.fromEntries(
  GREEK_LETTERS.map((l) => [l.glyph, l.latin])
);

export { HEBREW_STANDARD, HEBREW_ORDINAL, GREEK_VALUES, ENGLISH_AGRIPPA };
export { HEBREW_GLYPH_TO_LATIN, GREEK_GLYPH_TO_LATIN, HEBREW_SOFIT_VALUES, GREEK_LOWER };
