/**
 * Marketing / SEO copy for the logged-out splash page.
 */

export const SPLASH_MISSION = {
  headline: 'Tools for the work, gathered in one sanctum.',
  support:
    'Ananael is a modular dashboard for hermetics, ceremonial magic, and esoteric study—divination, correspondences, planetary timing, ritual design, and a journal for your workings.',
  body: `Ananael — the Inner Sanctum — brings ceremonial magic and hermetic practice into a single working environment. Cast tarot and I Ching, calculate gematria and planetary hours, study the Tree of Life and Liber 777–style correspondences, plan altar layouts and Solomonic circles, and keep a Magical Journal of rituals, dreams, and readings. Whether you are exploring Golden Dawn symbolism, Goetia and Heptameron circle work, or daily sky conditions for timing, Magical OS keeps every module within reach.`,
} as const;

export interface SplashFeature {
  id: string;
  title: string;
  description: string;
}

export const SPLASH_FEATURES: SplashFeature[] = [
  {
    id: 'dashboard',
    title: 'Magical OS',
    description:
      'Your default home: a living sky clock with moon phase and planetary hours, quick tarot, active journal workings, Liber 777 correspondences search, and deep links into ritual builders—so the day’s conditions and tools stay in one view.',
  },
  {
    id: 'tarot',
    title: 'Tarot',
    description:
      'Virtual Rider–Waite–style tarot with Single Card, Three-Card, and Celtic Cross spreads. Flip cards, honor reversed meanings, and save readings to your Magical Journal when signed in.',
  },
  {
    id: 'journal',
    title: 'Magical Journal',
    description:
      'A unified log for rituals, dreams, divination, mood, and workings—tagged with moon phase and planetary hour so your practice history stays tied to the sky.',
  },
  {
    id: 'gematria',
    title: 'Gematria',
    description:
      'Calculate Hebrew, Greek, and English letter values for names, verses, and sigils. Explore isopsephy and English ordinal systems, then optionally save significant results to your account.',
  },
  {
    id: 'planetary',
    title: 'Planetary Hours',
    description:
      'Compute Chaldean unequal planetary hours from your latitude, longitude, and date. Sync location to time elections, talisman work, and day-of-the-week rulers with precision.',
  },
  {
    id: 'translator',
    title: 'Script Translator',
    description:
      'Transliterate Latin text into Hebrew, Greek, and Elder Futhark runes—useful for consecrations, talismans, and working names across classical and Northern scripts.',
  },
  {
    id: 'iching',
    title: 'I Ching',
    description:
      'Cast the Book of Changes with coin or yarrow stalk methods. Read King Wen hexagram text, changing lines, and save casts to your Magical Journal.',
  },
  {
    id: 'tree',
    title: 'Tree of Life',
    description:
      'An interactive Golden Dawn Tree of Life: sephiroth, paths, and correspondences for study. Attach personal notes to nodes as you map the Qabalistic schema.',
  },
  {
    id: 'correspondences',
    title: 'Correspondences',
    description:
      'A digital Liber 777–style key scale (1–32): search Hebrew letters, Tarot, planets, elements, colors, and gods across the traditional tables of correspondence.',
  },
  {
    id: 'ritual',
    title: 'Ritual Space Planner',
    description:
      'Design altar and temple layouts on a grid—LBRP and altar templates, ritual tools, PNG and JSON export, and saved layouts for recurring ceremonies.',
  },
  {
    id: 'solomonic',
    title: 'Solomonic Circles',
    description:
      'Build Goetia, Heptameron, and generic magician’s circles with Triangle of Art, Ars Goetia spirit selection, and labeled seal slots for classical Solomonic work.',
  },
];
