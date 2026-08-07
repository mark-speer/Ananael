/**
 * Search and entity-cluster helpers for the Correspondence Encyclopedia.
 */

import {
  CORRESPONDENCE_KEYS,
  FACET_LABELS,
  PANTHEON_LABELS,
  PANTHEONS,
  flattenDeities,
  formatDeityParallels,
  type CorrespondenceFacet,
  type CorrespondenceKey,
  type PantheonId,
} from '../data/correspondences';
import { getCardById } from '../data/tarotDeck';

export interface EntityCluster {
  /** Display label for the resolved entity (e.g. "Venus"). */
  label: string;
  /** Facet that best describes this entity. */
  facet: CorrespondenceFacet | 'day' | 'metal' | 'tarot';
  /** Highlighted correspondences for the cluster summary card. */
  highlights: { label: string; value: string }[];
  /** Primary key when one sephira anchors the entity. */
  primaryKey?: number;
}

export interface CorrespondenceSearchResult {
  query: string;
  facet: CorrespondenceFacet | null;
  cluster?: EntityCluster;
  matches: CorrespondenceKey[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldStrings(key: CorrespondenceKey): string[] {
  const parts: string[] = [
    String(key.key),
    key.name,
    key.title ?? '',
    key.hebrew ?? '',
    key.hebrewLetter ?? '',
    key.letterGlyph ?? '',
    key.letterName ?? '',
    key.planet ?? '',
    key.zodiac ?? '',
    key.element ?? '',
    key.day ?? '',
    key.metal ?? '',
    key.archangel ?? '',
    key.angel ?? '',
    key.spirit ?? '',
    key.divineName ?? '',
    key.notes ?? '',
    key.tarotId ?? '',
    ...key.color,
    ...(key.incense ?? []),
    ...(key.stone ?? []),
    ...(key.plant ?? []),
    ...flattenDeities(key.deities),
    ...PANTHEONS.filter((p) => (key.deities?.[p]?.length ?? 0) > 0).map(
      (p) => PANTHEON_LABELS[p],
    ),
  ];

  if (key.tarotId) {
    const card = getCardById(key.tarotId);
    if (card) {
      parts.push(card.name);
      // Also index without leading "The "
      parts.push(card.name.replace(/^The\s+/i, ''));
    }
  }

  if (key.kind === 'sephira') {
    parts.push('sephira', 'sephirah', 'sephiroth');
  }

  return parts.filter(Boolean);
}

function keyMatchesQuery(key: CorrespondenceKey, q: string): boolean {
  if (!q) return true;
  const haystack = normalize(fieldStrings(key).join(' '));
  const tokens = q.split(' ').filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

function keyMatchesFacet(
  key: CorrespondenceKey,
  facet: CorrespondenceFacet | null,
  q: string,
): boolean {
  if (!facet) return keyMatchesQuery(key, q);

  const facetValues = facetFieldValues(key, facet);
  if (!q) {
    // Browse-by-facet: show keys that have that facet populated.
    return facetValues.length > 0;
  }
  const haystack = normalize(facetValues.join(' '));
  const tokens = q.split(' ').filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

function facetFieldValues(
  key: CorrespondenceKey,
  facet: CorrespondenceFacet,
): string[] {
  switch (facet) {
    case 'sephirah':
      return key.kind === 'sephira' ? [key.name, key.title ?? '', key.hebrew ?? ''] : [];
    case 'planet':
      return key.planet ? [key.planet] : [];
    case 'zodiac':
      return key.zodiac ? [key.zodiac] : [];
    case 'hebrewLetter':
      return [key.letterName, key.letterGlyph, key.hebrewLetter, key.hebrew].filter(
        (v): v is string => Boolean(v),
      );
    case 'angel':
      return key.angel ? [key.angel] : [];
    case 'archangel':
      return key.archangel ? [key.archangel] : [];
    case 'spirit':
      return key.spirit ? [key.spirit] : [];
    case 'deity': {
      const names = flattenDeities(key.deities);
      const labels = PANTHEONS.filter(
        (p) => (key.deities?.[p]?.length ?? 0) > 0,
      ).map((p) => PANTHEON_LABELS[p]);
      return [...names, ...labels];
    }
    case 'element':
      return key.element ? [key.element] : [];
    case 'color':
      return key.color;
    case 'incense':
      return key.incense ?? [];
    case 'stone':
      return key.stone ?? [];
    case 'plant':
      return key.plant ?? [];
    default:
      return [];
  }
}

/** Classical planet hubs used for cluster summaries. */
const PLANET_HUBS: {
  planet: string;
  aliases: string[];
  sephiraKey: number;
  pathKey?: number;
}[] = [
  {
    planet: 'Saturn',
    aliases: ['saturn', 'saturday'],
    sephiraKey: 3,
    pathKey: 32,
  },
  {
    planet: 'Jupiter',
    aliases: ['jupiter', 'thursday'],
    sephiraKey: 4,
    pathKey: 21,
  },
  {
    planet: 'Mars',
    aliases: ['mars', 'tuesday'],
    sephiraKey: 5,
    pathKey: 27,
  },
  {
    planet: 'Sun',
    aliases: ['sun', 'sol', 'sunday'],
    sephiraKey: 6,
    pathKey: 30,
  },
  {
    planet: 'Venus',
    aliases: ['venus', 'friday'],
    sephiraKey: 7,
    pathKey: 14,
  },
  {
    planet: 'Mercury',
    aliases: ['mercury', 'wednesday'],
    sephiraKey: 8,
    pathKey: 12,
  },
  {
    planet: 'Moon',
    aliases: ['moon', 'luna', 'monday'],
    sephiraKey: 9,
    pathKey: 13,
  },
];

function buildPlanetCluster(
  planet: string,
  sephira: CorrespondenceKey,
  path?: CorrespondenceKey,
): EntityCluster {
  const highlights: { label: string; value: string }[] = [];
  highlights.push({ label: 'Sephirah', value: sephira.name });
  if (sephira.day) highlights.push({ label: 'Day', value: sephira.day });
  if (sephira.color[0]) highlights.push({ label: 'Color', value: sephira.color[0] });
  if (sephira.metal) highlights.push({ label: 'Metal', value: sephira.metal });
  const plantOrIncense =
    sephira.plant?.[0] ?? sephira.incense?.[0];
  if (plantOrIncense) {
    highlights.push({
      label: sephira.plant?.[0] ? 'Plant' : 'Incense',
      value: plantOrIncense,
    });
  }
  if (sephira.archangel) {
    highlights.push({ label: 'Archangel', value: sephira.archangel });
  }
  if (path?.tarotId) {
    const card = getCardById(path.tarotId);
    highlights.push({
      label: 'Tarot',
      value: card?.name ?? path.tarotId,
    });
  }
  if (sephira.stone?.[0]) {
    highlights.push({ label: 'Stone', value: sephira.stone[0] });
  }
  if (sephira.spirit) {
    highlights.push({ label: 'Spirit', value: sephira.spirit });
  }
  const parallels = formatDeityParallels(sephira.deities);
  if (parallels) {
    highlights.push({ label: 'Parallels', value: parallels });
  }

  return {
    label: planet,
    facet: 'planet',
    highlights,
    primaryKey: sephira.key,
  };
}

function pantheonOfDeity(
  key: CorrespondenceKey,
  deityName: string,
): PantheonId | undefined {
  const n = normalize(deityName);
  for (const p of PANTHEONS) {
    if ((key.deities?.[p] ?? []).some((d) => normalize(d) === n)) {
      return p;
    }
  }
  return undefined;
}

function buildDeityCluster(
  matchedName: string,
  key: CorrespondenceKey,
): EntityCluster {
  const highlights: { label: string; value: string }[] = [];
  const pantheon = pantheonOfDeity(key, matchedName);
  if (pantheon) {
    highlights.push({ label: 'Pantheon', value: PANTHEON_LABELS[pantheon] });
  }
  const parallels = formatDeityParallels(key.deities);
  if (parallels) {
    highlights.push({ label: 'Parallels', value: parallels });
  }
  highlights.push({
    label: key.kind === 'sephira' ? 'Sephirah' : 'Path',
    value: `Key ${key.key} · ${key.name}`,
  });
  if (key.planet) highlights.push({ label: 'Planet', value: key.planet });
  if (key.zodiac) highlights.push({ label: 'Zodiac', value: key.zodiac });
  if (key.element) highlights.push({ label: 'Element', value: key.element });
  if (key.tarotId) {
    const card = getCardById(key.tarotId);
    highlights.push({ label: 'Tarot', value: card?.name ?? key.tarotId });
  }
  return {
    label: matchedName,
    facet: 'deity',
    highlights,
    primaryKey: key.key,
  };
}

function resolveCluster(
  rawQuery: string,
  matches: CorrespondenceKey[],
): EntityCluster | undefined {
  const q = normalize(rawQuery);
  if (!q) return undefined;

  // Exact deity name → pantheon parallels cluster
  for (const key of CORRESPONDENCE_KEYS) {
    for (const name of flattenDeities(key.deities)) {
      if (normalize(name) === q) {
        return buildDeityCluster(name, key);
      }
    }
  }

  // Planet / day hub
  for (const hub of PLANET_HUBS) {
    if (hub.aliases.some((a) => q === a || q.includes(a))) {
      const sephira = CORRESPONDENCE_KEYS.find((k) => k.key === hub.sephiraKey);
      const path = hub.pathKey
        ? CORRESPONDENCE_KEYS.find((k) => k.key === hub.pathKey)
        : undefined;
      if (sephira) return buildPlanetCluster(hub.planet, sephira, path);
    }
  }

  // Exact sephirah name / archangel / spirit / angel / letter / zodiac / element
  const exactSephira = CORRESPONDENCE_KEYS.find(
    (k) =>
      k.kind === 'sephira' &&
      (normalize(k.name) === q ||
        normalize(k.title ?? '') === q ||
        normalize(k.archangel ?? '') === q ||
        normalize(k.spirit ?? '') === q),
  );
  if (exactSephira?.planet) {
    const hub = PLANET_HUBS.find(
      (h) => normalize(h.planet) === normalize(exactSephira.planet!),
    );
    const path = hub?.pathKey
      ? CORRESPONDENCE_KEYS.find((k) => k.key === hub.pathKey)
      : undefined;
    return buildPlanetCluster(
      exactSephira.planet,
      exactSephira,
      path,
    );
  }

  // Archangel / spirit hit that maps to a sephira via matches
  const sephiraMatch = matches.find((k) => k.kind === 'sephira');
  if (
    sephiraMatch &&
    (normalize(sephiraMatch.archangel ?? '') === q ||
      normalize(sephiraMatch.spirit ?? '') === q ||
      normalize(sephiraMatch.angel ?? '') === q)
  ) {
    if (sephiraMatch.planet) {
      const hub = PLANET_HUBS.find(
        (h) => normalize(h.planet) === normalize(sephiraMatch.planet!),
      );
      const path = hub?.pathKey
        ? CORRESPONDENCE_KEYS.find((k) => k.key === hub.pathKey)
        : undefined;
      return buildPlanetCluster(sephiraMatch.planet, sephiraMatch, path);
    }
  }

  // Zodiac exact
  const zodiacKey = CORRESPONDENCE_KEYS.find(
    (k) => k.zodiac && normalize(k.zodiac) === q,
  );
  if (zodiacKey?.zodiac) {
    const highlights: { label: string; value: string }[] = [
      { label: 'Zodiac', value: zodiacKey.zodiac },
      { label: 'Path', value: `Key ${zodiacKey.key} · ${zodiacKey.name}` },
    ];
    if (zodiacKey.element) {
      highlights.push({ label: 'Element', value: zodiacKey.element });
    }
    if (zodiacKey.planet) {
      highlights.push({ label: 'Ruler', value: zodiacKey.planet });
    }
    if (zodiacKey.tarotId) {
      const card = getCardById(zodiacKey.tarotId);
      highlights.push({ label: 'Tarot', value: card?.name ?? zodiacKey.tarotId });
    }
    if (zodiacKey.letterGlyph) {
      highlights.push({
        label: 'Hebrew letter',
        value: `${zodiacKey.letterName ?? ''} ${zodiacKey.letterGlyph}`.trim(),
      });
    }
    return {
      label: zodiacKey.zodiac,
      facet: 'zodiac',
      highlights,
      primaryKey: zodiacKey.key,
    };
  }

  // Element exact
  const elementKeys = CORRESPONDENCE_KEYS.filter(
    (k) => k.element && normalize(k.element) === q,
  );
  if (elementKeys.length > 0 && ['fire', 'water', 'air', 'earth', 'spirit'].includes(q)) {
    const primary = elementKeys[0];
    const highlights: { label: string; value: string }[] = [
      { label: 'Element', value: primary.element! },
      {
        label: 'Keys',
        value: elementKeys.map((k) => `${k.key} ${k.name}`).join(', '),
      },
    ];
    if (primary.color[0]) {
      highlights.push({ label: 'Color', value: primary.color[0] });
    }
    return {
      label: primary.element!,
      facet: 'element',
      highlights,
      primaryKey: primary.key,
    };
  }

  return undefined;
}

/**
 * Search correspondence keys. Empty query returns all keys (optionally
 * filtered to those that populate the active facet).
 */
export function searchCorrespondences(
  query: string,
  facet: CorrespondenceFacet | null = null,
): CorrespondenceSearchResult {
  const q = normalize(query);
  const matches = CORRESPONDENCE_KEYS.filter((k) =>
    keyMatchesFacet(k, facet, q),
  );

  const cluster = q && !facet ? resolveCluster(query, matches) : undefined;

  return {
    query,
    facet,
    cluster,
    matches,
  };
}

export function primaryCorrespondenceLabel(key: CorrespondenceKey): string {
  if (key.kind === 'sephira') {
    return [key.planet, key.element].filter(Boolean).join(' · ') || key.title || '';
  }
  return (
    [key.planet, key.zodiac, key.element].filter(Boolean).join(' · ') ||
    key.letterName ||
    ''
  );
}

export { FACET_LABELS };
