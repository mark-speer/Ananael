/**
 * I Ching hexagram SVG — yang/yin bars with changing-line marks.
 * Lines are ordered bottom → top (index 0 = first / bottom line).
 */

import {
  isChanging,
  isYang,
  type LineValue,
} from '../iching';
import {
  GLYPH_GOLD,
  GLYPH_MUTED,
  ICHING_VIEW,
  wrapSvgDocument,
} from './theme';

const LINE_LABELS: Record<LineValue, string> = {
  6: 'Old Yin',
  7: 'Young Yang',
  8: 'Young Yin',
  9: 'Old Yang',
};

export function lineLabel(value: LineValue): string {
  return LINE_LABELS[value];
}

/** Inner markup (no root svg). Displayed top line first. */
export function hexagramInnerMarkup(lines: LineValue[]): string {
  const topFirst = [...lines].reverse();
  const left = 12;
  const fullW = 100;
  const halfW = 44;
  const gap = 12;
  const barH = 10;
  const startY = 14;
  const step = 22;

  const parts: string[] = [];

  topFirst.forEach((line, visualIndex) => {
    const bottomIndex = 5 - visualIndex;
    const y = startY + visualIndex * step;
    const changing = isChanging(line);
    const yang = isYang(line);
    const fill = changing ? GLYPH_GOLD : GLYPH_MUTED;
    const title = `Line ${bottomIndex + 1}: ${lineLabel(line)}`;

    parts.push(`  <g data-line="${bottomIndex + 1}">`);
    parts.push(`    <title>${title}</title>`);

    if (yang) {
      parts.push(
        `    <rect x="${left}" y="${y}" width="${fullW}" height="${barH}" rx="2" fill="${fill}"/>`
      );
    } else {
      parts.push(
        `    <rect x="${left}" y="${y}" width="${halfW}" height="${barH}" rx="2" fill="${fill}"/>`,
        `    <rect x="${left + halfW + gap}" y="${y}" width="${halfW}" height="${barH}" rx="2" fill="${fill}"/>`
      );
    }

    if (changing) {
      const markX = left + fullW + 8;
      const markY = y + barH / 2 + 4;
      parts.push(
        `    <text x="${markX}" y="${markY}" fill="${GLYPH_GOLD}" font-family="system-ui, sans-serif" font-size="14" font-weight="600">×</text>`
      );
    }

    parts.push(`  </g>`);
  });

  return parts.join('\n');
}

/** Full SVG document for export / data URLs. */
export function hexagramSvgDocument(lines: LineValue[]): string {
  return wrapSvgDocument(
    ICHING_VIEW.w,
    ICHING_VIEW.h,
    hexagramInnerMarkup(lines)
  );
}
