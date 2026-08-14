/**
 * Three-worlds study map (axis mundi). Comparative links are study-only —
 * not identity claims, and not a substitute for lineage instruction.
 */

export const WORLD_IDS = ['lower', 'middle', 'upper'] as const;
export type WorldId = (typeof WORLD_IDS)[number];

export interface ShamanicWorld {
  id: WorldId;
  name: string;
  keywords: string[];
  typicalWork: string;
  notes?: string;
  sources?: string[];
  /** Comparative Liber 777 key — study map only */
  sephirahKey?: number;
  sephirahName?: string;
  relatedChakras?: string[];
  relatedDantians?: string[];
}

export const WORLDS: ShamanicWorld[] = [
  {
    id: 'lower',
    name: 'Lower World',
    keywords: ['roots', 'ancestors', 'animals', 'earth', 'retrieval'],
    typicalWork:
      'Descent along the axis for ancestral counsel, animal allies, and what lies beneath daily awareness.',
    sephirahKey: 10,
    sephirahName: 'Malkuth',
    relatedChakras: ['muladhara', 'svadhisthana'],
    relatedDantians: ['lower'],
    notes:
      'Study parallel to earth/root centers. Not underworld tourism and not a clinical soul-retrieval protocol.',
    sources: [
      'Comparative three-worlds / axis mundi summaries in history-of-religions literature (study map)',
    ],
  },
  {
    id: 'middle',
    name: 'Middle World',
    keywords: ['here', 'land', 'community', 'healing', 'daily'],
    typicalWork:
      'Work in the present landscape — relationships, place-spirits as study category, and the body of this life.',
    sephirahKey: 6,
    sephirahName: 'Tiphareth',
    relatedChakras: ['anahata', 'manipura'],
    relatedDantians: ['middle'],
    notes:
      'The ordinary world made luminous. Comparative heart/solar center only.',
    sources: [
      'Comparative three-worlds / axis mundi summaries (study map)',
    ],
  },
  {
    id: 'upper',
    name: 'Upper World',
    keywords: ['sky', 'teachers', 'vision', 'stars', 'ascent'],
    typicalWork:
      'Ascent for teaching images, sky-counsel, and wide perspective — then a deliberate return.',
    sephirahKey: 1,
    sephirahName: 'Kether',
    relatedChakras: ['ajna', 'sahasrara'],
    relatedDantians: ['upper'],
    notes:
      'Study parallel to crown/heaven. Not a claim that Kether is the Upper World.',
    sources: [
      'Comparative three-worlds / axis mundi summaries (study map)',
    ],
  },
];

export function getWorld(id: string): ShamanicWorld | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function getWorldForSephirah(key: number): ShamanicWorld | undefined {
  return WORLDS.find((w) => w.sephirahKey === key);
}

export function searchWorlds(query: string): ShamanicWorld[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...WORLDS];
  return WORLDS.filter((w) => {
    const hay = [
      w.id,
      w.name,
      w.typicalWork,
      w.notes ?? '',
      w.sephirahName ?? '',
      ...w.keywords,
      ...(w.relatedChakras ?? []),
      ...(w.relatedDantians ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
