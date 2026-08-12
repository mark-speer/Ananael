/**
 * Marketing / SEO copy for the logged-out splash page.
 */

export const SPLASH_MISSION = {
  headline: 'Tools for the work, gathered in one sanctum.',
  support:
    'Ananael is the Inner Sanctum: a modular dashboard for hermetics, ceremonial magic, and esoteric study—divination, correspondences, planetary timing, alchemy, ritual design, subtle-body work, and a journal for your workings.',
  body: `Ananael — the Inner Sanctum — brings ceremonial magic and hermetic practice into a single working environment. Cast Tarot, I Ching, Geomancy, and Runes from one Divination portal; calculate gematria and celestial elections; study the Tree of Life, Liber 777–style correspondences, Enochian tablets, and the Athanor opus; explore chakras, meridians, and neidan with comparative maps to the Western schema; craft kamea and sigils; plan altar layouts and Solomonic circles; browse a Ritual Library with Yoga and Taoist rites plus guided Ritual Runner sessions; and keep a Magical Journal of rituals, dreams, and readings. Magical OS keeps every module within reach.`,
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
      'Your default home: a living sky clock with moon phase, planetary hours, and zodiac cues (each deep-linked into Celestial Timing), a Magical Almanac tile for today’s counsel and alchemical operation, an Athanor tile for the day’s opus stage, quick tarot plus paths into all Divination systems, active journal workings (Ritual Runner sessions Resume into the Library), Liber 777 correspondences search, study tools, and ritual builders—so every module stays one tap away.',
  },
  {
    id: 'divination',
    title: 'Divination',
    description:
      'One portal for Tarot (Single / Three-Card / Celtic Cross), I Ching (coins or yarrow), classical Geomancy charts, and Elder Futhark rune casts—save readings to your Magical Journal when signed in.',
  },
  {
    id: 'journal',
    title: 'Magical Journal',
    description:
      'A unified log for rituals, dreams, divination, mood, and workings—tagged with moon phase, planetary hour, and zodiac cues so your practice history stays tied to the sky.',
  },
  {
    id: 'gematria',
    title: 'Gematria',
    description:
      'Calculate Hebrew, Greek, and English letter values for names, verses, and sigils. Explore isopsephy and English ordinal systems, then optionally save significant results to your account.',
  },
  {
    id: 'planetary',
    title: 'Celestial Timing',
    description:
      'Chaldean planetary hours, live ephemeris with retrogrades, Western / Hindu / Chinese zodiac, an Elections panel for explainable upcoming windows, a Magical Almanac month view with day counsel and alchemical operation of the day, and signed-in chart bookmarks for place and moment.',
  },
  {
    id: 'translator',
    title: 'Script Translator',
    description:
      'Transliterate Latin text into Hebrew, Greek, Elder Futhark, and Sanskrit (IAST ↔ Devanagari)—useful for bija mantras, consecrations, talismans, and working names across traditions.',
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
      'A digital Liber 777–style key scale (1–32): search Hebrew letters, Tarot, planets, elements, metals, colors, chakras, meridians, dantians, and gods across the traditional tables of correspondence.',
  },
  {
    id: 'opus',
    title: 'Athanor',
    description:
      'Hermetic alchemy chamber: opus stages (nigredo to rubedo), a vessel planner with saved designs and metal/principle counsel, Emerald Tablet and Hermetica study cards, active opus workings from the Journal, and deep-links into Almanac, Correspondences, and Talisman.',
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
      'Build Goetia, Heptameron, and generic magician’s circles with Triangle of Art, Ars Goetia spirit selection, and seal artwork in the Triangle slot for classical Solomonic work.',
  },
  {
    id: 'talisman',
    title: 'Talisman Atelier',
    description:
      'Planetary kamea (magic squares), sigil craft, and sutra ofuda talismans—trace names on the square, build chaos-style stroke sigils, or compose protective Japanese ofuda with optional Sanskrit columns, then export PNG/JSON or save designs to your account.',
  },
  {
    id: 'enochian',
    title: 'Enochian',
    description:
      'Elemental tablet samples and the Calls for study, with deep-links into Gematria, Correspondences, and Script Translator, plus optional saved study notes.',
  },
  {
    id: 'liturgy',
    title: 'Ritual Library',
    description:
      'Expanded liturgy corpus (Golden Dawn, Heptameron, Goetia, Alchemy, Yoga, Taoist qigong, Buddhist meditation, solar adorations, consecrations) with purpose, notes, sources, suggested planetary hours, Ritual Space templates, guided Ritual Runner sessions (step checklist + hold timers, live hour strip, resume from Magical OS), and one-click Magical Journal workings.',
  },
  {
    id: 'subtleBody',
    title: 'Subtle Body',
    description:
      'Chakra spine atlas, twelve meridians plus Ren/Du, comparative chakra↔sephirah and neidan↔opus maps, practice vessel planner, meridian peak-hour counsel in Celestial Timing, contextual rite suggestions on Magical OS, and one-tap launch of Eastern rites in the Ritual Library.',
  },
];
