/**
 * Deck visual styles and Rider–Waite–Smith image path mapping.
 * Filenames match the source pack as-is (including known typos).
 */

export type DeckStyle = 'artless' | 'rider-waite-smith';

export const RWS_IMAGE_BASE = '/assets/Images/Tarot/Rider-Waite-20-30';

const DECK_STYLE_STORAGE_KEY = 'ananael-tarot-deck-style';

/** cardId → filename under RWS_IMAGE_BASE */
const RWS_FILENAMES: Record<string, string> = {
  // Major Arcana
  'major-00': '0_The_Fool.jpg',
  'major-01': 'I_The_Magician.jpg',
  'major-02': 'II_The_High_Priestess.jpg',
  'major-03': 'III_The_Empress.jpg',
  'major-04': 'IV_The_Emperor.jpg',
  'major-05': 'V_The_Heierophant.jpg',
  'major-06': 'VI_The_Lovers.jpg',
  'major-07': 'VII_The_Charior.jpg',
  'major-08': 'VIII_Strength.jpg',
  'major-09': 'IX_The_Hermit.jpg',
  'major-10': 'X_Wheel_of_Fortune.jpg',
  'major-11': 'XI_Justice.jpg',
  'major-12': 'XII_The_Hanged_Man.jpg',
  'major-13': 'XIII_Death.jpg',
  'major-14': 'XIV_Temperance.jpg',
  'major-15': 'XV_The_Devil.jpg',
  'major-16': 'XVI_The_Tower.jpg',
  'major-17': 'XVII_The_Star.jpg',
  'major-18': 'XVIII_The_Moon.jpg',
  'major-19': 'XIX_The_Sun.jpg',
  'major-20': 'XX_Judgement.jpg',
  'major-21': 'XXI_The_World.jpg',

  // Wands
  'wands-01': '1_Ace_of_Wands.jpg',
  'wands-02': '2_of_Wands.jpg',
  'wands-03': '3_of_Wands.jpg',
  'wands-04': '4_of_Wands.jpg',
  'wands-05': '5_of_Wands.jpg',
  'wands-06': '6_of_Wands.jpg',
  'wands-07': '7_of_Wands.jpg',
  'wands-08': '8_of_Wands.jpg',
  'wands-09': '9_of_Wands.jpg',
  'wands-10': '10_of_Wands.jpg',
  'wands-11': 'Page_of_Wands.jpg',
  'wands-12': 'Knight_of_Wands.jpg',
  'wands-13': 'Queen_of_Wands.jpg',
  'wands-14': 'King_of_Wands.jpg',

  // Cups
  'cups-01': '1_Ace_of_Cups.jpg',
  'cups-02': '2_of_Cups.jpg',
  'cups-03': '3_of_Cups.jpg',
  'cups-04': '4_of_Cups.jpg',
  'cups-05': '5_of_Cups.jpg',
  'cups-06': '6_of_Cups.jpg',
  'cups-07': '7_of_Cups.jpg',
  'cups-08': '8_of_Cups.jpg',
  'cups-09': '9_of_Cups.jpg',
  'cups-10': '10_of_Cups.jpg',
  'cups-11': 'Page_of_Cups.jpg',
  'cups-12': 'Knight_of_Cups.jpg',
  'cups-13': 'Queen_of_Cups.jpg',
  'cups-14': 'King_of_Cups.jpg',

  // Swords
  'swords-01': '1_Ace_of_Swords.jpg',
  'swords-02': '2_of_Swords.jpg',
  'swords-03': '3_of_Swords.jpg',
  'swords-04': '4_of_Swords.jpg',
  'swords-05': '5_of_Swords.jpg',
  'swords-06': '6_of_Swords.jpg',
  'swords-07': '7_of_Swords.jpg',
  'swords-08': '8_of_Swords.jpg',
  'swords-09': '9_of_Swords.jpg',
  'swords-10': '10_of_Swords.jpg',
  'swords-11': 'Page_of_Swords.jpg',
  'swords-12': 'Knight_of_Swords.jpg',
  'swords-13': 'Queen_of_Swords.jpg',
  'swords-14': 'King_of_Swords.jpg',

  // Pentacles
  'pentacles-01': '1_Ace_of_Pentacles.jpg',
  'pentacles-02': '2_of_Pentacles.jpg',
  'pentacles-03': '3_of_Pentacles.jpg',
  'pentacles-04': '4_of_Pentacles.jpg',
  'pentacles-05': '5_of_Pentacles.jpg',
  'pentacles-06': '6_of_Pentacles.jpg',
  'pentacles-07': '7_of_Pentacles.jpg',
  'pentacles-08': '8_of_Pentacles.jpg',
  'pentacles-09': '9_of_Pentacles.jpg',
  'pentacles-10': '10_of_Pentacles.jpg',
  'pentacles-11': 'Page_of_Pentacles.jpg',
  'pentacles-12': 'Knight_of_Pentacles.jpg',
  'pentacles-13': 'Queen_of_Pentacles.jpg',
  'pentacles-14': 'King_of_Pentacles.jpg',
};

export function getTarotCardImageUrl(cardId: string): string | undefined {
  const filename = RWS_FILENAMES[cardId];
  if (!filename) return undefined;
  return `${RWS_IMAGE_BASE}/${filename}`;
}

export function loadDeckStyle(): DeckStyle {
  try {
    const stored = localStorage.getItem(DECK_STYLE_STORAGE_KEY);
    if (stored === 'artless' || stored === 'rider-waite-smith') {
      return stored;
    }
  } catch {
    // ignore storage access errors
  }
  return 'artless';
}

export function saveDeckStyle(style: DeckStyle): void {
  try {
    localStorage.setItem(DECK_STYLE_STORAGE_KEY, style);
  } catch {
    // ignore storage access errors
  }
}
