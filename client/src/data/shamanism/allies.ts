/**
 * Comparative ally catalog. Personal allies belong on the practice vessel,
 * not in a quiz. Plant entries are encyclopedic — no preparation or dosing.
 */

export type AllyKind = 'animal' | 'plant' | 'spirit' | 'ancestor';

export interface ShamanicAlly {
  id: string;
  name: string;
  kind: AllyKind;
  tradition: string;
  keywords: string[];
  notes?: string;
  planet?: string;
  element?: string;
  sources?: string[];
}

export const ALLIES: ShamanicAlly[] = [
  {
    id: 'lion',
    name: 'Lion',
    kind: 'animal',
    tradition: 'Comparative (777)',
    keywords: ['sun', 'courage', 'sovereignty'],
    planet: 'Sun',
    element: 'Fire',
    notes: 'Solar animal on the Liber 777 plant/animal columns as a study default.',
    sources: ['Liber 777–style solar attributions (study)'],
  },
  {
    id: 'eagle',
    name: 'Eagle',
    kind: 'animal',
    tradition: 'Comparative (777)',
    keywords: ['height', 'vision', 'jupiter'],
    planet: 'Jupiter',
    element: 'Air',
    notes: 'Sky-sight and expansion; comparative Jovian bird, not a tribal emblem.',
    sources: ['Liber 777–style Jovian attributions (study)'],
  },
  {
    id: 'serpent',
    name: 'Serpent',
    kind: 'animal',
    tradition: 'Comparative (777)',
    keywords: ['mercury', 'wisdom', 'kundalini', 'threshold'],
    planet: 'Mercury',
    element: 'Fire',
    notes: 'Threshold and knowledge images across many maps; not a closed snake medicine.',
    sources: ['Comparative mercurial / telluric serpent lore (study)'],
  },
  {
    id: 'wolf',
    name: 'Wolf',
    kind: 'animal',
    tradition: 'Comparative',
    keywords: ['pack', 'night', 'pathfinding'],
    planet: 'Moon',
    element: 'Earth',
    notes: 'Night-path and kinship images in Eurasian folklore summaries.',
    sources: ['Comparative folklore (study)'],
  },
  {
    id: 'raven',
    name: 'Raven',
    kind: 'animal',
    tradition: 'Comparative',
    keywords: ['saturn', 'omen', 'message', 'threshold'],
    planet: 'Saturn',
    element: 'Air',
    notes: 'Messenger and limit-keeper in several North Eurasian story cycles (study).',
    sources: ['Comparative folklore (study)'],
  },
  {
    id: 'stag',
    name: 'Stag',
    kind: 'animal',
    tradition: 'Comparative (777)',
    keywords: ['forest', 'crown', 'jupiter', 'axis'],
    planet: 'Jupiter',
    element: 'Earth',
    notes: 'Horned crown as a world-tree image in European folk and 777 animal lists.',
    sources: ['Liber 777–style attributions (study)'],
  },
  {
    id: 'owl',
    name: 'Owl',
    kind: 'animal',
    tradition: 'Comparative',
    keywords: ['night', 'moon', 'seeing-in-dark'],
    planet: 'Moon',
    element: 'Air',
    notes: 'Nocturnal sight; lunar / Athena-adjacent study parallel, not a clan totem.',
    sources: ['Comparative lunar bird lore (study)'],
  },
  {
    id: 'horse',
    name: 'Horse',
    kind: 'animal',
    tradition: 'Comparative',
    keywords: ['journey', 'sun', 'travel', 'drum'],
    planet: 'Sun',
    element: 'Fire',
    notes: 'Classic journey-mount in steppe and northern Eurasian study summaries.',
    sources: ['Comparative journey-mount lore (study)'],
  },
  {
    id: 'oak',
    name: 'Oak',
    kind: 'plant',
    tradition: 'Comparative (777)',
    keywords: ['jupiter', 'endurance', 'axis', 'grove'],
    planet: 'Jupiter',
    element: 'Earth',
    notes: 'Encyclopedic tree ally. No harvesting or preparation instructions.',
    sources: ['Liber 777 plant column (study)'],
  },
  {
    id: 'willow',
    name: 'Willow',
    kind: 'plant',
    tradition: 'Comparative (777)',
    keywords: ['moon', 'water', 'grief', 'flexibility'],
    planet: 'Moon',
    element: 'Water',
    notes: 'Encyclopedic tree ally. No harvesting or preparation instructions.',
    sources: ['Liber 777 plant column (study)'],
  },
  {
    id: 'mistletoe',
    name: 'Mistletoe',
    kind: 'plant',
    tradition: 'Comparative (777)',
    keywords: ['threshold', 'between', 'kether'],
    planet: 'Primum Mobile',
    element: 'Spirit',
    notes: 'Encyclopedic; toxic in physical use — names and lore only.',
    sources: ['Liber 777 plant column (study)'],
  },
  {
    id: 'bay',
    name: 'Bay / Laurel',
    kind: 'plant',
    tradition: 'Comparative (777)',
    keywords: ['sun', 'victory', 'oracle'],
    planet: 'Sun',
    element: 'Fire',
    notes: 'Encyclopedic solar plant. No preparation or ingestion guidance.',
    sources: ['Liber 777 plant column (study)'],
  },
  {
    id: 'ancestor',
    name: 'Ancestral helper',
    kind: 'ancestor',
    tradition: 'Three-worlds study',
    keywords: ['lineage', 'lower', 'counsel', 'kin'],
    element: 'Earth',
    notes:
      'Generic category for the practitioner’s own dead — not a named culture’s ancestor cult.',
    sources: ['Comparative ancestor-work outlines (study)'],
  },
  {
    id: 'land-spirit',
    name: 'Land spirit',
    kind: 'spirit',
    tradition: 'Three-worlds study',
    keywords: ['place', 'middle', 'boundary', 'host'],
    element: 'Earth',
    notes:
      'Study category for genius loci / place-presence. Ask permission of the actual land; this card is not a being.',
    sources: ['Comparative place-spirit outlines (study)'],
  },
  {
    id: 'sky-teacher',
    name: 'Sky teacher',
    kind: 'spirit',
    tradition: 'Three-worlds study',
    keywords: ['upper', 'teaching', 'vision', 'guide'],
    element: 'Spirit',
    planet: 'Sun',
    notes: 'Generic Upper-World teaching presence for journey structure — not a named deity.',
    sources: ['Comparative three-worlds journey outlines (study)'],
  },
];

export function getAlly(id: string): ShamanicAlly | undefined {
  return ALLIES.find((a) => a.id === id);
}

export function searchAllies(query: string, kind?: AllyKind | null): ShamanicAlly[] {
  const q = query.trim().toLowerCase();
  return ALLIES.filter((a) => {
    if (kind && a.kind !== kind) return false;
    if (!q) return true;
    const hay = [
      a.id,
      a.name,
      a.kind,
      a.tradition,
      a.planet ?? '',
      a.element ?? '',
      a.notes ?? '',
      ...a.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
