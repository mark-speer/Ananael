/**
 * Subtle Body module — search, filtering, and navigation helpers.
 */

import { CHAKRAS, searchChakras, type Chakra } from '../data/chakras';
import { MERIDIANS, searchMeridians, type Meridian } from '../data/meridians';
import {
  CHAKRA_SEPHIRAH_MAP,
  NEIDAN_STAGES,
  DANTIANS,
  type NeidanStage,
} from '../data/subtleBodyMaps';
import { LITURGY_RITES } from '../data/liturgy';
import { formatPeakHour } from '../data/meridians';

export type SubtleBodyPane = 'chakras' | 'meridians' | 'maps' | 'neidan';

export const SUBTLE_BODY_PANES: { id: SubtleBodyPane; label: string }[] = [
  { id: 'chakras', label: 'Chakras' },
  { id: 'meridians', label: 'Meridians' },
  { id: 'maps', label: 'Maps' },
  { id: 'neidan', label: 'Neidan' },
];

export function searchSubtleBody(
  query: string,
  pane: SubtleBodyPane | null
): { chakras: Chakra[]; meridians: Meridian[] } {
  const q = query.trim();
  if (pane === 'chakras') {
    return { chakras: searchChakras(q), meridians: [] };
  }
  if (pane === 'meridians') {
    return { chakras: [], meridians: searchMeridians(q) };
  }
  return {
    chakras: searchChakras(q),
    meridians: searchMeridians(q),
  };
}

export function relatedRitesForChakra(chakraId: string) {
  return LITURGY_RITES.filter(
    (r) =>
      r.relatedChakras?.includes(chakraId) ||
      (r.tags.includes('chakra') && r.id === 'chakra-circulation')
  );
}

export function relatedRitesForMeridian(meridianId: string) {
  return LITURGY_RITES.filter(
    (r) =>
      r.relatedMeridians?.includes(meridianId) ||
      r.tags.some((t) => ['qigong', 'neidan'].includes(t))
  );
}

export function chakraDisplayOrder(): Chakra[] {
  return [...CHAKRAS];
}

export function meridianDisplayOrder(): Meridian[] {
  return [...MERIDIANS];
}

export { CHAKRA_SEPHIRAH_MAP, NEIDAN_STAGES, DANTIANS, formatPeakHour };

export type { Chakra, Meridian, NeidanStage };
