/**
 * Simplified public-domain–style Goetia seal line art.
 * Deterministic geometry keyed by spirit number — not plate-accurate Mathers scans.
 * Asset files under public/assets/Images/Goetia/{sealRef}.svg use the same markup.
 */

import type { GoetiaSpirit } from '../data/arsGoetia';

const VIEW = 200;
const CX = 100;
const CY = 100;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function regularPolygon(
  n: number,
  r: number,
  rotDeg: number
): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = polar(CX, CY, r, rotDeg + (360 / n) * i);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(' ');
}

function starPolygon(points: number, rOuter: number, rInner: number, rot: number) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const p = polar(CX, CY, r, rot + (180 / points) * i);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Full SVG document for writing to disk / data URLs. */
export function goetiaSealSvgDocument(spirit: GoetiaSpirit): string {
  const body = goetiaSealInnerMarkup(spirit);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" fill="none">
${body}
</svg>
`;
}

/** Inner markup (no root svg) for embedding in the circle preview. */
export function goetiaSealInnerMarkup(spirit: GoetiaSpirit): string {
  const rnd = mulberry32(spirit.number * 2654435761);
  const sides = 3 + (spirit.number % 5); // 3–7
  const rot = Math.floor(rnd() * 60);
  const rOuter = 78;
  const rMid = 58 + Math.floor(rnd() * 8);
  const rInner = 28 + Math.floor(rnd() * 12);
  const useStar = spirit.number % 3 !== 0;
  const spokeCount = 4 + (spirit.number % 5);
  const stroke = '#e8c547';
  const strokeDim = '#c4a035';

  const spokes: string[] = [];
  for (let i = 0; i < spokeCount; i++) {
    const a = rot + (360 / spokeCount) * i + Math.floor(rnd() * 12);
    const p1 = polar(CX, CY, 18, a);
    const p2 = polar(CX, CY, rMid - 4, a);
    spokes.push(
      `<line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" stroke="${strokeDim}" stroke-width="1.2"/>`
    );
  }

  const arcs: string[] = [];
  const arcN = 2 + (spirit.number % 3);
  for (let i = 0; i < arcN; i++) {
    const start = rot + i * (360 / arcN) + 10;
    const end = start + 40 + Math.floor(rnd() * 30);
    const r = 45 + i * 8;
    const a0 = polar(CX, CY, r, start);
    const a1 = polar(CX, CY, r, end);
    const large = end - start > 180 ? 1 : 0;
    arcs.push(
      `<path d="M ${a0.x.toFixed(2)} ${a0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${a1.x.toFixed(2)} ${a1.y.toFixed(2)}" stroke="${strokeDim}" stroke-width="1.1"/>`
    );
  }

  const poly = useStar
    ? `<polygon points="${starPolygon(sides, rMid, rInner, rot)}" stroke="${stroke}" stroke-width="1.6"/>`
    : `<polygon points="${regularPolygon(sides, rMid, rot)}" stroke="${stroke}" stroke-width="1.6"/>`;

  const dots: string[] = [];
  const dotN = 3 + (spirit.number % 4);
  for (let i = 0; i < dotN; i++) {
    const p = polar(CX, CY, rInner - 6, rot + (360 / dotN) * i * 1.7);
    dots.push(
      `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2.2" fill="${stroke}"/>`
    );
  }

  return `  <circle cx="${CX}" cy="${CY}" r="${rOuter}" stroke="${stroke}" stroke-width="2"/>
  <circle cx="${CX}" cy="${CY}" r="${rOuter - 6}" stroke="${strokeDim}" stroke-width="1"/>
  ${spokes.join('\n  ')}
  ${arcs.join('\n  ')}
  ${poly}
  <circle cx="${CX}" cy="${CY}" r="10" stroke="${stroke}" stroke-width="1.4"/>
  ${dots.join('\n  ')}
  <text x="${CX}" y="${CY + 4}" text-anchor="middle" fill="${stroke}" font-family="Cinzel, Georgia, serif" font-size="11">${spirit.number}</text>`;
}

export function goetiaSealAssetPath(sealRef: string): string {
  return `/assets/Images/Goetia/${sealRef}.svg`;
}
