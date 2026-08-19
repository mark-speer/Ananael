/**
 * Subtle Body module — search, filtering, and navigation helpers.
 */

import { CHAKRAS, searchChakras, type Chakra } from '../data/chakras';
import { MERIDIANS, searchMeridians, type Meridian } from '../data/meridians';
import { MUDRAS, searchMudras, type Mudra } from '../data/mudras';
import {
  CHAKRA_SEPHIRAH_MAP,
  NEIDAN_STAGES,
  DANTIANS,
  getOpusStageForNeidan,
  type NeidanStage,
} from '../data/subtleBodyMaps';
import { LITURGY_RITES } from '../data/liturgy';
import { formatPeakHour } from '../data/meridians';

export type SubtleBodyPane =
  | 'chakras'
  | 'meridians'
  | 'mudras'
  | 'maps'
  | 'neidan'
  | 'practice';

export const SUBTLE_BODY_PANES: { id: SubtleBodyPane; label: string }[] = [
  { id: 'chakras', label: 'Chakras' },
  { id: 'meridians', label: 'Meridians' },
  { id: 'mudras', label: 'Mudras' },
  { id: 'maps', label: 'Maps' },
  { id: 'neidan', label: 'Neidan' },
  { id: 'practice', label: 'Practice' },
];

export function searchSubtleBody(
  query: string,
  pane: SubtleBodyPane | null
): { chakras: Chakra[]; meridians: Meridian[]; mudras: Mudra[] } {
  const q = query.trim();
  if (pane === 'chakras') {
    return { chakras: searchChakras(q), meridians: [], mudras: [] };
  }
  if (pane === 'meridians') {
    return { chakras: [], meridians: searchMeridians(q), mudras: [] };
  }
  if (pane === 'mudras') {
    return { chakras: [], meridians: [], mudras: searchMudras(q) };
  }
  return {
    chakras: searchChakras(q),
    meridians: searchMeridians(q),
    mudras: searchMudras(q),
  };
}

export function relatedRitesForChakra(chakraId: string) {
  return LITURGY_RITES.filter(
    (r) =>
      r.relatedChakras?.includes(chakraId) ||
      (r.tags.includes('chakra') && r.id === 'chakra-circulation')
  );
}

export function relatedRitesForNeidanStage(stageId: string) {
  const byStage: Record<string, string[]> = {
    jing: ['zhan-zhuang'],
    qi: ['microcosmic-orbit', 'ba-duan-jin'],
    shen: ['inner-smile'],
    xu: ['inner-smile', 'microcosmic-orbit'],
  };
  const ids = byStage[stageId] ?? ['microcosmic-orbit'];
  return LITURGY_RITES.filter((r) => ids.includes(r.id));
}

export function relatedRitesForMeridian(meridianId: string) {
  return LITURGY_RITES.filter(
    (r) =>
      r.relatedMeridians?.includes(meridianId) ||
      r.tags.some((t) => ['qigong', 'neidan'].includes(t))
  );
}

const MUDRA_RITE_IDS: Record<string, string[]> = {
  vishnu: ['nadi-shodhana'],
};

export function relatedRitesForMudra(mudraId: string) {
  const extra = MUDRA_RITE_IDS[mudraId] ?? [];
  return LITURGY_RITES.filter(
    (r) => r.relatedMudras?.includes(mudraId) || extra.includes(r.id)
  );
}

export function chakraDisplayOrder(): Chakra[] {
  return [...CHAKRAS];
}

export function meridianDisplayOrder(): Meridian[] {
  return [...MERIDIANS];
}

export function mudraDisplayOrder(): Mudra[] {
  return [...MUDRAS];
}

export { CHAKRA_SEPHIRAH_MAP, NEIDAN_STAGES, DANTIANS, getOpusStageForNeidan, formatPeakHour };

export type { Chakra, Meridian, Mudra, NeidanStage };
