/**
 * Curated sutra / dharani presets for ofuda talisman generation.
 * Abbreviated devotional forms for personal talisman craft — not full liturgical texts.
 */

export type SutraPurpose =
  | 'protection'
  | 'warding'
  | 'healing'
  | 'travel'
  | 'general';

export interface SutraPreset {
  id: string;
  title: string;
  titleJp: string;
  purpose: SutraPurpose;
  /** Kanji columns in right-to-left order; each string reads top-to-bottom. */
  columns: string[];
  bonjiIast?: string;
  sealDefault: string;
  notes: string;
}

export const SUTRA_PURPOSE_LABELS: Record<SutraPurpose, string> = {
  protection: 'Protection',
  warding: 'Warding',
  healing: 'Healing',
  travel: 'Travel safety',
  general: 'General devotion',
};

export const SUTRA_PRESETS: SutraPreset[] = [
  {
    id: 'hannya_shingyo',
    title: 'Heart Sutra (core phrase)',
    titleJp: '般若心経',
    purpose: 'warding',
    columns: ['色即是空', '空即是色', '是諸法空相', '不生不滅'],
    bonjiIast: 'gate gate pāragate pārasaṃgate bodhi svāhā',
    sealDefault: '般若',
    notes:
      'Abbreviated Hannya Shingyō core — the emptiness of form. For personal study talismans; not a substitute for temple ofuda.',
  },
  {
    id: 'fudo_dharani',
    title: 'Fudō Myōō dharani',
    titleJp: '不動明王',
    purpose: 'protection',
    columns: ['南無', '三曼多', '莫訶', '南無', '悉利', '誐羅', '耶', '娑婆訶'],
    bonjiIast: 'hum',
    sealDefault: '不動',
    notes:
      'Classic protective dharani associated with Acala (Fudō). Kanji transliteration as used on Japanese temple talismans.',
  },
  {
    id: 'namu_amida',
    title: 'Nembutsu',
    titleJp: '南無阿弥陀仏',
    purpose: 'general',
    columns: ['南無', '阿弥陀', '仏'],
    bonjiIast: 'om amitābha hūm',
    sealDefault: '護符',
    notes:
      'Pure Land invocation for refuge and protection. One of the most common devotional phrases on Japanese ofuda.',
  },
  {
    id: 'yakushi_dharani',
    title: 'Yakushi (Medicine Buddha)',
    titleJp: '薬師如来',
    purpose: 'healing',
    columns: ['南無', '薬師', '瑠璃光', '如来'],
    bonjiIast: 'om bhaiṣajye bhaiṣajye mahābhaiṣajye rāja samudgate svāhā',
    sealDefault: '薬師',
    notes:
      'Abbreviated Yakushi Nyorai invocation for healing and protection from illness. Study outline only.',
  },
  {
    id: 'ksitigarbha',
    title: 'Jizō (Kṣitigarbha)',
    titleJp: '地蔵菩薩',
    purpose: 'protection',
    columns: ['南無', '地蔵', '菩薩', '摩訶薩'],
    bonjiIast: 'om pramardani svāhā',
    sealDefault: '地蔵',
    notes:
      'Jizō Bodhisattva mantra excerpt — guardian of travelers and the vulnerable. Common on roadside and home protection talismans.',
  },
  {
    id: 'kongosho',
    title: 'Diamond Sutra (opening)',
    titleJp: '金剛般若波羅蜜経',
    purpose: 'warding',
    columns: ['如是我聞', '一時', '佛在', '舍衛国'],
    bonjiIast: 'om vajra sattva hūm',
    sealDefault: '金剛',
    notes:
      'Opening lines of the Kongō Hannya Haramitsu Kyō (Diamond Sutra). Abbreviated for talisman format.',
  },
];

export function getSutraPreset(id: string): SutraPreset | undefined {
  return SUTRA_PRESETS.find((p) => p.id === id);
}
