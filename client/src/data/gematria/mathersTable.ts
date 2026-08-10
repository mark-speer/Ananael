/**
 * Mathers' Table of Hebrew and Chaldee Letters from
 * S.L. MacGregor Mathers, The Kabbalah Unveiled (1887) — public domain.
 * Spellings and romanizations follow Mathers (not modern scholarly forms).
 */

export interface MathersTableRow {
  /** Ordinal position 1–22. */
  number: number;
  /** Sound or power as given by Mathers. */
  sound: string;
  /** Non-final Hebrew/Chaldee letter. */
  letter: string;
  /** Final (sofit) form, when present. */
  finalLetter?: string;
  /** Non-final numerical value. */
  value: number;
  /** Final-form numerical value, when present. */
  finalValue?: number;
  /** Roman character by which expressed. */
  roman: string;
  /** Letter name (Mathers orthography). */
  name: string;
  /** Signification of the name. */
  signification: string;
}

export const MATHERS_TABLE_SOURCE =
  'S.L. MacGregor Mathers, The Kabbalah Unveiled (1887) — Table of Hebrew and Chaldee Letters.';

export const MATHERS_TABLE: MathersTableRow[] = [
  {
    number: 1,
    sound: 'a (soft breathing)',
    letter: 'א',
    value: 1,
    roman: 'A',
    name: 'Aleph',
    signification: 'Ox',
  },
  {
    number: 2,
    sound: 'b, bh (v)',
    letter: 'ב',
    value: 2,
    roman: 'B',
    name: 'Beth',
    signification: 'House',
  },
  {
    number: 3,
    sound: 'g (hard), gh',
    letter: 'ג',
    value: 3,
    roman: 'G',
    name: 'Gimel',
    signification: 'Camel',
  },
  {
    number: 4,
    sound: 'd, dh (flat th)',
    letter: 'ד',
    value: 4,
    roman: 'D',
    name: 'Daleth',
    signification: 'Door',
  },
  {
    number: 5,
    sound: 'h (rough breathing)',
    letter: 'ה',
    value: 5,
    roman: 'H',
    name: 'He',
    signification: 'Window',
  },
  {
    number: 6,
    sound: 'v, u, o',
    letter: 'ו',
    value: 6,
    roman: 'V',
    name: 'Vau',
    signification: 'Peg, nail',
  },
  {
    number: 7,
    sound: 'z, dz',
    letter: 'ז',
    value: 7,
    roman: 'Z',
    name: 'Zayin',
    signification: 'Weapon, sword',
  },
  {
    number: 8,
    sound: 'ch (guttural)',
    letter: 'ח',
    value: 8,
    roman: 'Ch',
    name: 'Cheth',
    signification: 'Enclosure, fence',
  },
  {
    number: 9,
    sound: 't (strong)',
    letter: 'ט',
    value: 9,
    roman: 'T',
    name: 'Teth',
    signification: 'Serpent',
  },
  {
    number: 10,
    sound: 'i, y (as in yes)',
    letter: 'י',
    value: 10,
    roman: 'I',
    name: 'Yod',
    signification: 'Hand',
  },
  {
    number: 11,
    sound: 'k, kh',
    letter: 'כ',
    finalLetter: 'ך',
    value: 20,
    finalValue: 500,
    roman: 'K',
    name: 'Caph',
    signification: 'Palm of the hand',
  },
  {
    number: 12,
    sound: 'l',
    letter: 'ל',
    value: 30,
    roman: 'L',
    name: 'Lamed',
    signification: 'Ox-goad',
  },
  {
    number: 13,
    sound: 'm',
    letter: 'מ',
    finalLetter: 'ם',
    value: 40,
    finalValue: 600,
    roman: 'M',
    name: 'Mem',
    signification: 'Water',
  },
  {
    number: 14,
    sound: 'n',
    letter: 'נ',
    finalLetter: 'ן',
    value: 50,
    finalValue: 700,
    roman: 'N',
    name: 'Nun',
    signification: 'Fish',
  },
  {
    number: 15,
    sound: 's',
    letter: 'ס',
    value: 60,
    roman: 'S',
    name: 'Samekh',
    signification: 'Prop, support',
  },
  {
    number: 16,
    sound: 'o, aa, ng (gutt.)',
    letter: 'ע',
    value: 70,
    roman: 'O',
    name: 'Ayin',
    signification: 'Eye',
  },
  {
    number: 17,
    sound: 'p, ph',
    letter: 'פ',
    finalLetter: 'ף',
    value: 80,
    finalValue: 800,
    roman: 'P',
    name: 'Pe',
    signification: 'Mouth',
  },
  {
    number: 18,
    sound: 'ts, tz, j',
    letter: 'צ',
    finalLetter: 'ץ',
    value: 90,
    finalValue: 900,
    roman: 'Tz',
    name: 'Tzaddi',
    signification: 'Fishing-hook',
  },
  {
    number: 19,
    sound: 'q, qh (guttur.)',
    letter: 'ק',
    value: 100,
    roman: 'Q',
    name: 'Qoph',
    signification: 'Back of the head',
  },
  {
    number: 20,
    sound: 'r',
    letter: 'ר',
    value: 200,
    roman: 'R',
    name: 'Resh',
    signification: 'Head',
  },
  {
    number: 21,
    sound: 'sh, s',
    letter: 'ש',
    value: 300,
    roman: 'Sh',
    name: 'Shin',
    signification: 'Tooth',
  },
  {
    number: 22,
    sound: 'th, t',
    letter: 'ת',
    value: 400,
    roman: 'Th',
    name: 'Tau',
    signification: 'Sign of the cross',
  },
];
