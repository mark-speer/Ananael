/**
 * I Ching ↔ Liber 777 bridge via the eight trigrams.
 *
 * Sephirotic trigrams follow Crowley’s Book of Thoth attributions
 * (Yang/Yin for Chokmah/Binah; Dui–Kun for Chesed–Malkuth). Elemental
 * paths (Aleph, Mem, Shin, Tav) carry the classical trigram–element pairs.
 * Hexagrams attach to a key when their upper or lower trigram maps there.
 */

import { getHexagram, KING_WEN_BY_BINARY, type HexagramText } from './iching';
import {
  getChakraForSephirah,
  getMeridianForTrigram,
} from './subtleBodyMaps';

export const TRIGRAM_IDS = [
  'qian',
  'kun',
  'zhen',
  'kan',
  'gen',
  'xun',
  'li',
  'dui',
] as const;

export type TrigramId = (typeof TRIGRAM_IDS)[number];

export interface Trigram {
  id: TrigramId;
  /** English nature name (Heaven, Earth, …). */
  name: string;
  chinese: string;
  /** 3-bit pattern; LSB = bottom line; 1 = yang. */
  binary: number;
}

export const TRIGRAMS: Record<TrigramId, Trigram> = {
  qian: { id: 'qian', name: 'Heaven', chinese: '乾 Qián', binary: 0b111 },
  kun: { id: 'kun', name: 'Earth', chinese: '坤 Kūn', binary: 0b000 },
  zhen: { id: 'zhen', name: 'Thunder', chinese: '震 Zhèn', binary: 0b001 },
  kan: { id: 'kan', name: 'Water', chinese: '坎 Kǎn', binary: 0b010 },
  gen: { id: 'gen', name: 'Mountain', chinese: '艮 Gèn', binary: 0b100 },
  xun: { id: 'xun', name: 'Wind', chinese: '巽 Xùn', binary: 0b110 },
  li: { id: 'li', name: 'Fire', chinese: '離 Lí', binary: 0b101 },
  dui: { id: 'dui', name: 'Lake', chinese: '兌 Duì', binary: 0b011 },
};

const BY_BINARY = new Map(
  TRIGRAM_IDS.map((id) => [TRIGRAMS[id].binary, TRIGRAMS[id]]),
);

/** Liber 777 keys that carry each trigram (Crowley Thoth + elemental paths). */
export const TRIGRAM_KEY_MAP: Record<TrigramId, readonly number[]> = {
  // Chokmah = Yang; Aleph/Air as open heaven
  qian: [2, 11],
  // Binah = Yin; Malkuth & Tav = Earth
  kun: [3, 10, 32],
  // Geburah; Shin/Fire (arousing)
  zhen: [5, 31],
  // Yesod; Mem/Water
  kan: [9, 23],
  // Netzach (Kên); Tav/Earth
  gen: [7, 32],
  // Hod (Sun/Xun); Aleph/Air
  xun: [8, 11],
  // Tiphareth (Li); Shin/Fire
  li: [6, 31],
  // Chesed (Tui); Mem/Water
  dui: [4, 23],
};

export interface HexagramStructure {
  number: number;
  lower: Trigram;
  upper: Trigram;
}

function trigramFromBinary(bits: number): Trigram {
  const t = BY_BINARY.get(bits & 0b111);
  if (!t) throw new Error(`Unknown trigram bits ${bits}`);
  return t;
}

/** All 64 hexagrams with upper/lower trigrams (King Wen numbers). */
export const HEXAGRAM_STRUCTURES: HexagramStructure[] = Array.from(
  { length: 64 },
  (_, binary) => {
    const lower = trigramFromBinary(binary & 0b111);
    const upper = trigramFromBinary((binary >> 3) & 0b111);
    return {
      number: KING_WEN_BY_BINARY[binary],
      lower,
      upper,
    };
  },
);

const STRUCTURE_BY_NUMBER = new Map(
  HEXAGRAM_STRUCTURES.map((s) => [s.number, s]),
);

const KEY_TO_TRIGRAMS = new Map<number, TrigramId[]>();
for (const id of TRIGRAM_IDS) {
  for (const key of TRIGRAM_KEY_MAP[id]) {
    const list = KEY_TO_TRIGRAMS.get(key) ?? [];
    if (!list.includes(id)) list.push(id);
    KEY_TO_TRIGRAMS.set(key, list);
  }
}

const KEY_TO_HEXAGRAMS = new Map<number, number[]>();
for (const [key, trigramIds] of KEY_TO_TRIGRAMS) {
  const set = new Set<number>();
  for (const s of HEXAGRAM_STRUCTURES) {
    if (
      trigramIds.includes(s.lower.id) ||
      trigramIds.includes(s.upper.id)
    ) {
      set.add(s.number);
    }
  }
  KEY_TO_HEXAGRAMS.set(
    key,
    [...set].sort((a, b) => a - b),
  );
}

export function getTrigramsForKey(key: number): Trigram[] {
  return (KEY_TO_TRIGRAMS.get(key) ?? []).map((id) => TRIGRAMS[id]);
}

export function getHexagramNumbersForKey(key: number): number[] {
  return KEY_TO_HEXAGRAMS.get(key) ?? [];
}

export function getHexagramsForKey(key: number): HexagramText[] {
  return getHexagramNumbersForKey(key)
    .map((n) => getHexagram(n))
    .filter((h): h is HexagramText => Boolean(h));
}

export function getHexagramStructure(
  number: number,
): HexagramStructure | undefined {
  return STRUCTURE_BY_NUMBER.get(number);
}

/** Keys that share a trigram with this King Wen hexagram. */
export function getKeysForHexagram(number: number): number[] {
  const s = STRUCTURE_BY_NUMBER.get(number);
  if (!s) return [];
  const keys = new Set<number>([
    ...TRIGRAM_KEY_MAP[s.lower.id],
    ...TRIGRAM_KEY_MAP[s.upper.id],
  ]);
  return [...keys].sort((a, b) => a - b);
}

/** Search strings for indexing a Liber 777 key’s I Ching bridge. */
export function ichingFieldStringsForKey(key: number): string[] {
  const parts: string[] = ['i ching', 'iching', 'hexagram', 'trigram'];
  for (const t of getTrigramsForKey(key)) {
    parts.push(t.id, t.name, t.chinese);
  }
  for (const h of getHexagramsForKey(key)) {
    parts.push(
      String(h.number),
      h.name,
      h.name.replace(/^The\s+/i, ''),
      h.chinese,
    );
  }
  return parts;
}

/** Searchable subtle-body strings for Liber 777 keys (trigram ↔ meridian bridges). */
export function subtleBodyFieldStringsForKey(key: number): string[] {
  const parts: string[] = [];
  const trigrams = getTrigramsForKey(key);
  for (const t of trigrams) {
    const meridians = getMeridianForTrigram(t.id);
    for (const m of meridians) {
      parts.push(m.name, m.pinyin, m.chinese, m.element, m.associatedOrgan);
    }
  }
  const chakra = getChakraForSephirah(key);
  if (chakra) {
    parts.push(chakra.name, chakra.sanskrit, chakra.id, chakra.bija ?? '');
  }
  return parts;
}
