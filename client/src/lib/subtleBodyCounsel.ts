/**
 * Eastern subtle-body counsel, natal affinity, and contextual rite suggestions.
 */

import { chakraForNakshatra } from '../data/nakshatraChakras';
import { getChakra } from '../data/chakras';
import { meridianPeakingAt, type Meridian } from '../data/meridians';
import {
  dayPillar,
  type ChineseElement,
} from './chineseAstrology';
import type { MoonPhaseName } from './moonPhase';
export interface SubtleBodyNatalContext {
  isFullNatal?: boolean;
  natalMoonSign?: string;
  natalMoonNakshatra?: string;
}

const YIN_MOONS: MoonPhaseName[] = ['Waning Crescent', 'New Moon', 'Last Quarter'];

const ELEMENT_MERIDIAN_HINT: Record<
  ChineseElement,
  { meridians: string[]; hint: string }
> = {
  Wood: {
    meridians: ['liver', 'gall-bladder'],
    hint: 'Wood day — liver/gall bladder meridian qigong or sinew work.',
  },
  Fire: {
    meridians: ['heart', 'small-intestine'],
    hint: 'Fire day — heart/small intestine centering or inner smile.',
  },
  Earth: {
    meridians: ['spleen', 'stomach'],
    hint: 'Earth day — spleen/stomach grounding and Ba Duan Jin–style movement.',
  },
  Metal: {
    meridians: ['lung', 'large-intestine'],
    hint: 'Metal day — lung/large intestine breath and pranayama.',
  },
  Water: {
    meridians: ['kidney', 'bladder'],
    hint: 'Water day — kidney/bladder stillness, Zhan Zhuang, or orbit work.',
  },
};

export interface EasternRiteSuggestion {
  riteId: string;
  label: string;
  reason: string;
}

function meridianToRite(meridian: Meridian): EasternRiteSuggestion {
  switch (meridian.id) {
    case 'kidney':
    case 'bladder':
      return {
        riteId: 'zhan-zhuang',
        label: 'Zhan Zhuang',
        reason: `${meridian.name} meridian peak`,
      };
    case 'liver':
    case 'gall-bladder':
      return {
        riteId: 'ba-duan-jin',
        label: 'Eight Brocades',
        reason: `${meridian.name} meridian peak`,
      };
    case 'heart':
    case 'small-intestine':
    case 'pericardium':
      return {
        riteId: 'inner-smile',
        label: 'Inner Smile',
        reason: `${meridian.name} meridian peak`,
      };
    case 'ren':
    case 'du':
      return {
        riteId: 'microcosmic-orbit',
        label: 'Microcosmic Orbit',
        reason: 'Ren/Du vessel work',
      };
    default:
      return {
        riteId: 'ba-duan-jin',
        label: 'Eight Brocades',
        reason: `${meridian.name} meridian peak`,
      };
  }
}

export function buildSubtleBodyCounsel(
  when: Date,
  moonName: MoonPhaseName,
  nakshatra?: string
): string {
  const peaking = meridianPeakingAt(when.getHours());
  const parts: string[] = [];

  if (peaking.length) {
    parts.push(
      `${peaking.map((m) => m.name).join(' / ')} meridian peak — consider qigong, breath, or meridian-aware stillness.`
    );
  }

  if (nakshatra) {
    const map = chakraForNakshatra(nakshatra);
    const chakra = map ? getChakra(map.chakraId) : undefined;
    if (chakra) {
      parts.push(
        `Moon in ${nakshatra} — comparative ${chakra.name} (${chakra.sanskrit}) focus in study maps.`
      );
    }
  }

  const pillar = dayPillar(when);
  const elementHint = ELEMENT_MERIDIAN_HINT[pillar.element];
  if (elementHint) {
    parts.push(elementHint.hint);
  }

  if (YIN_MOONS.includes(moonName)) {
    parts.push('Ren/Du inward work and standing meditation suit yin-phase moons.');
  }
  if (moonName === 'Full Moon' || moonName === 'Waxing Gibbous') {
    parts.push('Chakra circulation and heart-center work resonate with luminous moons.');
  }

  return parts.join(' ');
}

export function buildNatalSubtleBodyAffinity(
  natal?: SubtleBodyNatalContext | null
): string | undefined {
  if (!natal?.isFullNatal) return undefined;
  const hits: string[] = [];

  if (natal.natalMoonNakshatra) {
    const map = chakraForNakshatra(natal.natalMoonNakshatra);
    const chakra = map ? getChakra(map.chakraId) : undefined;
    if (chakra) {
      hits.push(
        `natal Moon in ${natal.natalMoonNakshatra} ↔ ${chakra.name} resonance`
      );
    }
  }
  if (natal.natalMoonSign) {
    hits.push(`natal Moon in ${natal.natalMoonSign} — lunar subtle-body themes`);
  }

  return hits.length ? hits.join(' · ') : undefined;
}

/** Pick one contextual Eastern rite for Magical OS / counsel CTAs. */
export function suggestEasternRite(
  when: Date,
  moonName: MoonPhaseName,
  nakshatra?: string
): EasternRiteSuggestion {
  const peaking = meridianPeakingAt(when.getHours());
  if (peaking.length) {
    return meridianToRite(peaking[0]);
  }

  if (nakshatra) {
    const map = chakraForNakshatra(nakshatra);
    if (map) {
      return {
        riteId: 'chakra-circulation',
        label: 'Seven-Center Breath',
        reason: `Moon in ${nakshatra}`,
      };
    }
  }

  if (YIN_MOONS.includes(moonName)) {
    return {
      riteId: 'zhan-zhuang',
      label: 'Zhan Zhuang',
      reason: `${moonName} yin-phase moon`,
    };
  }

  if (moonName === 'Full Moon' || moonName === 'Waxing Gibbous') {
    return {
      riteId: 'chakra-circulation',
      label: 'Seven-Center Breath',
      reason: `${moonName} luminous moon`,
    };
  }

  const pillar = dayPillar(when);
  const elementHint = ELEMENT_MERIDIAN_HINT[pillar.element];
  if (elementHint) {
    const id =
      pillar.element === 'Water'
        ? 'zhan-zhuang'
        : pillar.element === 'Fire'
          ? 'inner-smile'
          : 'ba-duan-jin';
    const label =
      id === 'zhan-zhuang'
        ? 'Zhan Zhuang'
        : id === 'inner-smile'
          ? 'Inner Smile'
          : 'Eight Brocades';
    return {
      riteId: id,
      label,
      reason: `${pillar.element} day pillar`,
    };
  }

  return {
    riteId: 'nadi-shodhana',
    label: 'Alternate Nostril',
    reason: 'daily balance',
  };
}

export function isYinMoonPhase(phase: MoonPhaseName): boolean {
  return YIN_MOONS.includes(phase);
}
