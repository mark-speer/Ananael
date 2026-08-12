/**
 * Primary meridians and Ren/Du extraordinary vessels — conceptual study corpus.
 * Not clinical acupuncture instruction.
 */

import type { TrigramId } from './ichingCorrespondences';

export type YinYang = 'yin' | 'yang';

export interface Meridian {
  id: string;
  name: string;
  chinese: string;
  pinyin: string;
  element: string;
  yinYang: YinYang;
  /** Local hour (0–23) when qi is traditionally said to peak */
  peakHourStart: number;
  peakHourEnd: number;
  associatedOrgan: string;
  notes?: string;
  /** Optional trigram bridge for correspondence study */
  trigramId?: TrigramId;
}

export const MERIDIAN_IDS = [
  'lung',
  'large-intestine',
  'stomach',
  'spleen',
  'heart',
  'small-intestine',
  'bladder',
  'kidney',
  'pericardium',
  'triple-burner',
  'gall-bladder',
  'liver',
  'ren',
  'du',
] as const;

export type MeridianId = (typeof MERIDIAN_IDS)[number];

export const MERIDIANS: Meridian[] = [
  {
    id: 'lung',
    name: 'Lung',
    chinese: '手太阴肺经',
    pinyin: 'Shǒu Tài Yīn Fèi Jīng',
    element: 'Metal',
    yinYang: 'yin',
    peakHourStart: 3,
    peakHourEnd: 5,
    associatedOrgan: 'Lung',
    trigramId: 'dui',
    notes: 'Tai Yin of the hand; governs qi and respiration in classical TCM theory.',
  },
  {
    id: 'large-intestine',
    name: 'Large Intestine',
    chinese: '手阳明大肠经',
    pinyin: 'Shǒu Yáng Míng Dà Cháng Jīng',
    element: 'Metal',
    yinYang: 'yang',
    peakHourStart: 5,
    peakHourEnd: 7,
    associatedOrgan: 'Large Intestine',
    trigramId: 'dui',
  },
  {
    id: 'stomach',
    name: 'Stomach',
    chinese: '足阳明胃经',
    pinyin: 'Zú Yáng Míng Wèi Jīng',
    element: 'Earth',
    yinYang: 'yang',
    peakHourStart: 7,
    peakHourEnd: 9,
    associatedOrgan: 'Stomach',
    trigramId: 'kun',
  },
  {
    id: 'spleen',
    name: 'Spleen',
    chinese: '足太阴脾经',
    pinyin: 'Zú Tài Yīn Pí Jīng',
    element: 'Earth',
    yinYang: 'yin',
    peakHourStart: 9,
    peakHourEnd: 11,
    associatedOrgan: 'Spleen',
    trigramId: 'kun',
  },
  {
    id: 'heart',
    name: 'Heart',
    chinese: '手少阴心经',
    pinyin: 'Shǒu Shǎo Yīn Xīn Jīng',
    element: 'Fire',
    yinYang: 'yin',
    peakHourStart: 11,
    peakHourEnd: 13,
    associatedOrgan: 'Heart',
    trigramId: 'li',
  },
  {
    id: 'small-intestine',
    name: 'Small Intestine',
    chinese: '手太阳小肠经',
    pinyin: 'Shǒu Tài Yáng Xiǎo Cháng Jīng',
    element: 'Fire',
    yinYang: 'yang',
    peakHourStart: 13,
    peakHourEnd: 15,
    associatedOrgan: 'Small Intestine',
    trigramId: 'li',
  },
  {
    id: 'bladder',
    name: 'Bladder',
    chinese: '足太阳膀胱经',
    pinyin: 'Zú Tài Yáng Páng Guāng Jīng',
    element: 'Water',
    yinYang: 'yang',
    peakHourStart: 15,
    peakHourEnd: 17,
    associatedOrgan: 'Bladder',
    trigramId: 'kan',
  },
  {
    id: 'kidney',
    name: 'Kidney',
    chinese: '足少阴肾经',
    pinyin: 'Zú Shǎo Yīn Shèn Jīng',
    element: 'Water',
    yinYang: 'yin',
    peakHourStart: 17,
    peakHourEnd: 19,
    associatedOrgan: 'Kidney',
    trigramId: 'kan',
    notes: 'Storehouse of jing; central to neidan and qigong foundations.',
  },
  {
    id: 'pericardium',
    name: 'Pericardium',
    chinese: '手厥阴心包经',
    pinyin: 'Shǒu Jué Yīn Xīn Bāo Jīng',
    element: 'Fire',
    yinYang: 'yin',
    peakHourStart: 19,
    peakHourEnd: 21,
    associatedOrgan: 'Pericardium',
    trigramId: 'li',
  },
  {
    id: 'triple-burner',
    name: 'Triple Burner',
    chinese: '手少阳三焦经',
    pinyin: 'Shǒu Shǎo Yáng Sān Jiāo Jīng',
    element: 'Fire',
    yinYang: 'yang',
    peakHourStart: 21,
    peakHourEnd: 23,
    associatedOrgan: 'Triple Burner (San Jiao)',
    notes: 'Functional organ in TCM; harmonizes upper, middle, and lower burners.',
  },
  {
    id: 'gall-bladder',
    name: 'Gall Bladder',
    chinese: '足少阳胆经',
    pinyin: 'Zú Shǎo Yáng Dǎn Jīng',
    element: 'Wood',
    yinYang: 'yang',
    peakHourStart: 23,
    peakHourEnd: 1,
    associatedOrgan: 'Gall Bladder',
    trigramId: 'zhen',
  },
  {
    id: 'liver',
    name: 'Liver',
    chinese: '足厥阴肝经',
    pinyin: 'Zú Jué Yīn Gān Jīng',
    element: 'Wood',
    yinYang: 'yin',
    peakHourStart: 1,
    peakHourEnd: 3,
    associatedOrgan: 'Liver',
    trigramId: 'xun',
  },
  {
    id: 'ren',
    name: 'Ren mai (Conception)',
    chinese: '任脉',
    pinyin: 'Rèn Mài',
    element: 'Yin',
    yinYang: 'yin',
    peakHourStart: -1,
    peakHourEnd: -1,
    associatedOrgan: 'Extraordinary vessel',
    notes: 'Front midline vessel; descends in microcosmic orbit practice. No single organ peak hour.',
  },
  {
    id: 'du',
    name: 'Du mai (Governing)',
    chinese: '督脉',
    pinyin: 'Dū Mài',
    element: 'Yang',
    yinYang: 'yang',
    peakHourStart: -1,
    peakHourEnd: -1,
    associatedOrgan: 'Extraordinary vessel',
    notes: 'Spinal governing vessel; ascends in microcosmic orbit. Pairs with Ren mai.',
  },
];

const BY_ID = new Map(MERIDIANS.map((m) => [m.id, m]));

export function getMeridian(id: string): Meridian | undefined {
  return BY_ID.get(id);
}

export function formatPeakHour(m: Meridian): string {
  if (m.peakHourStart < 0) return '—';
  const fmt = (h: number) => {
    const hour = h % 24;
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };
  return `${fmt(m.peakHourStart)} – ${fmt(m.peakHourEnd)}`;
}

export function meridianPeakingAt(hour: number): Meridian[] {
  const h = hour % 24;
  return MERIDIANS.filter(
    (m) =>
      m.peakHourStart >= 0 &&
      ((m.peakHourStart <= m.peakHourEnd &&
        h >= m.peakHourStart &&
        h < m.peakHourEnd) ||
        (m.peakHourStart > m.peakHourEnd &&
          (h >= m.peakHourStart || h < m.peakHourEnd)))
  );
}

export function searchMeridians(query: string): Meridian[] {
  const q = query.trim().toLowerCase();
  if (!q) return MERIDIANS;
  return MERIDIANS.filter((m) => {
    const hay = [
      m.id,
      m.name,
      m.chinese,
      m.pinyin,
      m.element,
      m.associatedOrgan,
      m.notes ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
