/**
 * Shared journal types and entity suggestion helpers.
 */

import {
  CLASSICAL_METALS,
  OPUS_STAGES,
  TRIA_PRIMA,
} from '../data/alchemy';
import { CORRESPONDENCE_KEYS, flattenDeities } from '../data/correspondences';
import { getHexagramsForKey } from '../data/ichingCorrespondences';
import { GOETIA_SPIRITS } from '../data/arsGoetia';
import { searchChakras } from '../data/chakras';
import { searchMeridians } from '../data/meridians';
import { DANTIANS } from '../data/subtleBodyMaps';
import { searchCorrespondences } from './correspondences';

export type JournalEntryType =
  | 'ritual'
  | 'dream'
  | 'divination'
  | 'mood'
  | 'working'
  | 'note';

export type WorkingStatus = 'active' | 'paused' | 'complete';

export type JournalEntityKind =
  | 'sephirah'
  | 'planet'
  | 'zodiac'
  | 'hebrewLetter'
  | 'angel'
  | 'archangel'
  | 'spirit'
  | 'deity'
  | 'element'
  | 'color'
  | 'incense'
  | 'stone'
  | 'plant'
  | 'metal'
  | 'principle'
  | 'opusStage'
  | 'goetia'
  | 'tarot'
  | 'hexagram'
  | 'chakra'
  | 'meridian'
  | 'dantian'
  | 'other';

export interface JournalEntity {
  kind: JournalEntityKind;
  id: string;
  label: string;
}

export interface JournalSky {
  moonPhase?: string;
  moonIllum?: number;
  dayRuler?: string;
  hourRuler?: string;
  sunSign?: string;
  nakshatra?: string;
  chineseDay?: string;
  lat?: number;
  lon?: number;
}

export interface JournalEntry {
  _id: string;
  entryType: JournalEntryType;
  occurredAt: string;
  title?: string;
  body?: string;
  mood?: number | null;
  energy?: number | null;
  status?: WorkingStatus | null;
  tags: string[];
  entities: JournalEntity[];
  sky?: JournalSky | null;
  payload?: Record<string, unknown> | null;
  links?: Array<{ module: string; refModel: string; refId: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export const ENTRY_TYPE_LABELS: Record<JournalEntryType, string> = {
  ritual: 'Ritual',
  dream: 'Dream',
  divination: 'Divination',
  mood: 'Mood / Energy',
  working: 'Working',
  note: 'Note',
};

export const ENTRY_TYPES: JournalEntryType[] = [
  'ritual',
  'dream',
  'divination',
  'mood',
  'working',
  'note',
];

/** Suggest entities from Liber 777 + Goetia for the tag picker. */
export function suggestJournalEntities(query: string, limit = 12): JournalEntity[] {
  const q = query.trim();
  if (!q) {
    // Seed suggestions: planets + sephiroth
    const seeds: JournalEntity[] = [];
    for (const key of CORRESPONDENCE_KEYS) {
      if (key.kind === 'sephira') {
        seeds.push({
          kind: 'sephirah',
          id: String(key.key),
          label: key.name,
        });
      }
      if (key.planet) {
        const exists = seeds.some(
          (s) => s.kind === 'planet' && s.id === key.planet!.toLowerCase()
        );
        if (!exists) {
          seeds.push({
            kind: 'planet',
            id: key.planet.toLowerCase(),
            label: key.planet,
          });
        }
      }
    }
    return seeds.slice(0, limit);
  }

  const results: JournalEntity[] = [];
  const seen = new Set<string>();

  const add = (e: JournalEntity) => {
    const k = `${e.kind}:${e.id}`;
    if (seen.has(k)) return;
    seen.add(k);
    results.push(e);
  };

  for (const c of searchChakras(q)) {
    if (results.length >= limit) break;
    add({ kind: 'chakra', id: c.id, label: c.name });
  }
  for (const m of searchMeridians(q)) {
    if (results.length >= limit) break;
    add({ kind: 'meridian', id: m.id, label: m.name });
  }
  const ql = q.toLowerCase();
  for (const d of DANTIANS) {
    if (results.length >= limit) break;
    if (
      d.name.toLowerCase().includes(ql) ||
      d.id.includes(ql) ||
      d.chinese.includes(q)
    ) {
      add({ kind: 'dantian', id: d.id, label: d.name });
    }
  }

  const search = searchCorrespondences(q, null);
  for (const match of search.matches) {
    if (results.length >= limit) break;
    if (match.kind === 'sephira') {
      add({ kind: 'sephirah', id: String(match.key), label: match.name });
    }
    if (match.planet) {
      add({
        kind: 'planet',
        id: match.planet.toLowerCase(),
        label: match.planet,
      });
    }
    if (match.archangel) {
      add({
        kind: 'archangel',
        id: match.archangel.toLowerCase(),
        label: match.archangel,
      });
    }
    if (match.angel) {
      add({ kind: 'angel', id: match.angel.toLowerCase(), label: match.angel });
    }
    if (match.spirit) {
      add({
        kind: 'spirit',
        id: match.spirit.toLowerCase(),
        label: match.spirit,
      });
    }
    if (match.zodiac) {
      add({
        kind: 'zodiac',
        id: match.zodiac.toLowerCase(),
        label: match.zodiac,
      });
    }
    if (match.element) {
      add({
        kind: 'element',
        id: match.element.toLowerCase(),
        label: match.element,
      });
    }
    if (match.metal) {
      add({
        kind: 'metal',
        id: match.metal.toLowerCase(),
        label: match.metal,
      });
    }
    for (const deity of flattenDeities(match.deities)) {
      add({
        kind: 'deity',
        id: deity.toLowerCase(),
        label: deity,
      });
    }
    for (const hex of getHexagramsForKey(match.key)) {
      add({
        kind: 'hexagram',
        id: String(hex.number),
        label: `${hex.number}. ${hex.name}`,
      });
    }
  }

  for (const metal of CLASSICAL_METALS) {
    if (results.length >= limit) break;
    if (metal.toLowerCase().includes(ql)) {
      add({ kind: 'metal', id: metal.toLowerCase(), label: metal });
    }
  }
  for (const principle of TRIA_PRIMA) {
    if (results.length >= limit) break;
    if (
      principle.name.toLowerCase().includes(ql) ||
      principle.latin.toLowerCase().includes(ql) ||
      principle.id.includes(ql)
    ) {
      add({
        kind: 'principle',
        id: principle.id,
        label: principle.name,
      });
    }
  }
  for (const stage of OPUS_STAGES) {
    if (results.length >= limit) break;
    if (
      stage.name.toLowerCase().includes(ql) ||
      stage.id.includes(ql) ||
      stage.colorOfWork.toLowerCase().includes(ql) ||
      stage.keywords.some((k) => k.includes(ql))
    ) {
      add({
        kind: 'opusStage',
        id: stage.id,
        label: stage.name,
      });
    }
  }
  for (const spirit of GOETIA_SPIRITS) {
    if (results.length >= limit) break;
    if (
      spirit.name.toLowerCase().includes(ql) ||
      String(spirit.number).includes(ql)
    ) {
      add({
        kind: 'goetia',
        id: spirit.id,
        label: spirit.name,
      });
    }
  }

  return results.slice(0, limit);
}
