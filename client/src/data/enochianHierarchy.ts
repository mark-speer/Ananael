/**
 * Enochian hierarchy study tables — Heptarchia Mystica courts, Watchtower
 * Kings (Golden Dawn reconstruction), Tablet of Union names, and the 91
 * Governors of the 30 Aethyrs with traditional Parts-of-the-Earth labels.
 *
 * Study tables, not a complete Great Table encoding. Heptarchia spellings
 * follow Casaubon-tradition / Heptarchia Mystica. Watchtower Kings and
 * Seniors follow the Golden Dawn reconstruction. Governor names follow
 * Liber Scientiae Auxilii et Victoriae Terrestris; place labels are the
 * 16th-century Ptolemaic/Agrippa names as tabulated in that book. TEX has
 * four Governors; the other Aires have three (91 total). No claim of a
 * unique or exhaustive geographic reconstruction.
 */

export type EnochianElement = 'Fire' | 'Water' | 'Air' | 'Earth';

export type HeptarchiaPlanet =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn';

export type HeptarchiaWeekday =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface HeptarchiaCourt {
  planet: HeptarchiaPlanet;
  weekday: HeptarchiaWeekday;
  king: string;
  prince: string;
}

export const HEPTARCHIA_COURTS: readonly HeptarchiaCourt[] = [
  { planet: 'Sun', weekday: 'Sunday', king: 'Bobogel', prince: 'Bornogo' },
  { planet: 'Moon', weekday: 'Monday', king: 'Blumaza', prince: 'Bralges' },
  { planet: 'Mars', weekday: 'Tuesday', king: 'Babalel', prince: 'Befafes' },
  {
    planet: 'Mercury',
    weekday: 'Wednesday',
    king: 'Bnaspol',
    prince: 'Blisdon',
  },
  {
    planet: 'Jupiter',
    weekday: 'Thursday',
    king: 'Bynepor',
    prince: 'Butmono',
  },
  { planet: 'Venus', weekday: 'Friday', king: 'Baligon', prince: 'Bagenol' },
  {
    planet: 'Saturn',
    weekday: 'Saturday',
    king: 'Bnapsen',
    prince: 'Brorges',
  },
];

export type WatchtowerQuarter = 'East' | 'West' | 'North' | 'South';

export interface WatchtowerSenior {
  name: string;
  /** GD planetary attribution of the Senior — study only. */
  planet: HeptarchiaPlanet;
}

export interface WatchtowerRecord {
  element: EnochianElement;
  quarter: WatchtowerQuarter;
  king: string;
  union: string;
  seniors: readonly WatchtowerSenior[];
}

export const WATCHTOWERS: readonly WatchtowerRecord[] = [
  {
    element: 'Air',
    quarter: 'East',
    king: 'BATAIVAH',
    union: 'EXARP',
    seniors: [
      { name: 'HABIORO', planet: 'Mars' },
      { name: 'AAOZAIF', planet: 'Jupiter' },
      { name: 'HTNORDA', planet: 'Moon' },
      { name: 'AHAOZPI', planet: 'Venus' },
      { name: 'AVTOTAR', planet: 'Mercury' },
      { name: 'HIPOTGA', planet: 'Saturn' },
    ],
  },
  {
    element: 'Water',
    quarter: 'West',
    king: 'RAAGIOSL',
    union: 'HCOMA',
    seniors: [
      { name: 'LSRAHPM', planet: 'Mars' },
      { name: 'SAIINOV', planet: 'Jupiter' },
      { name: 'LAVAVR', planet: 'Moon' },
      { name: 'SLGAIOL', planet: 'Venus' },
      { name: 'SOAIZNT', planet: 'Mercury' },
      { name: 'LIGDISA', planet: 'Saturn' },
    ],
  },
  {
    element: 'Earth',
    quarter: 'North',
    king: 'ICZHIHAL',
    union: 'NANTA',
    seniors: [
      { name: 'ACZINOR', planet: 'Jupiter' },
      { name: 'LZINOPO', planet: 'Moon' },
      { name: 'ALHCTGA', planet: 'Venus' },
      { name: 'LIIANSA', planet: 'Saturn' },
      { name: 'AHMLICV', planet: 'Mercury' },
      { name: 'LAIDROM', planet: 'Mars' },
    ],
  },
  {
    element: 'Fire',
    quarter: 'South',
    king: 'EDLPRNAA',
    union: 'BITOM',
    seniors: [
      { name: 'AAETPIO', planet: 'Mars' },
      { name: 'ADOEOET', planet: 'Jupiter' },
      { name: 'ALNDVOD', planet: 'Moon' },
      { name: 'AAPDOCE', planet: 'Venus' },
      { name: 'ARINNAP', planet: 'Saturn' },
      { name: 'ANODOIN', planet: 'Mercury' },
    ],
  },
];

export interface EnochianGovernor {
  name: string;
  /** Traditional Part-of-the-Earth place label (Ptolemaic / Agrippa). */
  part: string;
}

export interface EnochianAethyr {
  id: string;
  number: number;
  name: string;
  governors: readonly EnochianGovernor[];
}

/** 30 Aires, LIL (1) through TEX (30). TEX has four Governors. */
export const ENOCHIAN_AETHYRS: readonly EnochianAethyr[] = [
  {
    id: 'LIL',
    number: 1,
    name: 'LIL',
    governors: [
      { name: 'Occodon', part: 'Egypt' },
      { name: 'Pascomb', part: 'Syria' },
      { name: 'Valgars', part: 'Mesopotamia' },
    ],
  },
  {
    id: 'ARN',
    number: 2,
    name: 'ARN',
    governors: [
      { name: 'Doagnis', part: 'Cappadocia' },
      { name: 'Pacasna', part: 'Tuscia' },
      { name: 'Dialiva', part: 'Parthia' },
    ],
  },
  {
    id: 'ZOM',
    number: 3,
    name: 'ZOM',
    governors: [
      { name: 'Samapha', part: 'Hyrcania' },
      { name: 'Virooli', part: 'Thracia' },
      { name: 'Andispi', part: 'Getulia' },
    ],
  },
  {
    id: 'PAZ',
    number: 4,
    name: 'PAZ',
    governors: [
      { name: 'Thotanp', part: 'Thebaid' },
      { name: 'Axziarg', part: 'Parsadal' },
      { name: 'Pothnir', part: 'Carthage' },
    ],
  },
  {
    id: 'LIT',
    number: 5,
    name: 'LIT',
    governors: [
      { name: 'Lazdixi', part: 'Chaldea' },
      { name: 'Nocamal', part: 'Italia' },
      { name: 'Tiarpax', part: 'Gallia' },
    ],
  },
  {
    id: 'MAZ',
    number: 6,
    name: 'MAZ',
    governors: [
      { name: 'Saxtomp', part: 'Bithynia' },
      { name: 'Vavaamp', part: 'Graecia' },
      { name: 'Zirzird', part: 'Lycia' },
    ],
  },
  {
    id: 'DEO',
    number: 7,
    name: 'DEO',
    governors: [
      { name: 'Opmacas', part: 'Onias' },
      { name: 'Genadol', part: 'Cilicia' },
      { name: 'Aspiaon', part: 'Paphlagonia' },
    ],
  },
  {
    id: 'ZID',
    number: 8,
    name: 'ZID',
    governors: [
      { name: 'Zamfres', part: 'Phasiana' },
      { name: 'Todnaon', part: 'Carmania' },
      { name: 'Pristac', part: 'Celtica' },
    ],
  },
  {
    id: 'ZIP',
    number: 9,
    name: 'ZIP',
    governors: [
      { name: 'Oddiorg', part: 'Assyria' },
      { name: 'Cralpir', part: 'Sogdiana' },
      { name: 'Doanzin', part: 'Lydia' },
    ],
  },
  {
    id: 'ZAX',
    number: 10,
    name: 'ZAX',
    governors: [
      { name: 'Lexarph', part: 'India' },
      { name: 'Comanan', part: 'Bactriana' },
      { name: 'Tabitom', part: 'Cyrene' },
    ],
  },
  {
    id: 'ICH',
    number: 11,
    name: 'ICH',
    governors: [
      { name: 'Molpand', part: 'Oxiana' },
      { name: 'Vsnarda', part: 'Numidia' },
      { name: 'Ponodol', part: 'Cyprus' },
    ],
  },
  {
    id: 'LOE',
    number: 12,
    name: 'LOE',
    governors: [
      { name: 'Tapamal', part: 'Onigap' },
      { name: 'Gedoons', part: 'India' },
      { name: 'Ambriol', part: 'Orchenii' },
    ],
  },
  {
    id: 'ZIM',
    number: 13,
    name: 'ZIM',
    governors: [
      { name: 'Gecaond', part: 'Achaia' },
      { name: 'Laparin', part: 'Armenia' },
      { name: 'Docepax', part: 'Nemrodiana' },
    ],
  },
  {
    id: 'VTA',
    number: 14,
    name: 'VTA',
    governors: [
      { name: 'Tedoond', part: 'Paphlagonia' },
      { name: 'Vivipos', part: 'Phasiana' },
      { name: 'Ooanamb', part: 'Chaldea' },
    ],
  },
  {
    id: 'OXO',
    number: 15,
    name: 'OXO',
    governors: [
      { name: 'Tahando', part: 'Itergi' },
      { name: 'Nociabi', part: 'Macedonia' },
      { name: 'Tastoxo', part: 'Garamantia' },
    ],
  },
  {
    id: 'LEA',
    number: 16,
    name: 'LEA',
    governors: [
      { name: 'Cucarpt', part: 'Sauromatica' },
      { name: 'Lauacon', part: 'Aethiopia' },
      { name: 'Sochial', part: 'Fiacim' },
    ],
  },
  {
    id: 'TAN',
    number: 17,
    name: 'TAN',
    governors: [
      { name: 'Sigmorf', part: 'Colchis' },
      { name: 'Aydropt', part: 'Cyrenaica' },
      { name: 'Tocarzi', part: 'Nasamonia' },
    ],
  },
  {
    id: 'ZEN',
    number: 18,
    name: 'ZEN',
    governors: [
      { name: 'Nabaomi', part: 'Carthago' },
      { name: 'Zafasai', part: 'Coxlant' },
      { name: 'Yalpamb', part: 'Idumaea' },
    ],
  },
  {
    id: 'POP',
    number: 19,
    name: 'POP',
    governors: [
      { name: 'Torzoxi', part: 'Parstavia' },
      { name: 'Abaiond', part: 'Celtica' },
      { name: 'Omagrap', part: 'Vinsan' },
    ],
  },
  {
    id: 'KHR',
    number: 20,
    name: 'KHR',
    governors: [
      { name: 'Zildron', part: 'Tolpam' },
      { name: 'Parziba', part: 'Carcedonia' },
      { name: 'Totocan', part: 'Italia' },
    ],
  },
  {
    id: 'ASP',
    number: 21,
    name: 'ASP',
    governors: [
      { name: 'Chirzpa', part: 'Brytania' },
      { name: 'Toantom', part: 'Phoenicia' },
      { name: 'Vixpalg', part: 'Commagene' },
    ],
  },
  {
    id: 'LIN',
    number: 22,
    name: 'LIN',
    governors: [
      { name: 'Ozidaia', part: 'Apulia' },
      { name: 'Paraoan', part: 'Marmarica' },
      { name: 'Calzirg', part: 'Coele-Syria' },
    ],
  },
  {
    id: 'TOR',
    number: 23,
    name: 'TOR',
    governors: [
      { name: 'Ronoamb', part: 'Gebal' },
      { name: 'Onizimp', part: 'Elam' },
      { name: 'Zaxanin', part: 'Idunia' },
    ],
  },
  {
    id: 'NIA',
    number: 24,
    name: 'NIA',
    governors: [
      { name: 'Orcamir', part: 'Media' },
      { name: 'Chialps', part: 'Ariana' },
      { name: 'Soageel', part: 'Chaldea' },
    ],
  },
  {
    id: 'VTI',
    number: 25,
    name: 'VTI',
    governors: [
      { name: 'Mirzind', part: 'Serica' },
      { name: 'Obuaors', part: 'Persia' },
      { name: 'Ranglam', part: 'Gogatha' },
    ],
  },
  {
    id: 'DES',
    number: 26,
    name: 'DES',
    governors: [
      { name: 'Pophand', part: 'Gorsin' },
      { name: 'Nigrana', part: 'Hispania' },
      { name: 'Bazchim', part: 'Pamphylia' },
    ],
  },
  {
    id: 'ZAA',
    number: 27,
    name: 'ZAA',
    governors: [
      { name: 'Saziami', part: 'Oacidi' },
      { name: 'Mathula', part: 'Babylon' },
      { name: 'Orpanib', part: 'Media' },
    ],
  },
  {
    id: 'BAG',
    number: 28,
    name: 'BAG',
    governors: [
      { name: 'Labnixp', part: 'Idumian' },
      { name: 'Focisni', part: 'Arabia Felix' },
      { name: 'Oxlopar', part: 'Metagonitis' },
    ],
  },
  {
    id: 'RII',
    number: 29,
    name: 'RII',
    governors: [
      { name: 'Vastrim', part: 'Assyria' },
      { name: 'Odraxti', part: 'Africa' },
      { name: 'Gomziam', part: 'Bactriana' },
    ],
  },
  {
    id: 'TEX',
    number: 30,
    name: 'TEX',
    governors: [
      { name: 'Taoagla', part: 'Asnan' },
      { name: 'Gemnimb', part: 'Phrygia' },
      { name: 'Advorpt', part: 'Creta' },
      { name: 'Dozinal', part: 'Mauritania' },
    ],
  },
];

export function getHeptarchiaCourt(
  planet: HeptarchiaPlanet
): HeptarchiaCourt | undefined {
  return HEPTARCHIA_COURTS.find((c) => c.planet === planet);
}

export function getHeptarchiaCourtByWeekday(
  weekday: HeptarchiaWeekday
): HeptarchiaCourt | undefined {
  return HEPTARCHIA_COURTS.find((c) => c.weekday === weekday);
}

export function getWatchtower(
  element: EnochianElement
): WatchtowerRecord | undefined {
  return WATCHTOWERS.find((w) => w.element === element);
}

export function getAethyr(id: string): EnochianAethyr | undefined {
  const key = id.trim().toUpperCase();
  return ENOCHIAN_AETHYRS.find((a) => a.id === key || a.name === key);
}

export const HEPTARCHIA_PLANETS: readonly HeptarchiaPlanet[] =
  HEPTARCHIA_COURTS.map((c) => c.planet);

export function isHeptarchiaPlanet(id: string): id is HeptarchiaPlanet {
  return (HEPTARCHIA_PLANETS as readonly string[]).includes(id);
}

/** Focus keys used by natal deep-links and study notes. */
export function heptarchiaFocus(planet: HeptarchiaPlanet): string {
  return `heptarchia:${planet}`;
}

export function watchtowerFocus(element: EnochianElement): string {
  return `watchtower:${element}`;
}

export function aethyrFocus(id: string): string {
  return `aethyr:${id}`;
}

export type HierarchyPane = 'heptarchia' | 'watchtowers' | 'aethyrs';

export function parseHierarchyFocus(focus: string | undefined): {
  pane: HierarchyPane;
  key?: string;
} | null {
  if (!focus) return null;
  const [kind, rest] = focus.split(':');
  if (kind === 'heptarchia' && rest) {
    return { pane: 'heptarchia', key: rest };
  }
  if (kind === 'watchtower' && rest) {
    return { pane: 'watchtowers', key: rest };
  }
  if (kind === 'aethyr' && rest) {
    return { pane: 'aethyrs', key: rest.toUpperCase() };
  }
  return null;
}
