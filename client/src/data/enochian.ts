/**
 * Enochian study data — traditional / public-domain tablet samples and Calls.
 * Letter grids are abbreviated study excerpts for UI exploration, not a claim
 * of a complete Great Table encoding. English Call lines follow early
 * public-domain Dee/Casaubon-tradition wording in condensed form.
 */

export type EnochianElement = 'Fire' | 'Water' | 'Air' | 'Earth';

export interface EnochianTablet {
  element: EnochianElement;
  /** Row-major Latin letters (study sample). */
  grid: string[][];
}

/** Compact 5×5 study samples per elemental quarter. */
export const ENOCHIAN_TABLETS: EnochianTablet[] = [
  {
    element: 'Fire',
    grid: [
      ['r', 'Z', 'i', 'l', 'a'],
      ['a', 'r', 'd', 'Z', 'a'],
      ['Z', 'a', 'a', 'a', 'a'],
      ['p', 'a', 'L', 'c', 'o'],
      ['s', 'd', 'a', 'Z', 'i'],
    ],
  },
  {
    element: 'Water',
    grid: [
      ['T', 'a', 'O', 'A', 'd'],
      ['u', 'p', 'a', 'c', 'h'],
      ['n', 'a', 'o', 'c', 'O'],
      ['o', 'm', 'a', 'g', 'g'],
      ['b', 'a', 'r', 'i', 'n'],
    ],
  },
  {
    element: 'Air',
    grid: [
      ['a', 'Z', 'd', 'o', 'i'],
      ['n', 'a', 'c', 'h', 'a'],
      ['p', 'a', 'L', 'c', 'o'],
      ['s', 'a', 'a', 'i', 'z'],
      ['m', 'o', 'r', 'd', 'i'],
    ],
  },
  {
    element: 'Earth',
    grid: [
      ['b', 'O', 'a', 'Z', 'a'],
      ['r', 'a', 'p', 'h', 'i'],
      ['n', 'a', 'z', 'o', 'd'],
      ['a', 'i', 'd', 'o', 'r'],
      ['G', 'a', 'l', 's', 'a'],
    ],
  },
];

export interface EnochianCall {
  id: string;
  number: number;
  title: string;
  lines: string[];
}

export const ENOCHIAN_CALLS: EnochianCall[] = [
  {
    id: 'call-1',
    number: 1,
    title: 'The First Key',
    lines: [
      'I reign over you, saith the God of Justice, in power exalted above the firmaments of wrath:',
      'in whose hands the Sun is as a sword, and the Moon as a through-thrusting fire:',
      'which measureth your garments in the midst of my vestures, and trussed you together as the palms of my hands:',
      'whose seats I garnished with the fire of gathering, and beautified your garments with admiration:',
      'to whom I made a law to govern the holy ones, and delivered you a rod with the ark of knowledge.',
    ],
  },
  {
    id: 'call-2',
    number: 2,
    title: 'The Second Key',
    lines: [
      'Can the wings of the winds understand your voices of wonder, O you the second of the First,',
      'whom the burning flames have framed within the depth of my jaws;',
      'whom I have prepared as cups for a wedding, or as the flowers in their beauty for the chamber of righteousness.',
      'Stronger are your feet than the barren stone, and mightier are your voices than the manifold winds.',
      'For you are become a building such as is not, but in the mind of the All-Powerful.',
    ],
  },
  {
    id: 'call-3',
    number: 3,
    title: 'The Third Key',
    lines: [
      'Behold, sayeth your God, I am a Circle on whose hands stand Twelve Kingdoms.',
      'Six are the seats of living breath, the rest are as sharp sickles, or the horns of death,',
      'wherein the creatures of the earth are and are not, except by mine own hands,',
      'which also sleep and shall rise. In the first I made you stewards, and placed you in seats twelve of government,',
      'giving unto every one of you power successively over the 456 true ages of time.',
    ],
  },
  {
    id: 'call-4',
    number: 4,
    title: 'The Fourth Key',
    lines: [
      'I have set my feet in the South, and have looked about me, saying:',
      'Are not the thunders of increase numbered 33, which reign in the second angle?',
      'Under whom I have placed 9639 whom none hath yet numbered but One;',
      'in whom the Second Beginning of things are and wax strong;',
      'which also successively are the numbers of Time, and their powers are as the first 456.',
    ],
  },
  {
    id: 'call-5',
    number: 5,
    title: 'The Fifth Key',
    lines: [
      'The mighty sounds have entered into the third angle, and are become as olives in the olive mount,',
      'looking with gladness upon the earth, and dwelling in the brightness of the heavens as continual comforters,',
      'unto whom I fastened pillars of gladness 19, and gave them vessels to water the earth withal;',
      'they are the brothers of the first and second, and the beginning of their own seats,',
      'which are garnished with 69636 continually that continue and shall not cease until the end of time.',
    ],
  },
  {
    id: 'call-30',
    number: 30,
    title: 'The Key of the Thirty Aires (abbreviated)',
    lines: [
      'O you heavens that dwell in the First Air, you are mighty in the parts of the Earth,',
      'and execute the judgment of the Highest! To you it is said: Behold the Face of your God,',
      'the beginning of comfort, whose eyes are the brightness of the heavens,',
      'which provided you for the government of the Earth, and her unspeakable variety,',
      'furnishing you with a power of understanding to dispose all things according to the providence of Him that sitteth on the Holy Throne.',
    ],
  },
];

export function getTablet(element: EnochianElement): EnochianTablet {
  return ENOCHIAN_TABLETS.find((t) => t.element === element)!;
}

export function getCall(id: string): EnochianCall | undefined {
  return ENOCHIAN_CALLS.find((c) => c.id === id);
}
