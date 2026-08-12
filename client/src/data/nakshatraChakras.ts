/**
 * Nakshatra ↔ chakra study map — comparative Vedic/tantra bridge only.
 * Lineages disagree; not a claim of clinical or initiatory identity.
 */

import type { ChakraId } from './chakras';
import { getChakra } from './chakras';
import type { NakshatraName } from '../lib/hinduAstrology';
import { NAKSHATRAS } from '../lib/hinduAstrology';

export interface NakshatraChakraMap {
  nakshatra: NakshatraName;
  chakraId: ChakraId;
  source: string;
  notes?: string;
}

/** Cyclical 27→7 study map (4 per chakra except crown with 3). */
export const NAKSHATRA_CHAKRA_MAP: NakshatraChakraMap[] = [
  { nakshatra: 'Ashwini', chakraId: 'muladhara', source: 'Cyclical study map' },
  { nakshatra: 'Bharani', chakraId: 'muladhara', source: 'Cyclical study map' },
  { nakshatra: 'Krittika', chakraId: 'muladhara', source: 'Cyclical study map' },
  { nakshatra: 'Rohini', chakraId: 'muladhara', source: 'Cyclical study map' },
  { nakshatra: 'Mrigashira', chakraId: 'svadhisthana', source: 'Cyclical study map' },
  { nakshatra: 'Ardra', chakraId: 'svadhisthana', source: 'Cyclical study map' },
  { nakshatra: 'Punarvasu', chakraId: 'svadhisthana', source: 'Cyclical study map' },
  { nakshatra: 'Pushya', chakraId: 'svadhisthana', source: 'Cyclical study map' },
  { nakshatra: 'Ashlesha', chakraId: 'manipura', source: 'Cyclical study map' },
  { nakshatra: 'Magha', chakraId: 'manipura', source: 'Cyclical study map' },
  { nakshatra: 'Purva Phalguni', chakraId: 'manipura', source: 'Cyclical study map' },
  { nakshatra: 'Uttara Phalguni', chakraId: 'manipura', source: 'Cyclical study map' },
  { nakshatra: 'Hasta', chakraId: 'anahata', source: 'Cyclical study map' },
  { nakshatra: 'Chitra', chakraId: 'anahata', source: 'Cyclical study map' },
  { nakshatra: 'Swati', chakraId: 'anahata', source: 'Cyclical study map' },
  { nakshatra: 'Vishakha', chakraId: 'anahata', source: 'Cyclical study map' },
  { nakshatra: 'Anuradha', chakraId: 'vishuddha', source: 'Cyclical study map' },
  { nakshatra: 'Jyeshtha', chakraId: 'vishuddha', source: 'Cyclical study map' },
  { nakshatra: 'Mula', chakraId: 'vishuddha', source: 'Cyclical study map' },
  { nakshatra: 'Purva Ashadha', chakraId: 'vishuddha', source: 'Cyclical study map' },
  { nakshatra: 'Uttara Ashadha', chakraId: 'ajna', source: 'Cyclical study map' },
  { nakshatra: 'Shravana', chakraId: 'ajna', source: 'Cyclical study map' },
  { nakshatra: 'Dhanishta', chakraId: 'ajna', source: 'Cyclical study map' },
  { nakshatra: 'Shatabhisha', chakraId: 'ajna', source: 'Cyclical study map' },
  { nakshatra: 'Purva Bhadrapada', chakraId: 'sahasrara', source: 'Cyclical study map' },
  { nakshatra: 'Uttara Bhadrapada', chakraId: 'sahasrara', source: 'Cyclical study map' },
  { nakshatra: 'Revati', chakraId: 'sahasrara', source: 'Cyclical study map' },
];

const BY_NAKSHATRA = new Map(
  NAKSHATRA_CHAKRA_MAP.map((m) => [m.nakshatra, m])
);

export function chakraForNakshatra(
  name: NakshatraName | string
): NakshatraChakraMap | undefined {
  return BY_NAKSHATRA.get(name as NakshatraName);
}

/** Search strings for indexing Liber 777 keys via sephirah chakra bridge. */
export function nakshatraFieldStringsForKey(key: number): string[] {
  const parts: string[] = ['nakshatra', 'lunar mansion'];
  for (const n of NAKSHATRAS) {
    const map = chakraForNakshatra(n);
    if (!map) continue;
    const chakra = getChakra(map.chakraId);
    if (chakra?.sephirahKey === key) {
      parts.push(n, map.chakraId, chakra.name, chakra.sanskrit);
    }
  }
  return parts;
}
