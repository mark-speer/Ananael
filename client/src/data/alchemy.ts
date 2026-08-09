/**
 * Hermetic alchemy corpus — metals, Tria Prima, opus stages, axioms, emblems.
 * Study outlines only; not laboratory instruction.
 */

import type { AlchemicalGlyphId } from '../lib/alchemicalGlyphPaths';
import type { PlanetId } from '../lib/planetaryHours';

export type ClassicalMetal =
  | 'Gold'
  | 'Silver'
  | 'Iron'
  | 'Mercury'
  | 'Tin'
  | 'Copper'
  | 'Lead';

export type PrincipleId = 'salt' | 'sulfur' | 'mercury';

export type OpusStageId = 'nigredo' | 'albedo' | 'citrinitas' | 'rubedo';

export interface PrincipleDef {
  id: PrincipleId;
  name: string;
  latin: string;
  gloss: string;
  glyphId: AlchemicalGlyphId;
  /** Body / soul / spirit framing. */
  aspect: string;
}

export interface OpusStageDef {
  id: OpusStageId;
  name: string;
  colorOfWork: string;
  keywords: string[];
  gloss: string;
  /** Planets most often associated with this phase of the work. */
  planets: PlanetId[];
  /** Suggested operation verbs for counsel. */
  operations: string[];
  relatedPrinciple: PrincipleId;
}

export interface EmblemLine {
  id: string;
  title: string;
  body: string;
  gloss: string;
  stageId?: OpusStageId;
}

/** Classical planet → metal (Agrippa / hermetic). */
export const PLANET_METALS: Record<PlanetId, ClassicalMetal> = {
  Sun: 'Gold',
  Moon: 'Silver',
  Mars: 'Iron',
  Mercury: 'Mercury',
  Jupiter: 'Tin',
  Venus: 'Copper',
  Saturn: 'Lead',
};

export const METAL_PLANETS: Record<ClassicalMetal, PlanetId> = {
  Gold: 'Sun',
  Silver: 'Moon',
  Iron: 'Mars',
  Mercury: 'Mercury',
  Tin: 'Jupiter',
  Copper: 'Venus',
  Lead: 'Saturn',
};

export const CLASSICAL_METALS: ClassicalMetal[] = [
  'Gold',
  'Silver',
  'Iron',
  'Mercury',
  'Tin',
  'Copper',
  'Lead',
];

export const TRIA_PRIMA: PrincipleDef[] = [
  {
    id: 'salt',
    name: 'Salt',
    latin: 'Sal',
    gloss: 'Body, fixity, and the vessel that holds form — the ash that remains.',
    glyphId: 'alchemy_salt',
    aspect: 'Body',
  },
  {
    id: 'sulfur',
    name: 'Sulfur',
    latin: 'Sulphur',
    gloss: 'Soul, combustibility, and desire — the fiery principle of character.',
    glyphId: 'alchemy_sulfur',
    aspect: 'Soul',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    latin: 'Mercurius',
    gloss: 'Spirit, volatility, and mediation — the living binder of opposites.',
    glyphId: 'alchemy_mercury',
    aspect: 'Spirit',
  },
];

export const OPUS_STAGES: OpusStageDef[] = [
  {
    id: 'nigredo',
    name: 'Nigredo',
    colorOfWork: 'Black',
    keywords: ['putrefaction', 'dissolution', 'shadow', 'calcination'],
    gloss:
      'Blackening — break down the crude matter. Face what must die before the work can live.',
    planets: ['Saturn', 'Mars'],
    operations: ['calcine', 'putrefy', 'banish', 'compost'],
    relatedPrinciple: 'salt',
  },
  {
    id: 'albedo',
    name: 'Albedo',
    colorOfWork: 'White',
    keywords: ['washing', 'purification', 'moon', 'clarity'],
    gloss:
      'Whitening — wash and clarify. Separate the pure from the dross; cool the fire.',
    planets: ['Moon', 'Mercury'],
    operations: ['dissolve', 'wash', 'distill', 'clarify'],
    relatedPrinciple: 'mercury',
  },
  {
    id: 'citrinitas',
    name: 'Citrinitas',
    colorOfWork: 'Yellow',
    keywords: ['yellowing', 'dawn', 'solar awakening', 'ferment'],
    gloss:
      'Yellowing — the dawn of solar consciousness. Ferment and ripen toward gold.',
    planets: ['Mercury', 'Venus', 'Jupiter'],
    operations: ['ferment', 'ripen', 'illumine', 'temper'],
    relatedPrinciple: 'sulfur',
  },
  {
    id: 'rubedo',
    name: 'Rubedo',
    colorOfWork: 'Red',
    keywords: ['reddening', 'coagulation', 'union', 'stone'],
    gloss:
      'Reddening — coagulate the work. Unite fixed and volatile; crown the stone.',
    planets: ['Sun', 'Mars'],
    operations: ['coagulate', 'unite', 'fix', 'crown'],
    relatedPrinciple: 'sulfur',
  },
];

/** Short axioms for almanac counsel (one line max in UI). */
export const HERMETIC_AXIOMS: string[] = [
  'As above, so below — the work mirrors the sky.',
  'Solve et coagula — separate, then reunite.',
  'The stone is made of patience as much as fire.',
  'That which is below is as that which is above.',
  'The fire tries what the vessel can hold.',
  'Nature delights in nature; nature conquers nature.',
];

/** Emerald Tablet study lines (paraphrase / public-domain tradition). */
export const EMERALD_TABLET_LINES: EmblemLine[] = [
  {
    id: 'emerald-1',
    title: 'True, without falsehood',
    body: 'It is true, without falsehood, certain and most true.',
    gloss: 'The work begins in certainty of method, not rumor.',
    stageId: 'nigredo',
  },
  {
    id: 'emerald-2',
    title: 'As above, so below',
    body: 'That which is above is like that which is below, and that which is below is like that which is above, to accomplish the miracles of the One Thing.',
    gloss: 'Sky and vessel correspond; elections and materia must agree.',
    stageId: 'albedo',
  },
  {
    id: 'emerald-3',
    title: 'The One Thing',
    body: 'And as all things have been and arose from one by the mediation of one, so all things have their birth from this One Thing by adaptation.',
    gloss: 'Multiplicity returns to a single root — the Mercury of the wise.',
    stageId: 'citrinitas',
  },
  {
    id: 'emerald-4',
    title: 'Sun and Moon',
    body: 'The Sun is its father, the Moon its mother, the Wind carried it in its belly, the Earth is its nurse.',
    gloss: 'Solar sulfur, lunar salt, aerial spirit, earthly vessel.',
    stageId: 'rubedo',
  },
  {
    id: 'emerald-5',
    title: 'Separate earth from fire',
    body: 'Separate the earth from the fire, the subtle from the gross, gently and with great ingenuity.',
    gloss: 'Spagyric method: divide, purify, recombine — without haste.',
    stageId: 'albedo',
  },
  {
    id: 'emerald-6',
    title: 'Ascend and descend',
    body: 'It ascends from the earth to the heaven and again it descends to the earth and receives the force of things superior and inferior.',
    gloss: 'Circulation of the work — exalt, then fix what was volatile.',
    stageId: 'citrinitas',
  },
  {
    id: 'emerald-7',
    title: 'Force of all force',
    body: 'By this means you shall have the glory of the whole world, and thereby all obscurity shall fly from you. Its force is above all force, for it vanquishes every subtle thing and penetrates every solid thing.',
    gloss: 'The perfected work clarifies judgment and softens what was rigid.',
    stageId: 'rubedo',
  },
  {
    id: 'emerald-8',
    title: 'So was the world created',
    body: 'So was the world created. From this are and do come admirable adaptations, whereof the means is here in this.',
    gloss: 'Cosmogony as template: the vessel reenacts the making of the world.',
    stageId: 'nigredo',
  },
  {
    id: 'emerald-9',
    title: 'Hermes Trismegistus',
    body: 'Therefore am I called Hermes Trismegistus, having the three parts of the philosophy of the whole world. That which I have said of the operation of the Sun is accomplished and ended.',
    gloss: 'Three parts — Salt, Sulfur, Mercury — crown the solar operation.',
    stageId: 'rubedo',
  },
];

/** Poimandres / Corpus Hermeticum outline cards (study, not full text). */
export const HERMETICA_OUTLINES: EmblemLine[] = [
  {
    id: 'poimandres-vision',
    title: 'Poimandres — the vision',
    body: 'Mind (Nous) reveals itself to the seeker as Light and Word, showing the cosmogony from darkness into ordered spheres.',
    gloss: 'Inner revelation precedes outer craft; know the pattern before the vessel.',
    stageId: 'nigredo',
  },
  {
    id: 'poimandres-man',
    title: 'Poimandres — Man and Nature',
    body: 'Primal Man falls into Nature through love of his own reflection; embodiment is both exile and the field of return.',
    gloss: 'Incarnation as the nigredo of spirit — the work is remembrance.',
    stageId: 'albedo',
  },
  {
    id: 'hermetica-rebirth',
    title: 'Corpus Hermeticum — rebirth',
    body: 'Rebirth is spoken as a change of mind: leaving the irrational torments for the powers of God.',
    gloss: 'Alchemical albedo as ethical and noetic purification.',
    stageId: 'citrinitas',
  },
  {
    id: 'hermetica-ascent',
    title: 'Corpus Hermeticum — ascent',
    body: 'The soul sheds planetary garments on ascent and returns to the Ogdoad in praise.',
    gloss: 'Planetary hours and metals as stations on a ladder of return.',
    stageId: 'rubedo',
  },
  {
    id: 'hermetica-nous',
    title: 'Corpus Hermeticum — Nous',
    body: 'Mind is not taught by argument alone; it is kindled when the student becomes still enough to receive the Word.',
    gloss: 'Meditation before operation — cool the vessel of attention.',
    stageId: 'albedo',
  },
  {
    id: 'hermetica-silence',
    title: 'Asclepius — holy silence',
    body: 'After discourse, the wise keep silence; the mysteries are guarded by reverence more than by speech.',
    gloss: 'Seal the working; do not dissipate the coagulate in idle talk.',
    stageId: 'rubedo',
  },
  {
    id: 'hermetica-sympathy',
    title: 'Hermetica — sympathy of natures',
    body: 'Like draws like across the chain of being; herbs, stones, and stars answer one another.',
    gloss: 'Correspondences are the grammar of election and materia.',
    stageId: 'citrinitas',
  },
];

/** Emblem themes keyed to stages for the Emblem pane. */
export const STAGE_EMBLEMS: EmblemLine[] = [
  {
    id: 'emblem-raven',
    title: 'The Raven',
    body: 'The black bird over the vessel — putrefaction and the end of the crude.',
    gloss: 'Nigredo image: death of the old form.',
    stageId: 'nigredo',
  },
  {
    id: 'emblem-swan',
    title: 'The Swan / White Stone',
    body: 'Whitening waters and the washed stone — lunar clarity after the black.',
    gloss: 'Albedo image: purity without yet the solar crown.',
    stageId: 'albedo',
  },
  {
    id: 'emblem-dawn',
    title: 'The Dawn Peacock',
    body: 'Many-colored feathers before the gold — the peacock’s tail as citrine awakening.',
    gloss: 'Citrinitas image: multiplicity resolving toward the Sun.',
    stageId: 'citrinitas',
  },
  {
    id: 'emblem-phoenix',
    title: 'The Phoenix / Red King',
    body: 'The bird reborn in flame and the red king crowned — union of sun and moon.',
    gloss: 'Rubedo image: the stone that tinctures.',
    stageId: 'rubedo',
  },
  {
    id: 'emblem-ouroboros',
    title: 'The Ouroboros',
    body: 'The serpent that eats its tail — circulation without waste, end joined to beginning.',
    gloss: 'Nigredo / rubedo hinge: putrefaction as the seed of return.',
    stageId: 'nigredo',
  },
  {
    id: 'emblem-hermaphrodite',
    title: 'The Rebis',
    body: 'Two-headed figure, sun and moon crowned — the union of opposites in one body.',
    gloss: 'Rubedo image: fixed and volatile wedded.',
    stageId: 'rubedo',
  },
  {
    id: 'emblem-bath',
    title: 'The Philosophical Bath',
    body: 'King and queen washed in a sealed fountain — dissolution under gentle heat.',
    gloss: 'Albedo image: washing without scattering the spirit.',
    stageId: 'albedo',
  },
  {
    id: 'emblem-green-lion',
    title: 'The Green Lion',
    body: 'The lion devouring the sun — crude vitriol and the eating of imperfect gold.',
    gloss: 'Citrinitas / nigredo edge: fierce solvent before the dawn.',
    stageId: 'citrinitas',
  },
];
