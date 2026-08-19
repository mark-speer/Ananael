/**
 * Hasta and Buddhist iconographic mudras — study corpus for subtle-body work.
 * Traditions disagree on names and uses; not clinical or photographic instruction.
 */

import type { ChakraId } from './chakras';

export const MUDRA_TRADITIONS = ['yoga', 'buddhist', 'shared'] as const;
export type MudraTradition = (typeof MUDRA_TRADITIONS)[number];

export const MUDRA_HANDS = ['right', 'left', 'both'] as const;
export type MudraHands = (typeof MUDRA_HANDS)[number];

export const MUDRA_TRADITION_LABELS: Record<MudraTradition, string> = {
  yoga: 'Yoga',
  buddhist: 'Buddhist',
  shared: 'Shared',
};

export const MUDRA_HANDS_LABELS: Record<MudraHands, string> = {
  right: 'Right',
  left: 'Left',
  both: 'Both',
};

export interface Mudra {
  id: string;
  name: string;
  sanskrit: string;
  tradition: MudraTradition;
  hands: MudraHands;
  /** One-line study gloss of the seal — not a how-to sequence. */
  formation: string;
  keywords: string[];
  notes?: string;
  relatedChakraIds?: ChakraId[];
  alsoKnownAs?: string[];
}

export const MUDRA_IDS = [
  'gyan',
  'chin',
  'anjali',
  'vishnu',
  'dhyana',
  'prana',
  'apana',
  'apana-vayu',
  'yoni',
  'linga',
  'shuni',
  'surya',
  'buddhi',
  'prithvi',
  'varun',
  'vayu',
  'hakini',
  'adi',
  'abhaya',
  'bhumisparsha',
  'dharmachakra',
  'varada',
  'vitarka',
  'uttarabodhi',
  'karana',
] as const;

export type MudraId = (typeof MUDRA_IDS)[number];

export const MUDRAS: Mudra[] = [
  {
    id: 'gyan',
    name: 'Gyan',
    sanskrit: 'Jñāna mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tip of the index finger meets the thumb; remaining fingers extend. Often shown with palms up on the knees.',
    keywords: ['knowledge', 'meditation', 'witness'],
    relatedChakraIds: ['ajna'],
    alsoKnownAs: ['Jnana'],
    notes:
      'Classic hatha “seal of knowledge.” Closely related to Chin mudra; lineages differ on palm orientation and whether the two names are distinct.',
  },
  {
    id: 'chin',
    name: 'Chin',
    sanskrit: 'Cin mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Index and thumb join as in Gyan; palms often face down toward the thighs in seated meditation.',
    keywords: ['consciousness', 'seat', 'meditation'],
    relatedChakraIds: ['ajna', 'sahasrara'],
    notes:
      'Study maps sometimes treat Chin and Gyan as one mudra with two palm aspects. Traditions vary; not a claim of a single canonical form.',
  },
  {
    id: 'anjali',
    name: 'Anjali',
    sanskrit: 'Añjali mudrā',
    tradition: 'shared',
    hands: 'both',
    formation:
      'Palms joined at the heart (or raised), fingers pointing upward — the greeting and offering seal.',
    keywords: ['greeting', 'offering', 'heart', 'namaskara'],
    relatedChakraIds: ['anahata'],
    alsoKnownAs: ['Namaskara', 'Prayer seal'],
    notes:
      'Shared across yoga, Hindu puja, and Buddhist iconography. In Buddhist art it may appear as a distinct namaskara gesture of homage.',
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    sanskrit: 'Viṣṇu mudrā',
    tradition: 'yoga',
    hands: 'right',
    formation:
      'Index and middle fingers folded toward the palm; thumb, ring, and little remain free for nostril work.',
    keywords: ['pranayama', 'nadi', 'balance'],
    relatedChakraIds: ['ajna', 'anahata'],
    alsoKnownAs: ['Nasagra'],
    notes:
      'Named in alternate-nostril (nadi-shodhana) outlines. Exact finger assignment is taught; this is a study label, not a substitute for instruction.',
  },
  {
    id: 'dhyana',
    name: 'Dhyana',
    sanskrit: 'Dhyāna mudrā',
    tradition: 'shared',
    hands: 'both',
    formation:
      'Hands rest in the lap, one atop the other, thumbs lightly touching to form an oval — the meditation seal.',
    keywords: ['meditation', 'samadhi', 'stillness'],
    relatedChakraIds: ['ajna', 'sahasrara'],
    alsoKnownAs: ['Samadhi mudra'],
    notes:
      'Yoga and Buddhist sculpture share this lap seal. Which hand rests above, and whether the thumbs meet, varies by school and period.',
  },
  {
    id: 'prana',
    name: 'Prana',
    sanskrit: 'Prāṇa mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tips of ring and little fingers meet the thumb; index and middle remain extended.',
    keywords: ['vitality', 'prana', 'activation'],
    relatedChakraIds: ['manipura', 'anahata'],
    notes:
      'Modern hatha lists often pair this with vitality and the solar plexus. Historical sources for the name and use are mixed; treat as a living yoga map, not a Vedic identity claim.',
  },
  {
    id: 'apana',
    name: 'Apana',
    sanskrit: 'Apāna mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tips of middle and ring fingers meet the thumb; index and little extend.',
    keywords: ['downward current', 'elimination', 'grounding'],
    relatedChakraIds: ['muladhara', 'svadhisthana'],
    notes:
      'Associated in contemporary yoga with the downward apana vayu. Comparative only — not a medical claim.',
  },
  {
    id: 'apana-vayu',
    name: 'Apana Vayu',
    sanskrit: 'Apāna vāyu mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Index folded to the thumb-base; tips of middle and ring meet the thumb; little extends — a heart-region seal in many modern lists.',
    keywords: ['heart', 'vayu', 'center'],
    relatedChakraIds: ['anahata'],
    alsoKnownAs: ['Hridaya'],
    notes:
      'Sometimes distinguished from Apana mudra and from Hridaya mudra. Names overlap in popular manuals; this corpus keeps a separate id for study.',
  },
  {
    id: 'yoni',
    name: 'Yoni',
    sanskrit: 'Yoni mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Hands join before the lower abdomen or pelvis, thumbs and index fingers shaping a vesica or triangle — the womb/source seal.',
    keywords: ['source', 'shakti', 'containment'],
    relatedChakraIds: ['svadhisthana', 'muladhara'],
    notes:
      'Tantric and hatha uses differ (inner-sense closing vs. hand-shape). This entry is the joined-hands study form, not the full shanmukhi practice.',
  },
  {
    id: 'linga',
    name: 'Linga',
    sanskrit: 'Liṅga mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Interlaced fingers with one thumb raised, the other wrapping — a fire-and-axis seal in popular hatha lists.',
    keywords: ['fire', 'axis', 'heat'],
    relatedChakraIds: ['manipura'],
    notes:
      'Modern yoga associates this with inner heat. Lineages disagree on which thumb stands; study map only.',
  },
  {
    id: 'shuni',
    name: 'Shuni',
    sanskrit: 'Śuni mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tip of the middle finger meets the thumb; remaining fingers extend.',
    keywords: ['patience', 'discipline', 'Saturn'],
    relatedChakraIds: ['ajna'],
    notes:
      'Contemporary hasta lists often map the middle finger to Saturn / discernment. Planetary pairing is a modern correspondence, not a classical identity.',
  },
  {
    id: 'surya',
    name: 'Surya',
    sanskrit: 'Sūrya mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Ring finger folded to the thumb-base, thumb pressing it; other fingers extend — a solar/heat seal in modern lists.',
    keywords: ['sun', 'heat', 'metabolism'],
    relatedChakraIds: ['manipura'],
    alsoKnownAs: ['Agni mudra'],
    notes:
      'Sometimes conflated with Agni mudra. Not a dietary or clinical prescription.',
  },
  {
    id: 'buddhi',
    name: 'Buddhi',
    sanskrit: 'Buddhi mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tip of the little finger meets the thumb; remaining fingers extend.',
    keywords: ['clarity', 'communication', 'water'],
    relatedChakraIds: ['vishuddha'],
    notes:
      'Modern hasta maps often give the little finger to water / intuition. Names and finger-planet charts vary by teacher.',
  },
  {
    id: 'prithvi',
    name: 'Prithvi',
    sanskrit: 'Pṛthvī mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tip of the ring finger meets the thumb; remaining fingers extend — earth seal in elemental hasta lists.',
    keywords: ['earth', 'stability', 'body'],
    relatedChakraIds: ['muladhara'],
    notes:
      'Elemental hasta sets (earth, water, fire, air) are a popular modern grouping, not a single ancient canon.',
  },
  {
    id: 'varun',
    name: 'Varun',
    sanskrit: 'Varuṇa mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Tip of the little finger meets the thumb (as in Buddhi); named for water / Varuna in elemental lists.',
    keywords: ['water', 'fluidity', 'Varuna'],
    relatedChakraIds: ['svadhisthana'],
    alsoKnownAs: ['Jal mudra'],
    notes:
      'Overlaps Buddhi mudra in hand-shape; this corpus keeps both names because yoga manuals treat them as distinct study entries.',
  },
  {
    id: 'vayu',
    name: 'Vayu',
    sanskrit: 'Vāyu mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Index finger folded to the thumb-base, thumb pressing it; other fingers extend — air seal.',
    keywords: ['air', 'wind', 'movement'],
    relatedChakraIds: ['anahata', 'vishuddha'],
    notes:
      'Elemental hasta grouping. Comparative only; not a treatment protocol.',
  },
  {
    id: 'hakini',
    name: 'Hakini',
    sanskrit: 'Hākinī mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Fingertips of both hands meet before the brow or heart, palms apart — a concentration seal in modern tantra-yoga lists.',
    keywords: ['focus', 'memory', 'ajna'],
    relatedChakraIds: ['ajna'],
    notes:
      'Named for the shakti of Ajna in some tantric lists. Popular brain-integration claims are modern; this is a study label.',
  },
  {
    id: 'adi',
    name: 'Adi',
    sanskrit: 'Ādi mudrā',
    tradition: 'yoga',
    hands: 'both',
    formation:
      'Thumb tucked into a soft fist, hands resting — a first or primal seal in some kundalini/hatha sequences.',
    keywords: ['primal', 'breath', 'containment'],
    relatedChakraIds: ['muladhara', 'vishuddha'],
    notes:
      'Used in some kriya and kundalini curricula as a beginning hand-shape. Lineages disagree on thumb placement and laterality.',
  },
  {
    id: 'abhaya',
    name: 'Abhaya',
    sanskrit: 'Abhaya mudrā',
    tradition: 'buddhist',
    hands: 'right',
    formation:
      'Right hand raised, palm outward, fingers together — the fearlessness / protection seal of Buddhist (and Hindu) iconography.',
    keywords: ['fearlessness', 'protection', 'blessing'],
    relatedChakraIds: ['anahata'],
    notes:
      'Standard Buddha image: standing or seated, right palm facing the viewer. Also appears in Hindu deity sculpture. Study of depicted seals, not a ritual how-to.',
  },
  {
    id: 'bhumisparsha',
    name: 'Bhumisparsha',
    sanskrit: 'Bhūmisparśa mudrā',
    tradition: 'buddhist',
    hands: 'right',
    formation:
      'Right hand reaches toward the earth over the right knee; left often rests in the lap — calling the earth to witness.',
    keywords: ['witness', 'awakening', 'earth', 'Mara'],
    relatedChakraIds: ['muladhara', 'ajna'],
    alsoKnownAs: ['Earth-touching'],
    notes:
      'The enlightenment scene: Śākyamuni at Bodh Gaya. Left-hand lap position is commonly dhyana. Iconographic reading, not a meditation prescription.',
  },
  {
    id: 'dharmachakra',
    name: 'Dharmachakra',
    sanskrit: 'Dharmacakra mudrā',
    tradition: 'buddhist',
    hands: 'both',
    formation:
      'Both hands at the heart, thumb and index of each forming wheels that nearly meet — turning the wheel of Dharma.',
    keywords: ['teaching', 'wheel', 'Sarnath'],
    relatedChakraIds: ['anahata', 'vishuddha'],
    alsoKnownAs: ['Wheel-turning'],
    notes:
      'Associated with the first sermon at Sarnath. Finger arrangements vary across regional sculpture. Comparative iconography only.',
  },
  {
    id: 'varada',
    name: 'Varada',
    sanskrit: 'Varada mudrā',
    tradition: 'buddhist',
    hands: 'left',
    formation:
      'Hand lowered, palm outward, fingers down or slightly open — the gift-bestowing / boon seal.',
    keywords: ['generosity', 'boon', 'compassion'],
    relatedChakraIds: ['anahata', 'svadhisthana'],
    notes:
      'Common on standing Buddhas and bodhisattvas; left or right depending on school. Hindu deities use the same name. Study map of depicted charity, not a vow formula.',
  },
  {
    id: 'vitarka',
    name: 'Vitarka',
    sanskrit: 'Vitarka mudrā',
    tradition: 'buddhist',
    hands: 'right',
    formation:
      'Raised hand, thumb and index joined in a circle, other fingers extended — the discussion / reasoning seal.',
    keywords: ['teaching', 'reasoning', 'discourse'],
    relatedChakraIds: ['vishuddha', 'ajna'],
    notes:
      'Related to, but not identical with, Dharmachakra (which uses both hands). Also compared to yoga Gyan; this corpus keeps Buddhist vitarka as a separate iconographic id.',
  },
  {
    id: 'uttarabodhi',
    name: 'Uttarabodhi',
    sanskrit: 'Uttarabodhi mudrā',
    tradition: 'buddhist',
    hands: 'both',
    formation:
      'Hands before the chest or above the head, index fingers joined and pointing up, other fingers interlaced — supreme enlightenment seal.',
    keywords: ['enlightenment', 'ascent', 'unity'],
    relatedChakraIds: ['sahasrara'],
    notes:
      'Less common than abhaya or dhyana in East Asian sets; appears in some Vajrayana and later iconographic manuals. Forms vary.',
  },
  {
    id: 'karana',
    name: 'Karana',
    sanskrit: 'Karaṇa mudrā',
    tradition: 'buddhist',
    hands: 'right',
    formation:
      'Hand raised; index and little extended, middle and ring folded (or held by the thumb) — the warding / apotropaic seal.',
    keywords: ['warding', 'obstacle', 'protection'],
    relatedChakraIds: ['manipura', 'ajna'],
    notes:
      'Seen on wrathful and protective figures; a related hasta appears in Hindu dance (karana as a different technical term). This id is the Buddhist iconographic warding gesture.',
  },
];

const BY_ID = new Map(MUDRAS.map((m) => [m.id, m]));

export function getMudra(id: string): Mudra | undefined {
  return BY_ID.get(id);
}

export function searchMudras(query: string): Mudra[] {
  const q = query.trim().toLowerCase();
  if (!q) return MUDRAS;
  return MUDRAS.filter((m) => {
    const hay = [
      m.id,
      m.name,
      m.sanskrit,
      m.tradition,
      m.hands,
      m.formation,
      m.notes ?? '',
      ...(m.keywords),
      ...(m.alsoKnownAs ?? []),
      ...(m.relatedChakraIds ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
