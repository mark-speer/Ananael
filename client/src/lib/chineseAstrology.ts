/**
 * Chinese sexagenary (ganzhi) pillars for year, month, day, and hour.
 * Year boundary: Lìchūn ≈ Feb 4 (BaZi / solar-term convention, not lunar New Year).
 * Calendar math only — no ephemeris required.
 */

export type HeavenlyStemId =
  | 'Jia'
  | 'Yi'
  | 'Bing'
  | 'Ding'
  | 'Wu'
  | 'Ji'
  | 'Geng'
  | 'Xin'
  | 'Ren'
  | 'Gui';

export type EarthlyBranchId =
  | 'Zi'
  | 'Chou'
  | 'Yin'
  | 'Mao'
  | 'Chen'
  | 'Si'
  | 'Wu'
  | 'Wei'
  | 'Shen'
  | 'You'
  | 'Xu'
  | 'Hai';

export type ChineseAnimal =
  | 'Rat'
  | 'Ox'
  | 'Tiger'
  | 'Rabbit'
  | 'Dragon'
  | 'Snake'
  | 'Horse'
  | 'Goat'
  | 'Monkey'
  | 'Rooster'
  | 'Dog'
  | 'Pig';

export type ChineseElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type YinYang = 'yang' | 'yin';

export const HEAVENLY_STEMS: readonly HeavenlyStemId[] = [
  'Jia',
  'Yi',
  'Bing',
  'Ding',
  'Wu',
  'Ji',
  'Geng',
  'Xin',
  'Ren',
  'Gui',
] as const;

export const EARTHLY_BRANCHES: readonly EarthlyBranchId[] = [
  'Zi',
  'Chou',
  'Yin',
  'Mao',
  'Chen',
  'Si',
  'Wu',
  'Wei',
  'Shen',
  'You',
  'Xu',
  'Hai',
] as const;

export const BRANCH_ANIMALS: Record<EarthlyBranchId, ChineseAnimal> = {
  Zi: 'Rat',
  Chou: 'Ox',
  Yin: 'Tiger',
  Mao: 'Rabbit',
  Chen: 'Dragon',
  Si: 'Snake',
  Wu: 'Horse',
  Wei: 'Goat',
  Shen: 'Monkey',
  You: 'Rooster',
  Xu: 'Dog',
  Hai: 'Pig',
};

const STEM_ELEMENT: Record<HeavenlyStemId, ChineseElement> = {
  Jia: 'Wood',
  Yi: 'Wood',
  Bing: 'Fire',
  Ding: 'Fire',
  Wu: 'Earth',
  Ji: 'Earth',
  Geng: 'Metal',
  Xin: 'Metal',
  Ren: 'Water',
  Gui: 'Water',
};

const STEM_POLARITY: Record<HeavenlyStemId, YinYang> = {
  Jia: 'yang',
  Yi: 'yin',
  Bing: 'yang',
  Ding: 'yin',
  Wu: 'yang',
  Ji: 'yin',
  Geng: 'yang',
  Xin: 'yin',
  Ren: 'yang',
  Gui: 'yin',
};

export interface StemBranch {
  stemIndex: number;
  branchIndex: number;
  stem: HeavenlyStemId;
  branch: EarthlyBranchId;
  animal: ChineseAnimal;
  element: ChineseElement;
  polarity: YinYang;
  /** Cycle index 0…59. */
  cycleIndex: number;
}

export interface ChinesePillars {
  year: StemBranch;
  month: StemBranch;
  day: StemBranch;
  hour: StemBranch;
}

/** Approximate Lìchūn (start of spring) — BaZi year rollover. */
function lichunDate(gregorianYear: number): Date {
  return new Date(gregorianYear, 1, 4, 0, 0, 0, 0);
}

/** Sexagenary year number using Lìchūn boundary (local civil time). */
function sexagenaryYearNumber(date: Date): number {
  let y = date.getFullYear();
  if (date < lichunDate(y)) y -= 1;
  return y;
}

function stemBranchFromIndices(stemIndex: number, branchIndex: number): StemBranch {
  const s = ((stemIndex % 10) + 10) % 10;
  const b = ((branchIndex % 12) + 12) % 12;
  const stem = HEAVENLY_STEMS[s];
  const branch = EARTHLY_BRANCHES[b];
  // Unique pair in 60-cycle: stem and branch share parity
  const cycleIndex = (() => {
    for (let i = 0; i < 60; i++) {
      if (i % 10 === s && i % 12 === b) return i;
    }
    return (s + 10 * ((b - s + 12) % 12)) % 60;
  })();
  return {
    stemIndex: s,
    branchIndex: b,
    stem,
    branch,
    animal: BRANCH_ANIMALS[branch],
    element: STEM_ELEMENT[stem],
    polarity: STEM_POLARITY[stem],
    cycleIndex,
  };
}

/**
 * Year pillar: (year − 4) mod 10/12 after Lìchūn.
 * 1984 = Jia-Zi.
 */
export function yearPillar(date: Date): StemBranch {
  const y = sexagenaryYearNumber(date);
  return stemBranchFromIndices(y - 4, y - 4);
}

/**
 * Month pillar from solar-term months (寅 starts ≈ Feb 4).
 * Approximate boundaries: day 4–6 of each Gregorian month.
 * Stem depends on year stem (五虎遁).
 */
export function monthPillar(date: Date): StemBranch {
  const yearSb = yearPillar(date);
  // Month branch: Yin=2 starts at Lichun; approximate solar-term day-of-month starts
  const solarMonthStarts: { month: number; day: number; branch: number }[] = [
    { month: 1, day: 4, branch: 2 }, // Yin — Lichun
    { month: 2, day: 6, branch: 3 }, // Mao — Jingzhe
    { month: 3, day: 5, branch: 4 }, // Chen — Qingming
    { month: 4, day: 6, branch: 5 }, // Si — Lixia
    { month: 5, day: 6, branch: 6 }, // Wu — Mangzhong
    { month: 6, day: 7, branch: 7 }, // Wei — Xiaoshu
    { month: 7, day: 8, branch: 8 }, // Shen — Liqiu
    { month: 8, day: 8, branch: 9 }, // You — Bailu
    { month: 9, day: 8, branch: 10 }, // Xu — Hanlu
    { month: 10, day: 7, branch: 11 }, // Hai — Lidong
    { month: 11, day: 7, branch: 0 }, // Zi — Daxue
    { month: 0, day: 6, branch: 1 }, // Chou — Xiaohan (Jan)
  ];

  const y = date.getFullYear();
  let branchIndex = 1; // Chou default early Jan before Xiaohan
  const extended: { at: Date; branch: number }[] = [];
  for (const yy of [y - 1, y, y + 1]) {
    for (const s of solarMonthStarts) {
      extended.push({
        at: new Date(yy, s.month, s.day, 0, 0, 0, 0),
        branch: s.branch,
      });
    }
  }
  extended.sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const c of extended) {
    if (c.at <= date) branchIndex = c.branch;
  }

  // 五虎遁: year stem → Yin-month stem
  // Jia/Ji → Bing, Yi/Geng → Wu, Bing/Xin → Geng, Ding/Ren → Ren, Wu/Gui → Jia
  const yinStemByYearStem = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
  const yinStem = yinStemByYearStem[yearSb.stemIndex];
  const monthOffset = (branchIndex - 2 + 12) % 12;
  const stemIndex = (yinStem + monthOffset) % 10;
  return stemBranchFromIndices(stemIndex, branchIndex);
}

/**
 * Day pillar from civil local date.
 * Epoch: 1899-12-22 was Jia-Zi (cycle day 0) in common ganzhi tables.
 */
export function dayPillar(date: Date): StemBranch {
  const JiaZi = Date.UTC(1899, 11, 22);
  const localMidnight = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const days = Math.floor((localMidnight - JiaZi) / 86_400_000);
  const idx = ((days % 60) + 60) % 60;
  return stemBranchFromIndices(idx % 10, idx % 12);
}

/**
 * Hour pillar (traditional double-hours).
 * Zi spans 23:00–00:59 (late night belongs to the coming civil day for branch,
 * but day stem for 子时 after 23:00 uses the next day's stem in classical BaZi).
 */
export function hourPillar(date: Date): StemBranch {
  const hour = date.getHours();
  // Map clock hour → branch: 23–0 Zi, 1–2 Chou, …
  const branchIndex = Math.floor(((hour + 1) % 24) / 2);

  // Day stem for hour: after 23:00 use next civil day's stem
  let dayRef = date;
  if (hour >= 23) {
    dayRef = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
      12,
      0,
      0,
      0
    );
  }
  const daySb = dayPillar(dayRef);

  // 五鼠遁: day stem → Zi-hour stem
  // Jia/Ji → Jia, Yi/Geng → Bing, Bing/Xin → Wu, Ding/Ren → Geng, Wu/Gui → Ren
  const ziStemByDayStem = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
  const ziStem = ziStemByDayStem[daySb.stemIndex];
  const stemIndex = (ziStem + branchIndex) % 10;
  return stemBranchFromIndices(stemIndex, branchIndex);
}

/** All four pillars for a civil datetime (browser local timezone). */
export function buildChinesePillars(date: Date): ChinesePillars {
  return {
    year: yearPillar(date),
    month: monthPillar(date),
    day: dayPillar(date),
    hour: hourPillar(date),
  };
}

export function formatPillar(p: StemBranch): string {
  return `${p.stem}-${p.branch} (${p.element} ${p.animal})`;
}

export function formatPillarShort(p: StemBranch): string {
  return `${p.element} ${p.animal}`;
}
