/**
 * Mathers 1904 Goetia seal plates (Phase 41).
 * Commons filenames for ingest; runtime prefers processed `{sealRef}.png`.
 *
 * Dual variants use seal01. 29 and 69 have no numbered file in the
 * `NN-Name seal.png` series — PD alternates from the same Commons category.
 */

export type GoetiaPlateKind = 'numbered' | 'dual' | 'alternate';

export interface GoetiaPlateSource {
  /** Wikimedia Commons file title without the `File:` prefix. */
  commonsFile: string;
  kind: GoetiaPlateKind;
  /** Optional: keep generated SVG instead of this plate. */
  preferGenerated?: boolean;
}

/**
 * Spirit number → Commons source. One plate per spirit.
 */
export const GOETIA_MATHERS_PLATES: Record<number, GoetiaPlateSource> = {
  1: { commonsFile: '01-Bael seal.png', kind: 'numbered' },
  2: { commonsFile: '02-Agares seal.png', kind: 'numbered' },
  3: { commonsFile: '03-Vassago seal.png', kind: 'numbered' },
  4: { commonsFile: '04-Samigina seal.png', kind: 'numbered' },
  5: { commonsFile: '05-Marbas seal.png', kind: 'numbered' },
  6: { commonsFile: '06-Valefor seal.png', kind: 'numbered' },
  7: { commonsFile: '07-Amon seal.png', kind: 'numbered' },
  8: { commonsFile: '08-Barbatos seal.png', kind: 'numbered' },
  9: { commonsFile: '09-Paimon seal01.png', kind: 'dual' },
  10: { commonsFile: '10-Buer seal.png', kind: 'numbered' },
  11: { commonsFile: '11-Gusion seal.png', kind: 'numbered' },
  12: { commonsFile: '12-Sitri seal.png', kind: 'numbered' },
  13: { commonsFile: '13-Beleth seal01.png', kind: 'dual' },
  14: { commonsFile: '14-Leraie seal.png', kind: 'numbered' },
  15: { commonsFile: '15-Eligos seal.png', kind: 'numbered' },
  16: { commonsFile: '16-Zepar seal.png', kind: 'numbered' },
  17: { commonsFile: '17-Botis seal.png', kind: 'numbered' },
  18: { commonsFile: '18-Bathin seal01.png', kind: 'dual' },
  19: { commonsFile: '19-Sallos seal.png', kind: 'numbered' },
  20: { commonsFile: '20-Purson seal.png', kind: 'numbered' },
  21: { commonsFile: '21-Marax seal.png', kind: 'numbered' },
  22: { commonsFile: '22-Ipos seal.png', kind: 'numbered' },
  23: { commonsFile: '23-Aim seal.png', kind: 'numbered' },
  24: { commonsFile: '24-Naberius seal.png', kind: 'numbered' },
  25: { commonsFile: '25-Glasya-Labolas seal.png', kind: 'numbered' },
  26: { commonsFile: '26-Bune seal01.png', kind: 'dual' },
  27: { commonsFile: '27-Ronove seal.png', kind: 'numbered' },
  28: { commonsFile: '28-Berith seal.png', kind: 'numbered' },
  29: { commonsFile: 'Astaroth Seal.svg', kind: 'alternate' },
  30: { commonsFile: '30-Forneus seal.png', kind: 'numbered' },
  31: { commonsFile: '31-Foras seal.png', kind: 'numbered' },
  32: { commonsFile: '32-Asmoday seal.png', kind: 'numbered' },
  33: { commonsFile: '33-Gaap seal.png', kind: 'numbered' },
  34: { commonsFile: '34-Furfur seal.png', kind: 'numbered' },
  35: { commonsFile: '35-Marchosias seal.png', kind: 'numbered' },
  36: { commonsFile: '36-Stolas seal.png', kind: 'numbered' },
  37: { commonsFile: '37-Phenex seal.png', kind: 'numbered' },
  38: { commonsFile: '38-Halphus seal.png', kind: 'numbered' },
  39: { commonsFile: '39-Malphas.png', kind: 'numbered' },
  40: { commonsFile: '40-Raum seal.png', kind: 'numbered' },
  41: { commonsFile: '41-Focalor seal.png', kind: 'numbered' },
  42: { commonsFile: '42-Vepar seal01.png', kind: 'dual' },
  43: { commonsFile: '43-Sabnock seal.png', kind: 'numbered' },
  44: { commonsFile: '44-Shax seal.png', kind: 'numbered' },
  45: { commonsFile: '45-Vine seal.png', kind: 'numbered' },
  46: { commonsFile: '46-Bifrons seal.png', kind: 'numbered' },
  47: { commonsFile: '47-Vual seal01.png', kind: 'dual' },
  48: { commonsFile: '48-Haagenti seal.png', kind: 'numbered' },
  49: { commonsFile: '49-Crocell seal.png', kind: 'numbered' },
  50: { commonsFile: '50-Furcas seal.png', kind: 'numbered' },
  51: { commonsFile: '51-Balam seal.png', kind: 'numbered' },
  52: { commonsFile: '52-Alloces seal.png', kind: 'numbered' },
  53: { commonsFile: '53-Camio seal.png', kind: 'numbered' },
  54: { commonsFile: '54-Murmur seal.png', kind: 'numbered' },
  55: { commonsFile: '55-Orobas seal.png', kind: 'numbered' },
  56: { commonsFile: '56-Gremory seal.png', kind: 'numbered' },
  57: { commonsFile: '57-Ose seal.png', kind: 'numbered' },
  58: { commonsFile: '58-Amy seal.png', kind: 'numbered' },
  59: { commonsFile: '59-Orias seal.png', kind: 'numbered' },
  60: { commonsFile: '60-Vapula seal.png', kind: 'numbered' },
  61: { commonsFile: '61-Zagan seal.png', kind: 'numbered' },
  62: { commonsFile: '62-Valac seal.png', kind: 'numbered' },
  63: { commonsFile: '63-Andras seal.png', kind: 'numbered' },
  64: { commonsFile: '64-Haures seal.png', kind: 'numbered' },
  65: { commonsFile: '65-Andrealphus seal.png', kind: 'numbered' },
  66: { commonsFile: '66-Cimeies seal.png', kind: 'numbered' },
  67: { commonsFile: '67-Amdusias seal.png', kind: 'numbered' },
  68: { commonsFile: '68-Belial seal.png', kind: 'numbered' },
  69: { commonsFile: 'Decarabia seal.png', kind: 'alternate' },
  70: { commonsFile: '70-Seere seal01.png', kind: 'dual' },
  71: { commonsFile: '71-Dantalion seal.png', kind: 'numbered' },
  72: { commonsFile: '72-Andromalius seal.png', kind: 'numbered' },
};

export function plateSourceForNumber(
  n: number
): GoetiaPlateSource | undefined {
  return GOETIA_MATHERS_PLATES[n];
}

export function spiritNumberFromSealRef(sealRef: string): number | undefined {
  const m = /^seal-(\d{2})-/.exec(sealRef);
  return m ? Number(m[1]) : undefined;
}
