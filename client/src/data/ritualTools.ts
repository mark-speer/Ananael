/**
 * Ritual Space Planner — tool palette, grid geometry, and layout templates.
 */

export type RitualToolType =
  | 'candle'
  | 'cup'
  | 'blade'
  | 'incense'
  | 'quarter';

export type QuarterLabel = 'N' | 'E' | 'S' | 'W';

export interface RitualItem {
  id: string;
  type: RitualToolType;
  /** Grid cell column (0-indexed). */
  x: number;
  /** Grid cell row (0-indexed). */
  y: number;
  /** Degrees clockwise; optional. */
  rotation?: number;
  /** For quarters: N/E/S/W; optional display label otherwise. */
  label?: string;
}

export interface RitualLayoutDocument {
  name: string;
  items: RitualItem[];
  showCompass: boolean;
  notes?: string;
}

/** Grid size in cells. */
export const GRID_COLS = 25;
export const GRID_ROWS = 25;
/** Pixel size of one cell in SVG user units. */
export const CELL_SIZE = 28;
export const GRID_WIDTH = GRID_COLS * CELL_SIZE;
export const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;
export const SVG_VIEWBOX = `0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`;

export const RITUAL_TOOL_TYPES: RitualToolType[] = [
  'candle',
  'cup',
  'blade',
  'incense',
  'quarter',
];

export const TOOL_LABELS: Record<RitualToolType, string> = {
  candle: 'Candle',
  cup: 'Cup',
  blade: 'Blade',
  incense: 'Incense',
  quarter: 'Quarter',
};

export const QUARTER_CYCLE: QuarterLabel[] = ['N', 'E', 'S', 'W'];

export type TemplateId = 'blank' | 'lbrp' | 'altarCross';

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  blank: 'Blank',
  lbrp: 'LBRP Circle',
  altarCross: 'Altar Cross',
};

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Snap a pixel coordinate (relative to SVG) to a grid cell index. */
export function snapToCell(px: number, max: number): number {
  const cell = Math.floor(px / CELL_SIZE);
  return Math.max(0, Math.min(max - 1, cell));
}

export function cellCenter(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: x * CELL_SIZE + CELL_SIZE / 2,
    cy: y * CELL_SIZE + CELL_SIZE / 2,
  };
}

/** Pixel center of the template/center cell (floor(n/2)); equals geometric mid on odd grids. */
export function gridCenterPx(): { cx: number; cy: number } {
  return cellCenter(Math.floor(GRID_COLS / 2), Math.floor(GRID_ROWS / 2));
}

export function createItem(
  type: RitualToolType,
  x: number,
  y: number,
  label?: string
): RitualItem {
  const item: RitualItem = {
    id: uid(type),
    type,
    x: Math.max(0, Math.min(GRID_COLS - 1, x)),
    y: Math.max(0, Math.min(GRID_ROWS - 1, y)),
  };
  if (type === 'quarter') {
    item.label = (label as QuarterLabel) || 'N';
  } else if (label) {
    item.label = label;
  }
  return item;
}

/** Empty layout. */
export function blankTemplate(): RitualItem[] {
  return [];
}

/**
 * LBRP-style circle: four quarter markers at cardinal points around center.
 * Circle itself is drawn by the module when this template is active / as overlay.
 */
export function lbrpTemplate(): RitualItem[] {
  const cx = Math.floor(GRID_COLS / 2);
  const cy = Math.floor(GRID_ROWS / 2);
  const r = 8;
  return [
    createItem('quarter', cx, cy - r, 'N'),
    createItem('quarter', cx + r, cy, 'E'),
    createItem('quarter', cx, cy + r, 'S'),
    createItem('quarter', cx - r, cy, 'W'),
  ];
}

/**
 * Classic altar cross: blade (E), cup (W), candle (S), incense (N) around center.
 */
export function altarCrossTemplate(): RitualItem[] {
  const cx = Math.floor(GRID_COLS / 2);
  const cy = Math.floor(GRID_ROWS / 2);
  return [
    createItem('incense', cx, cy - 3),
    createItem('blade', cx + 3, cy),
    createItem('candle', cx, cy + 3),
    createItem('cup', cx - 3, cy),
  ];
}

export function applyTemplate(id: TemplateId): RitualItem[] {
  switch (id) {
    case 'lbrp':
      return lbrpTemplate();
    case 'altarCross':
      return altarCrossTemplate();
    case 'blank':
    default:
      return blankTemplate();
  }
}

/** Whether the LBRP circle overlay should be drawn (quarters at cardinals). */
export function shouldShowCircle(items: RitualItem[]): boolean {
  const quarters = items.filter((i) => i.type === 'quarter');
  if (quarters.length < 4) return false;
  const labels = new Set(quarters.map((q) => q.label));
  return (
    labels.has('N') && labels.has('E') && labels.has('S') && labels.has('W')
  );
}

export function nextQuarterLabel(current?: string): QuarterLabel {
  const idx = QUARTER_CYCLE.indexOf(current as QuarterLabel);
  if (idx < 0) return 'N';
  return QUARTER_CYCLE[(idx + 1) % QUARTER_CYCLE.length];
}

export function isValidToolType(t: unknown): t is RitualToolType {
  return (
    typeof t === 'string' &&
    (RITUAL_TOOL_TYPES as string[]).includes(t)
  );
}

export function sanitizeItems(raw: unknown): RitualItem[] {
  if (!Array.isArray(raw)) return [];
  const out: RitualItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (!isValidToolType(e.type)) continue;
    if (typeof e.x !== 'number' || typeof e.y !== 'number') continue;
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
    const id =
      typeof e.id === 'string' && e.id.trim()
        ? e.id.trim().slice(0, 64)
        : uid(e.type);
    const item: RitualItem = {
      id,
      type: e.type,
      x: Math.max(0, Math.min(GRID_COLS - 1, Math.round(e.x))),
      y: Math.max(0, Math.min(GRID_ROWS - 1, Math.round(e.y))),
    };
    if (typeof e.rotation === 'number' && Number.isFinite(e.rotation)) {
      item.rotation = e.rotation % 360;
    }
    if (typeof e.label === 'string' && e.label.trim()) {
      item.label = e.label.trim().slice(0, 32);
    }
    out.push(item);
    if (out.length >= 200) break;
  }
  return out;
}
