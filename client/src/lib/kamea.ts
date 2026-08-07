/**
 * Planetary kamea (magic squares) — traditional Agrippa sizes.
 */

export type KameaPlanet =
  | 'Saturn'
  | 'Jupiter'
  | 'Mars'
  | 'Sun'
  | 'Venus'
  | 'Mercury'
  | 'Moon';

export const KAMEA_PLANETS: KameaPlanet[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

/** Planetary order from the slowest classical sphere to the fastest. */
export const PLANET_ORDER = KAMEA_PLANETS;

export const KAMEA_ORDER: Record<KameaPlanet, number> = {
  Saturn: 3,
  Jupiter: 4,
  Mars: 5,
  Sun: 6,
  Venus: 7,
  Mercury: 8,
  Moon: 9,
};

/** Siamese method for odd n. */
function oddMagicSquare(n: number): number[][] {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  let row = 0;
  let col = Math.floor(n / 2);
  for (let k = 1; k <= n * n; k++) {
    grid[row][col] = k;
    const nextRow = (row - 1 + n) % n;
    const nextCol = (col + 1) % n;
    if (grid[nextRow][nextCol] !== 0) {
      row = (row + 1) % n;
    } else {
      row = nextRow;
      col = nextCol;
    }
  }
  return grid;
}

/** Dürer / traditional for n=4. */
function square4(): number[][] {
  return [
    [1, 15, 14, 4],
    [12, 6, 7, 9],
    [8, 10, 11, 5],
    [13, 3, 2, 16],
  ];
}

/** LUX method style for n≡2 mod 4 (n=6). */
function square6(): number[][] {
  // Traditional solar kamea of 6 (Agrippa).
  return [
    [35, 1, 6, 26, 19, 24],
    [3, 32, 7, 21, 23, 25],
    [31, 9, 2, 22, 27, 20],
    [8, 28, 33, 17, 10, 15],
    [30, 5, 34, 12, 14, 16],
    [4, 36, 29, 13, 18, 11],
  ];
}

/** Doubly even (n≡0 mod 4): n=8. */
function doublyEven(n: number): number[][] {
  const grid = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i * n + j + 1)
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inDiag =
        i % 4 === j % 4 || i % 4 === (n - 1 - j) % 4;
      if (inDiag) {
        grid[i][j] = n * n + 1 - grid[i][j];
      }
    }
  }
  return grid;
}

const CACHE = new Map<KameaPlanet, number[][]>();

export function getKamea(planet: KameaPlanet): number[][] {
  const cached = CACHE.get(planet);
  if (cached) return cached;
  const n = KAMEA_ORDER[planet];
  let grid: number[][];
  if (n === 4) grid = square4();
  else if (n === 6) grid = square6();
  else if (n % 2 === 1) grid = oddMagicSquare(n);
  else if (n % 4 === 0) grid = doublyEven(n);
  else grid = square6();
  CACHE.set(planet, grid);
  return grid;
}

/** Find row/col of a number (1-based value). */
export function findCell(
  grid: number[][],
  value: number
): { row: number; col: number } | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === value) return { row: r, col: c };
    }
  }
  return null;
}

/** Read a zero-based row and column, returning undefined out of bounds. */
export function getKameaCell(
  planet: KameaPlanet,
  row: number,
  col: number
): number | undefined {
  return getKamea(planet)[row]?.[col];
}

export const cell = getKameaCell;
export const cellAt = getKameaCell;
