/**
 * Shared alphabet definitions for Gematria and Script Translator.
 * Hebrew and Greek letters are the source of truth for letter identity.
 */

export interface AlphabetLetter {
  /** Canonical Latin / scholarly transliteration key (lowercase). */
  latin: string;
  /** Native script character. */
  glyph: string;
  /** Display name. */
  name: string;
}

/** 22 Hebrew letters (ketiv without final forms as separate entries). */
export const HEBREW_LETTERS: AlphabetLetter[] = [
  { latin: 'a', glyph: 'א', name: 'Aleph' },
  { latin: 'b', glyph: 'ב', name: 'Bet' },
  { latin: 'g', glyph: 'ג', name: 'Gimel' },
  { latin: 'd', glyph: 'ד', name: 'Dalet' },
  { latin: 'h', glyph: 'ה', name: 'He' },
  { latin: 'v', glyph: 'ו', name: 'Vav' },
  { latin: 'z', glyph: 'ז', name: 'Zayin' },
  { latin: 'ch', glyph: 'ח', name: 'Chet' },
  { latin: 't', glyph: 'ט', name: 'Tet' },
  { latin: 'y', glyph: 'י', name: 'Yod' },
  { latin: 'k', glyph: 'כ', name: 'Kaf' },
  { latin: 'l', glyph: 'ל', name: 'Lamed' },
  { latin: 'm', glyph: 'מ', name: 'Mem' },
  { latin: 'n', glyph: 'נ', name: 'Nun' },
  { latin: 's', glyph: 'ס', name: 'Samekh' },
  { latin: 'aa', glyph: 'ע', name: 'Ayin' },
  { latin: 'p', glyph: 'פ', name: 'Pe' },
  { latin: 'tz', glyph: 'צ', name: 'Tsadi' },
  { latin: 'q', glyph: 'ק', name: 'Qof' },
  { latin: 'r', glyph: 'ר', name: 'Resh' },
  { latin: 'sh', glyph: 'ש', name: 'Shin' },
  { latin: 'th', glyph: 'ת', name: 'Tav' },
];

/** Final (sofit) forms mapped to base Latin keys. */
export const HEBREW_SOFIT: Record<string, string> = {
  ך: 'k',
  ם: 'm',
  ן: 'n',
  ף: 'p',
  ץ: 'tz',
};

/** 24 Greek letters (classical isopsephy set). */
export const GREEK_LETTERS: AlphabetLetter[] = [
  { latin: 'a', glyph: 'Α', name: 'Alpha' },
  { latin: 'b', glyph: 'Β', name: 'Beta' },
  { latin: 'g', glyph: 'Γ', name: 'Gamma' },
  { latin: 'd', glyph: 'Δ', name: 'Delta' },
  { latin: 'e', glyph: 'Ε', name: 'Epsilon' },
  { latin: 'z', glyph: 'Ζ', name: 'Zeta' },
  { latin: 'ee', glyph: 'Η', name: 'Eta' },
  { latin: 'th', glyph: 'Θ', name: 'Theta' },
  { latin: 'i', glyph: 'Ι', name: 'Iota' },
  { latin: 'k', glyph: 'Κ', name: 'Kappa' },
  { latin: 'l', glyph: 'Λ', name: 'Lambda' },
  { latin: 'm', glyph: 'Μ', name: 'Mu' },
  { latin: 'n', glyph: 'Ν', name: 'Nu' },
  { latin: 'x', glyph: 'Ξ', name: 'Xi' },
  { latin: 'o', glyph: 'Ο', name: 'Omicron' },
  { latin: 'p', glyph: 'Π', name: 'Pi' },
  { latin: 'r', glyph: 'Ρ', name: 'Rho' },
  { latin: 's', glyph: 'Σ', name: 'Sigma' },
  { latin: 't', glyph: 'Τ', name: 'Tau' },
  { latin: 'y', glyph: 'Υ', name: 'Upsilon' },
  { latin: 'ph', glyph: 'Φ', name: 'Phi' },
  { latin: 'ch', glyph: 'Χ', name: 'Chi' },
  { latin: 'ps', glyph: 'Ψ', name: 'Psi' },
  { latin: 'oo', glyph: 'Ω', name: 'Omega' },
];

export const GREEK_LOWER: Record<string, string> = {
  α: 'Α',
  β: 'Β',
  γ: 'Γ',
  δ: 'Δ',
  ε: 'Ε',
  ζ: 'Ζ',
  η: 'Η',
  θ: 'Θ',
  ι: 'Ι',
  κ: 'Κ',
  λ: 'Λ',
  μ: 'Μ',
  ν: 'Ν',
  ξ: 'Ξ',
  ο: 'Ο',
  π: 'Π',
  ρ: 'Ρ',
  σ: 'Σ',
  ς: 'Σ',
  τ: 'Τ',
  υ: 'Υ',
  φ: 'Φ',
  χ: 'Χ',
  ψ: 'Ψ',
  ω: 'Ω',
};
