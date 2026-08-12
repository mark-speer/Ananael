/**
 * Comparative bridges between subtle-body systems and Western / I Ching correspondences.
 * All maps are for study only — traditions disagree; sources are noted inline.
 */

import { getChakra, CHAKRAS, type Chakra, type ChakraId } from './chakras';
import { getMeridian, MERIDIANS, type Meridian, type MeridianId } from './meridians';
import { TRIGRAMS, type TrigramId } from './ichingCorrespondences';
import type { OpusStageId } from './alchemy';

export interface ChakraSephirahMap {
  chakraId: ChakraId;
  sephirahKey: number;
  sephirahName: string;
  source: string;
  notes?: string;
}

/** Regardie / common Golden Dawn–tantra comparative 7↔7 map */
export const CHAKRA_SEPHIRAH_MAP: ChakraSephirahMap[] = [
  { chakraId: 'muladhara', sephirahKey: 10, sephirahName: 'Malkuth', source: 'Common comparative qabalah–tantra chart' },
  { chakraId: 'svadhisthana', sephirahKey: 9, sephirahName: 'Yesod', source: 'Common comparative qabalah–tantra chart' },
  { chakraId: 'manipura', sephirahKey: 7, sephirahName: 'Netzach', source: 'Comparative chart (some lineages use Hod)', notes: 'Solar plexus ↔ Netzach in many Western tantra summaries.' },
  { chakraId: 'anahata', sephirahKey: 6, sephirahName: 'Tiphareth', source: 'Common comparative qabalah–tantra chart' },
  { chakraId: 'vishuddha', sephirahKey: 5, sephirahName: 'Geburah', source: 'Comparative chart (Chesed/Daath also appear in other maps)' },
  { chakraId: 'ajna', sephirahKey: 3, sephirahName: 'Binah', source: 'Comparative chart (Chokmah/Ajna dyads in some systems)' },
  { chakraId: 'sahasrara', sephirahKey: 1, sephirahName: 'Kether', source: 'Common comparative qabalah–tantra chart' },
];

export interface MeridianElementMap {
  meridianId: MeridianId;
  element: string;
  trigramId?: TrigramId;
}

export const MERIDIAN_ELEMENT_MAP: MeridianElementMap[] = MERIDIANS.filter(
  (m) => m.trigramId
).map((m) => ({
  meridianId: m.id as MeridianId,
  element: m.element,
  trigramId: m.trigramId,
}));

export interface Dantian {
  id: string;
  name: string;
  chinese: string;
  location: string;
  notes: string;
}

export const DANTIANS: Dantian[] = [
  {
    id: 'lower',
    name: 'Lower dantian',
    chinese: '下丹田',
    location: 'Lower abdomen (qihai region)',
    notes: 'Storehouse of qi in qigong and neidan; focus of Zhan Zhuang and microcosmic orbit.',
  },
  {
    id: 'middle',
    name: 'Middle dantian',
    chinese: '中丹田',
    location: 'Chest / heart center',
    notes: 'Often associated with breath and emotional refinement in internal alchemy outlines.',
  },
  {
    id: 'upper',
    name: 'Upper dantian',
    chinese: '上丹田',
    location: 'Brow / niwan (mud pill palace)',
    notes: 'Spirit and shen cultivation in neidan study; not a substitute for lineage instruction.',
  },
];

export interface NeidanOpusMap {
  neidanStageId: string;
  opusStageId: OpusStageId;
  source: string;
  notes?: string;
}

/** Comparative neidan ↔ hermetic opus stages — study map only. */
export const NEIDAN_OPUS_MAP: NeidanOpusMap[] = [
  {
    neidanStageId: 'jing',
    opusStageId: 'nigredo',
    source: 'Comparative internal alchemy / opus chart',
    notes: 'Refining jing ↔ blackening / dissolution of the gross.',
  },
  {
    neidanStageId: 'qi',
    opusStageId: 'albedo',
    source: 'Comparative internal alchemy / opus chart',
    notes: 'Circulating qi ↔ whitening / purification.',
  },
  {
    neidanStageId: 'shen',
    opusStageId: 'rubedo',
    source: 'Comparative internal alchemy / opus chart',
    notes: 'Refining shen ↔ reddening / solar crowning metaphor.',
  },
  {
    neidanStageId: 'xu',
    opusStageId: 'rubedo',
    source: 'Comparative internal alchemy / opus chart',
    notes: 'Return to emptiness ↔ completion / union (rubedo or beyond in some maps).',
  },
];

export function getOpusStageForNeidan(
  neidanStageId: string
): NeidanOpusMap | undefined {
  return NEIDAN_OPUS_MAP.find((m) => m.neidanStageId === neidanStageId);
}

export function getNeidanStagesForOpus(opusStageId: OpusStageId): NeidanOpusMap[] {
  return NEIDAN_OPUS_MAP.filter((m) => m.opusStageId === opusStageId);
}

export function searchDantians(query: string): Dantian[] {
  const q = query.trim().toLowerCase();
  if (!q) return DANTIANS;
  return DANTIANS.filter((d) => {
    const hay = [d.id, d.name, d.chinese, d.location, d.notes]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function getDantian(id: string): Dantian | undefined {
  return DANTIANS.find((d) => d.id === id);
}

export interface NeidanStage {
  id: string;
  name: string;
  chinese: string;
  keywords: string[];
  gloss: string;
}

/** Taoist internal alchemy stages — study parallel to Athanor opus (not laboratory work) */
export const NEIDAN_STAGES: NeidanStage[] = [
  {
    id: 'jing',
    name: 'Refining jing',
    chinese: '炼精化气',
    keywords: ['essence', 'kidney', 'foundation'],
    gloss: 'Transform and consolidate bodily essence into refined qi; groundwork of neidan.',
  },
  {
    id: 'qi',
    name: 'Refining qi',
    chinese: '炼气化神',
    keywords: ['circulation', 'orbit', 'breath'],
    gloss: 'Circulate and purify qi; microcosmic orbit and dantian work belong to this phase in study outlines.',
  },
  {
    id: 'shen',
    name: 'Refining shen',
    chinese: '炼神还虚',
    keywords: ['spirit', 'emptiness', 'stillness'],
    gloss: 'Spirit refines toward emptiness and unity; advanced neidan territory requiring qualified transmission.',
  },
  {
    id: 'xu',
    name: 'Return to emptiness',
    chinese: '还虚合道',
    keywords: ['dao', 'unity', 'completion'],
    gloss: 'Union with the Dao in classical neidan rhetoric; comparative rubedo / crowning metaphor only.',
  },
];

export function getComparativeMap(chakraId: string): ChakraSephirahMap | undefined {
  return CHAKRA_SEPHIRAH_MAP.find((m) => m.chakraId === chakraId);
}

export function getChakraForSephirah(key: number): Chakra | undefined {
  const map = CHAKRA_SEPHIRAH_MAP.find((m) => m.sephirahKey === key);
  return map ? getChakra(map.chakraId) : undefined;
}

export function getMeridianForTrigram(trigramId: TrigramId): Meridian[] {
  return MERIDIANS.filter((m) => m.trigramId === trigramId);
}

export function getTrigramForMeridian(meridianId: string): typeof TRIGRAMS[TrigramId] | undefined {
  const m = getMeridian(meridianId);
  return m?.trigramId ? TRIGRAMS[m.trigramId] : undefined;
}

export { getChakra, getMeridian, CHAKRAS, MERIDIANS };
