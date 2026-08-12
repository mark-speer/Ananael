/**
 * Seven traditional chakras — study corpus for subtle-body work.
 * Comparative sephirah links are study maps only, not identity claims.
 */

import type { PlanetId } from '../lib/planetaryHours';

export interface Chakra {
  id: string;
  name: string;
  sanskrit: string;
  location: string;
  element?: string;
  color: string;
  bija?: string;
  deity?: string;
  notes?: string;
  /** Comparative Liber 777 key — study map only */
  sephirahKey?: number;
  planet?: PlanetId;
}

export const CHAKRA_IDS = [
  'muladhara',
  'svadhisthana',
  'manipura',
  'anahata',
  'vishuddha',
  'ajna',
  'sahasrara',
] as const;

export type ChakraId = (typeof CHAKRA_IDS)[number];

export const CHAKRAS: Chakra[] = [
  {
    id: 'muladhara',
    name: 'Root',
    sanskrit: 'Mūlādhāra',
    location: 'Base of spine / perineum',
    element: 'Earth',
    color: 'Red',
    bija: 'LAM',
    deity: 'Ganesha / Dakini (traditions vary)',
    sephirahKey: 10,
    planet: 'Saturn',
    notes: 'Foundation, stability, survival. Often paired with Malkuth in comparative qabalah–tantra maps.',
  },
  {
    id: 'svadhisthana',
    name: 'Sacral',
    sanskrit: 'Svādhiṣṭhāna',
    location: 'Lower abdomen / sacrum',
    element: 'Water',
    color: 'Orange',
    bija: 'VAM',
    sephirahKey: 9,
    planet: 'Moon',
    notes: 'Fluidity, creativity, pleasure. Commonly mapped to Yesod in Western comparative charts.',
  },
  {
    id: 'manipura',
    name: 'Solar plexus',
    sanskrit: 'Maṇipūra',
    location: 'Navel / solar plexus',
    element: 'Fire',
    color: 'Yellow / gold',
    bija: 'RAM',
    sephirahKey: 7,
    planet: 'Mars',
    notes: 'Will, digestion, personal power. Some lineages map to Netzach or Hod; this corpus uses Netzach.',
  },
  {
    id: 'anahata',
    name: 'Heart',
    sanskrit: 'Anāhata',
    location: 'Center of chest',
    element: 'Air',
    color: 'Green / rose',
    bija: 'YAM',
    sephirahKey: 6,
    planet: 'Sun',
    notes: 'Compassion, balance, devotion. Widely mapped to Tiphareth.',
  },
  {
    id: 'vishuddha',
    name: 'Throat',
    sanskrit: 'Viśuddha',
    location: 'Throat center',
    element: 'Ether / Akasha',
    color: 'Sky blue',
    bija: 'HAM',
    sephirahKey: 5,
    planet: 'Mercury',
    notes: 'Expression, truth, sound. Comparative maps vary (Geburah, Chesed, or Daath); Geburah used here.',
  },
  {
    id: 'ajna',
    name: 'Brow',
    sanskrit: 'Ājñā',
    location: 'Between the eyebrows',
    element: 'Mind / light',
    color: 'Indigo',
    bija: 'OM / AUM',
    sephirahKey: 3,
    planet: 'Jupiter',
    notes: 'Intuition, command, inner sight. Often mapped to Binah or Ajna–Daath dyads.',
  },
  {
    id: 'sahasrara',
    name: 'Crown',
    sanskrit: 'Sahasrāra',
    location: 'Crown / above head',
    color: 'Violet / white',
    bija: 'Silence / OM',
    sephirahKey: 1,
    planet: 'Saturn',
    notes: 'Unity, transcendence. Mapped to Kether in most comparative Western tantra charts.',
  },
];

const BY_ID = new Map(CHAKRAS.map((c) => [c.id, c]));

export function getChakra(id: string): Chakra | undefined {
  return BY_ID.get(id);
}

export function searchChakras(query: string): Chakra[] {
  const q = query.trim().toLowerCase();
  if (!q) return CHAKRAS;
  return CHAKRAS.filter((c) => {
    const hay = [
      c.id,
      c.name,
      c.sanskrit,
      c.location,
      c.element ?? '',
      c.color,
      c.bija ?? '',
      c.deity ?? '',
      c.notes ?? '',
      c.planet ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
