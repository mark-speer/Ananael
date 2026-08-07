/**
 * Golden Dawn–leaning Tree of Life: 10 sephiroth + 22 paths (Liber 777 style).
 * Hebrew latin keys match HEBREW_LETTERS in gematria/alphabets.ts.
 * Tarot IDs use the RWS deck (major-NN) by trump identity (Strength=major-08, Justice=major-11).
 */

export interface Point {
  x: number;
  y: number;
}

export interface Sephira {
  id: number;
  name: string;
  hebrew: string;
  title: string;
  correspondence: string;
  blurb: string;
  center: Point;
}

export interface TreePath {
  /** Path index 11–32 (GD numbering). */
  id: number;
  /** Sephira ids connected by this path. */
  from: number;
  to: number;
  letterLatin: string;
  letterGlyph: string;
  letterName: string;
  tarotId: string;
  correspondence: string;
  blurb: string;
}

/** SVG viewBox width/height used by the interactive glyph. */
export const TREE_VIEWBOX = { width: 400, height: 700 } as const;

export const SEPHIROTH: Sephira[] = [
  {
    id: 1,
    name: 'Kether',
    hebrew: 'כתר',
    title: 'Crown',
    correspondence: 'Primum Mobile',
    blurb:
      'The first emanation — pure unity and the root of will before form.',
    center: { x: 200, y: 55 },
  },
  {
    id: 2,
    name: 'Chokmah',
    hebrew: 'חכמה',
    title: 'Wisdom',
    correspondence: 'Sphere of the Zodiac',
    blurb:
      'Dynamic force and the father principle; raw creative impulse.',
    center: { x: 320, y: 140 },
  },
  {
    id: 3,
    name: 'Binah',
    hebrew: 'בינה',
    title: 'Understanding',
    correspondence: 'Saturn',
    blurb:
      'Form-giving intelligence and the mother principle; structure and limitation.',
    center: { x: 80, y: 140 },
  },
  {
    id: 4,
    name: 'Chesed',
    hebrew: 'חסד',
    title: 'Mercy',
    correspondence: 'Jupiter',
    blurb:
      'Expansion, benevolence, and ordered authority on the pillar of mercy.',
    center: { x: 320, y: 280 },
  },
  {
    id: 5,
    name: 'Geburah',
    hebrew: 'גבורה',
    title: 'Severity',
    correspondence: 'Mars',
    blurb:
      'Strength, judgment, and the refining fire of the pillar of severity.',
    center: { x: 80, y: 280 },
  },
  {
    id: 6,
    name: 'Tiphareth',
    hebrew: 'תפארת',
    title: 'Beauty',
    correspondence: 'Sun',
    blurb:
      'Harmony and the heart of the Tree; balance of mercy and severity.',
    center: { x: 200, y: 360 },
  },
  {
    id: 7,
    name: 'Netzach',
    hebrew: 'נצח',
    title: 'Victory',
    correspondence: 'Venus',
    blurb:
      'Instinct, desire, and enduring life-force on the pillar of mercy.',
    center: { x: 320, y: 480 },
  },
  {
    id: 8,
    name: 'Hod',
    hebrew: 'הוד',
    title: 'Splendor',
    correspondence: 'Mercury',
    blurb:
      'Intellect, language, and magical technique on the pillar of severity.',
    center: { x: 80, y: 480 },
  },
  {
    id: 9,
    name: 'Yesod',
    hebrew: 'יסוד',
    title: 'Foundation',
    correspondence: 'Moon',
    blurb:
      'The astral foundation that gathers and transmits force toward manifestation.',
    center: { x: 200, y: 560 },
  },
  {
    id: 10,
    name: 'Malkuth',
    hebrew: 'מלכות',
    title: 'Kingdom',
    correspondence: 'Earth / Four Elements',
    blurb:
      'The kingdom of form — sensory world and the dwelling of the Shekhinah.',
    center: { x: 200, y: 650 },
  },
];

/**
 * 22 paths with GD Hebrew letter + major arcana attributions.
 * Path ids follow traditional numbering 11–32.
 */
export const PATHS: TreePath[] = [
  {
    id: 11,
    from: 1,
    to: 2,
    letterLatin: 'a',
    letterGlyph: 'א',
    letterName: 'Aleph',
    tarotId: 'major-00',
    correspondence: 'Air',
    blurb: 'The breath of spirit between Crown and Wisdom — the Fool’s leap.',
  },
  {
    id: 12,
    from: 1,
    to: 3,
    letterLatin: 'b',
    letterGlyph: 'ב',
    letterName: 'Beth',
    tarotId: 'major-01',
    correspondence: 'Mercury',
    blurb: 'Directed will and skillful means from Crown into Understanding.',
  },
  {
    id: 13,
    from: 1,
    to: 6,
    letterLatin: 'g',
    letterGlyph: 'ג',
    letterName: 'Gimel',
    tarotId: 'major-02',
    correspondence: 'Moon',
    blurb: 'The high priestess path — veiled knowledge from Crown to Beauty.',
  },
  {
    id: 14,
    from: 2,
    to: 3,
    letterLatin: 'd',
    letterGlyph: 'ד',
    letterName: 'Dalet',
    tarotId: 'major-03',
    correspondence: 'Venus',
    blurb: 'The door uniting Wisdom and Understanding — fertile imagination.',
  },
  {
    id: 15,
    from: 2,
    to: 6,
    letterLatin: 'h',
    letterGlyph: 'ה',
    letterName: 'He',
    tarotId: 'major-04',
    correspondence: 'Aries',
    blurb: 'Sovereign initiative from Wisdom into the heart (GD Emperor).',
  },
  {
    id: 16,
    from: 2,
    to: 4,
    letterLatin: 'v',
    letterGlyph: 'ו',
    letterName: 'Vav',
    tarotId: 'major-05',
    correspondence: 'Taurus',
    blurb: 'Tradition and teaching linking Wisdom to Mercy.',
  },
  {
    id: 17,
    from: 3,
    to: 6,
    letterLatin: 'z',
    letterGlyph: 'ז',
    letterName: 'Zayin',
    tarotId: 'major-06',
    correspondence: 'Gemini',
    blurb: 'Discriminating love from Understanding into Beauty.',
  },
  {
    id: 18,
    from: 3,
    to: 5,
    letterLatin: 'ch',
    letterGlyph: 'ח',
    letterName: 'Chet',
    tarotId: 'major-07',
    correspondence: 'Cancer',
    blurb: 'The chariot of will between Understanding and Severity.',
  },
  {
    id: 19,
    from: 4,
    to: 5,
    letterLatin: 't',
    letterGlyph: 'ט',
    letterName: 'Tet',
    tarotId: 'major-08',
    correspondence: 'Leo',
    blurb: 'Strength (Lust) balancing Mercy and Severity — the serpent power.',
  },
  {
    id: 20,
    from: 4,
    to: 6,
    letterLatin: 'y',
    letterGlyph: 'י',
    letterName: 'Yod',
    tarotId: 'major-09',
    correspondence: 'Virgo',
    blurb: 'The hermit’s lamp from Mercy into the solar heart.',
  },
  {
    id: 21,
    from: 4,
    to: 7,
    letterLatin: 'k',
    letterGlyph: 'כ',
    letterName: 'Kaf',
    tarotId: 'major-10',
    correspondence: 'Jupiter',
    blurb: 'Fortune’s wheel turning Mercy toward Victory.',
  },
  {
    id: 22,
    from: 5,
    to: 6,
    letterLatin: 'l',
    letterGlyph: 'ל',
    letterName: 'Lamed',
    tarotId: 'major-11',
    correspondence: 'Libra',
    blurb: 'Justice (Adjustment) weighing Severity against Beauty.',
  },
  {
    id: 23,
    from: 5,
    to: 8,
    letterLatin: 'm',
    letterGlyph: 'מ',
    letterName: 'Mem',
    tarotId: 'major-12',
    correspondence: 'Water',
    blurb: 'Sacrifice and inversion from Severity into Splendor.',
  },
  {
    id: 24,
    from: 6,
    to: 7,
    letterLatin: 'n',
    letterGlyph: 'נ',
    letterName: 'Nun',
    tarotId: 'major-13',
    correspondence: 'Scorpio',
    blurb: 'Transformation from Beauty into Victory — death and renewal.',
  },
  {
    id: 25,
    from: 6,
    to: 9,
    letterLatin: 's',
    letterGlyph: 'ס',
    letterName: 'Samekh',
    tarotId: 'major-14',
    correspondence: 'Sagittarius',
    blurb: 'Temperance testing the path from Beauty to Foundation.',
  },
  {
    id: 26,
    from: 6,
    to: 8,
    letterLatin: 'aa',
    letterGlyph: 'ע',
    letterName: 'Ayin',
    tarotId: 'major-15',
    correspondence: 'Capricorn',
    blurb: 'The Devil’s bondage and insight between Beauty and Splendor.',
  },
  {
    id: 27,
    from: 7,
    to: 8,
    letterLatin: 'p',
    letterGlyph: 'פ',
    letterName: 'Pe',
    tarotId: 'major-16',
    correspondence: 'Mars',
    blurb: 'The Tower’s sudden awakening across Victory and Splendor.',
  },
  {
    id: 28,
    from: 7,
    to: 9,
    letterLatin: 'tz',
    letterGlyph: 'צ',
    letterName: 'Tsadi',
    tarotId: 'major-17',
    correspondence: 'Aquarius',
    blurb: 'The Star’s hope linking Victory to Foundation (GD Tzaddi).',
  },
  {
    id: 29,
    from: 7,
    to: 10,
    letterLatin: 'q',
    letterGlyph: 'ק',
    letterName: 'Qof',
    tarotId: 'major-18',
    correspondence: 'Pisces',
    blurb: 'The Moon’s dream-path from Victory into the Kingdom.',
  },
  {
    id: 30,
    from: 8,
    to: 9,
    letterLatin: 'r',
    letterGlyph: 'ר',
    letterName: 'Resh',
    tarotId: 'major-19',
    correspondence: 'Sun',
    blurb: 'Solar clarity between Splendor and Foundation.',
  },
  {
    id: 31,
    from: 8,
    to: 10,
    letterLatin: 'sh',
    letterGlyph: 'ש',
    letterName: 'Shin',
    tarotId: 'major-20',
    correspondence: 'Fire',
    blurb: 'Judgement’s awakening fire from Splendor into Malkuth.',
  },
  {
    id: 32,
    from: 9,
    to: 10,
    letterLatin: 'th',
    letterGlyph: 'ת',
    letterName: 'Tav',
    tarotId: 'major-21',
    correspondence: 'Saturn / Earth',
    blurb: 'The World — completion of the path from Foundation to Kingdom.',
  },
];

const SEPHIRA_BY_ID = new Map(SEPHIROTH.map((s) => [s.id, s]));
const PATH_BY_ID = new Map(PATHS.map((p) => [p.id, p]));
const PATH_BY_TAROT = new Map(PATHS.map((p) => [p.tarotId, p]));

export function getSephira(id: number): Sephira | undefined {
  return SEPHIRA_BY_ID.get(id);
}

export function getPath(id: number): TreePath | undefined {
  return PATH_BY_ID.get(id);
}

/** Resolve a Tree path by Major Arcana tarot deck id (e.g. major-00). */
export function getPathByTarotId(tarotId: string): TreePath | undefined {
  return PATH_BY_TAROT.get(tarotId);
}

export function getSephiraCenter(id: number): Point {
  const s = getSephira(id);
  if (!s) throw new Error(`Unknown sephira id: ${id}`);
  return s.center;
}
