/**
 * Shared journal types and entity suggestion helpers.
 */

import { CORRESPONDENCE_KEYS, flattenDeities } from '../data/correspondences';
import { getHexagramsForKey } from '../data/ichingCorrespondences';
import { GOETIA_SPIRITS } from '../data/arsGoetia';
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
  | 'goetia'
  | 'tarot'
  | 'hexagram'
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

  const ql = q.toLowerCase();
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
