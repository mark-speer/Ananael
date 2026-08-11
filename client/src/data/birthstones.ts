/**
 * Modern (month) birthstones — distinct from Liber 777 hermetic stones.
 */

export const MODERN_BIRTHSTONES: readonly {
  /** 1–12 Gregorian month. */
  month: number;
  monthName: string;
  stones: readonly string[];
}[] = [
  { month: 1, monthName: 'January', stones: ['Garnet'] },
  { month: 2, monthName: 'February', stones: ['Amethyst'] },
  { month: 3, monthName: 'March', stones: ['Aquamarine', 'Bloodstone'] },
  { month: 4, monthName: 'April', stones: ['Diamond'] },
  { month: 5, monthName: 'May', stones: ['Emerald'] },
  { month: 6, monthName: 'June', stones: ['Pearl', 'Moonstone', 'Alexandrite'] },
  { month: 7, monthName: 'July', stones: ['Ruby'] },
  { month: 8, monthName: 'August', stones: ['Peridot', 'Spinel'] },
  { month: 9, monthName: 'September', stones: ['Sapphire'] },
  { month: 10, monthName: 'October', stones: ['Opal', 'Tourmaline'] },
  { month: 11, monthName: 'November', stones: ['Topaz', 'Citrine'] },
  { month: 12, monthName: 'December', stones: ['Turquoise', 'Zircon', 'Blue Topaz'] },
] as const;

export function modernBirthstonesForMonth(month: number): readonly string[] {
  const row = MODERN_BIRTHSTONES.find((m) => m.month === month);
  return row?.stones ?? [];
}
