/**
 * Ars Goetia spirit catalog (Lesser Key of Solomon, Crowley's numbering).
 * Phase 6 — conjuration layout: number, name, rank, seal reference.
 * Seal artwork is not included; sealRef is a stable placeholder for future art.
 */

export type GoetiaRank =
  | 'king'
  | 'duke'
  | 'prince'
  | 'marquis'
  | 'president'
  | 'earl'
  | 'knight';

export interface GoetiaSpirit {
  id: string;
  number: number;
  name: string;
  rank: GoetiaRank;
  /** Stable reference key for a future seal asset (not loaded in v1). */
  sealRef: string;
}

export const GOETIA_RANK_LABELS: Record<GoetiaRank, string> = {
  king: 'King',
  duke: 'Duke',
  prince: 'Prince',
  marquis: 'Marquis',
  president: 'President',
  earl: 'Earl',
  knight: 'Knight',
};

function spirit(
  number: number,
  name: string,
  rank: GoetiaRank
): GoetiaSpirit {
  const pad = String(number).padStart(2, '0');
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    id: `goetia-${pad}`,
    number,
    name,
    rank,
    sealRef: `seal-${pad}-${slug}`,
  };
}

/** The 72 spirits of the Ars Goetia (Mathers/Crowley order). */
export const GOETIA_SPIRITS: GoetiaSpirit[] = [
  spirit(1, 'Bael', 'king'),
  spirit(2, 'Agares', 'duke'),
  spirit(3, 'Vassago', 'prince'),
  spirit(4, 'Samigina', 'marquis'),
  spirit(5, 'Marbas', 'president'),
  spirit(6, 'Valefor', 'duke'),
  spirit(7, 'Amon', 'marquis'),
  spirit(8, 'Barbatos', 'duke'),
  spirit(9, 'Paimon', 'king'),
  spirit(10, 'Buer', 'president'),
  spirit(11, 'Gusion', 'duke'),
  spirit(12, 'Sitri', 'prince'),
  spirit(13, 'Beleth', 'king'),
  spirit(14, 'Leraje', 'marquis'),
  spirit(15, 'Eligos', 'duke'),
  spirit(16, 'Zepar', 'duke'),
  spirit(17, 'Botis', 'president'),
  spirit(18, 'Bathin', 'duke'),
  spirit(19, 'Sallos', 'duke'),
  spirit(20, 'Purson', 'king'),
  spirit(21, 'Marax', 'president'),
  spirit(22, 'Ipos', 'earl'),
  spirit(23, 'Aim', 'duke'),
  spirit(24, 'Naberius', 'marquis'),
  spirit(25, 'Glasya-Labolas', 'president'),
  spirit(26, 'Bune', 'duke'),
  spirit(27, 'Ronove', 'marquis'),
  spirit(28, 'Berith', 'duke'),
  spirit(29, 'Astaroth', 'duke'),
  spirit(30, 'Forneus', 'marquis'),
  spirit(31, 'Foras', 'president'),
  spirit(32, 'Asmoday', 'king'),
  spirit(33, 'Gaap', 'president'),
  spirit(34, 'Furfur', 'earl'),
  spirit(35, 'Marchosias', 'marquis'),
  spirit(36, 'Stolas', 'prince'),
  spirit(37, 'Phenex', 'marquis'),
  spirit(38, 'Halphas', 'earl'),
  spirit(39, 'Malphas', 'president'),
  spirit(40, 'Raum', 'earl'),
  spirit(41, 'Focalor', 'duke'),
  spirit(42, 'Vepar', 'duke'),
  spirit(43, 'Sabnock', 'marquis'),
  spirit(44, 'Shax', 'marquis'),
  spirit(45, 'Vine', 'king'),
  spirit(46, 'Bifrons', 'earl'),
  spirit(47, 'Vual', 'duke'),
  spirit(48, 'Haagenti', 'president'),
  spirit(49, 'Crocell', 'duke'),
  spirit(50, 'Furcas', 'knight'),
  spirit(51, 'Balam', 'king'),
  spirit(52, 'Alloces', 'duke'),
  spirit(53, 'Camio', 'president'),
  spirit(54, 'Murmur', 'duke'),
  spirit(55, 'Orobas', 'prince'),
  spirit(56, 'Gremory', 'duke'),
  spirit(57, 'Ose', 'president'),
  spirit(58, 'Amy', 'president'),
  spirit(59, 'Oriax', 'marquis'),
  spirit(60, 'Vapula', 'duke'),
  spirit(61, 'Zagan', 'king'),
  spirit(62, 'Valac', 'president'),
  spirit(63, 'Andras', 'marquis'),
  spirit(64, 'Haures', 'duke'),
  spirit(65, 'Andrealphus', 'marquis'),
  spirit(66, 'Cimejes', 'marquis'),
  spirit(67, 'Amdusias', 'duke'),
  spirit(68, 'Belial', 'king'),
  spirit(69, 'Decarabia', 'marquis'),
  spirit(70, 'Seere', 'prince'),
  spirit(71, 'Dantalion', 'duke'),
  spirit(72, 'Andromalius', 'earl'),
];

export function getSpiritById(id: string): GoetiaSpirit | undefined {
  return GOETIA_SPIRITS.find((s) => s.id === id);
}

export function getSpiritByNumber(n: number): GoetiaSpirit | undefined {
  return GOETIA_SPIRITS.find((s) => s.number === n);
}
