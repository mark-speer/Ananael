/**
 * Shamanism module — search, correspondence field strings, and sky counsel.
 */

import {
  ALLIES,
  DIRECTIONS,
  WORLDS,
  searchAllies,
  searchDirections,
  searchWorlds,
  type AllyKind,
  type ShamanicAlly,
  type ShamanicDirection,
  type ShamanicWorld,
  type WorldId,
} from '../data/shamanism';
import type { MoonPhaseName } from './moonPhase';
import type { PlanetId } from './planetaryHours';

export type ShamanismPane =
  | 'worlds'
  | 'directions'
  | 'allies'
  | 'journey'
  | 'cast'
  | 'practice';

export const SHAMANISM_PANES: { id: ShamanismPane; label: string }[] = [
  { id: 'worlds', label: 'Worlds' },
  { id: 'directions', label: 'Directions' },
  { id: 'allies', label: 'Allies' },
  { id: 'journey', label: 'Journey' },
  { id: 'cast', label: 'Cast' },
  { id: 'practice', label: 'Practice' },
];

export function searchShamanism(
  query: string,
  pane: ShamanismPane | null
): {
  worlds: ShamanicWorld[];
  allies: ShamanicAlly[];
  directions: ShamanicDirection[];
} {
  if (pane === 'worlds') {
    return { worlds: searchWorlds(query), allies: [], directions: [] };
  }
  if (pane === 'allies') {
    return { worlds: [], allies: searchAllies(query), directions: [] };
  }
  if (pane === 'directions') {
    return { worlds: [], allies: [], directions: searchDirections(query) };
  }
  return {
    worlds: searchWorlds(query),
    allies: searchAllies(query),
    directions: searchDirections(query),
  };
}

export function alliesForKind(kind: AllyKind | null, query = ''): ShamanicAlly[] {
  return searchAllies(query, kind);
}

/** Index strings so Liber 777 keys surface shamanic study maps. */
export function shamanismFieldStringsForKey(key: number): string[] {
  const parts: string[] = [];
  for (const w of WORLDS) {
    if (w.sephirahKey === key) {
      parts.push(w.id, w.name, ...w.keywords, 'world', 'axis mundi');
    }
  }
  const keyPlanet: Record<number, string> = {
    1: 'Primum Mobile',
    3: 'Saturn',
    4: 'Jupiter',
    5: 'Mars',
    6: 'Sun',
    7: 'Venus',
    8: 'Mercury',
    9: 'Moon',
    10: 'Earth',
  };
  const planet = keyPlanet[key];
  if (planet) {
    for (const a of ALLIES) {
      if (a.planet === planet || (key === 10 && a.element === 'Earth')) {
        parts.push(a.name, a.id, a.kind, ...a.keywords);
      }
    }
  }
  const keyElement: Record<number, string> = {
    11: 'Air',
    23: 'Water',
    31: 'Fire',
    32: 'Earth',
  };
  const element = keyElement[key];
  if (element) {
    for (const d of DIRECTIONS) {
      if (d.element === element) {
        parts.push(d.name, d.id, ...d.keywords, 'direction');
      }
    }
  }
  return parts;
}

export function worldsForFacet(key: number): ShamanicWorld[] {
  return WORLDS.filter((w) => w.sephirahKey === key);
}

export function alliesForPlanet(planet?: string): ShamanicAlly[] {
  if (!planet) return [];
  const p = planet.toLowerCase();
  return ALLIES.filter((a) => a.planet?.toLowerCase() === p);
}

export function directionsForElement(element?: string): ShamanicDirection[] {
  if (!element) return [];
  const e = element.toLowerCase();
  return DIRECTIONS.filter((d) => d.element?.toLowerCase() === e);
}

const WANING: MoonPhaseName[] = [
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

export function suggestedWorldFromSky(opts: {
  hourRuler?: string;
  dayRuler?: string;
  moonPhase?: string;
  hourSegment?: 'day' | 'night';
}): WorldId {
  if (opts.hourSegment === 'night' || opts.hourRuler === 'Moon') return 'lower';
  if (opts.dayRuler === 'Sun' || opts.hourRuler === 'Sun') return 'upper';
  if (opts.moonPhase && WANING.includes(opts.moonPhase as MoonPhaseName)) {
    return 'lower';
  }
  return 'middle';
}

export function buildShamanismCounsel(
  _when: Date,
  moonName: MoonPhaseName,
  hourRuler?: PlanetId,
  hourSegment?: 'day' | 'night'
): string {
  const world = suggestedWorldFromSky({
    hourRuler,
    moonPhase: moonName,
    hourSegment,
  });
  const worldName = WORLDS.find((w) => w.id === world)?.name ?? 'Middle World';
  if (hourSegment === 'night') {
    return `Night hours favor ${worldName} journey work — drum, descend or walk the land, then ground.`;
  }
  if (hourRuler === 'Moon') {
    return `Hour of the Moon: ${worldName} counsel, dream-adjacent work, and gentle lots.`;
  }
  return `${worldName} is the comparative weather for this sky — study map, not a command.`;
}

export { WORLDS, ALLIES, DIRECTIONS, searchWorlds, searchAllies, searchDirections };
