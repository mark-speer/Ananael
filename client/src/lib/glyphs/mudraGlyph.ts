/**
 * Schematic hasta / iconographic mudra glyphs — study silhouettes, not instruction.
 */

import type { MudraId } from '../../data/mudras';
import { GLYPH_GOLD, GLYPH_GOLD_DIM, GLYPH_MUTED, wrapSvgDocument } from './theme';

export const MUDRA_VIEW = { w: 240, h: 200 } as const;

type DigitPose = 'extend' | 'fold' | 'toThumb' | 'pressBase';
type ThumbPose =
  | 'out'
  | 'toIndex'
  | 'toMiddle'
  | 'toRing'
  | 'toLittle'
  | 'tucked'
  | 'pressRing'
  | 'pressIndex';

interface HandSpec {
  side: 'left' | 'right';
  facing: 'palm' | 'back';
  /** Finger direction from palm. */
  direction: 'up' | 'down';
  thumb: ThumbPose;
  index: DigitPose;
  middle: DigitPose;
  ring: DigitPose;
  little: DigitPose;
  cx: number;
  cy: number;
  scale?: number;
}

const SW = 6.2;
const PALM_SW = 1.7;

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width = SW,
  color = GLYPH_GOLD
): string {
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color = GLYPH_GOLD_DIM
): string {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${PALM_SW}"/>`;
}

function drawHand(h: HandSpec): string {
  const s = h.scale ?? 1;
  const flip = h.side === 'left' ? -1 : 1;
  const along = h.direction === 'up' ? -1 : 1;
  const { cx, cy } = h;
  const kx = (dx: number) => cx + flip * dx * s;
  const ky = (dy: number) => cy + along * dy * s;

  const thumbStart = { x: kx(22), y: ky(-4) };
  const thumbTips: Record<ThumbPose, { x: number; y: number }> = {
    out: { x: kx(44), y: ky(32) },
    toIndex: { x: kx(22), y: ky(48) },
    toMiddle: { x: kx(10), y: ky(50) },
    toRing: { x: kx(-4), y: ky(46) },
    toLittle: { x: kx(-18), y: ky(42) },
    tucked: { x: kx(6), y: ky(-12) },
    pressRing: { x: kx(-6), y: ky(8) },
    pressIndex: { x: kx(18), y: ky(6) },
  };
  const thumbTip = thumbTips[h.thumb];

  const knuckle = 30;
  const tipExtend = 78;
  const tipFold = 10;
  const bases = { little: -28, ring: -10, middle: 8, index: 26 };

  const endFor = (pose: DigitPose, baseX: number): { x: number; y: number } => {
    if (pose === 'extend') return { x: kx(baseX * 1.02), y: ky(tipExtend) };
    if (pose === 'fold') return { x: kx(baseX * 0.35), y: ky(tipFold) };
    if (pose === 'pressBase') return { x: kx(16), y: ky(-8) };
    return { x: thumbTip.x, y: thumbTip.y };
  };

  const palm = ellipse(cx, cy, 26 * s, 34 * s);
  const wrist = line(kx(0), ky(-36), kx(0), ky(-54), 5, GLYPH_GOLD_DIM);

  let knuckles = '';
  if (h.facing === 'back') {
    knuckles = [bases.little, bases.ring, bases.middle, bases.index]
      .map(
        (bx) =>
          `<circle cx="${kx(bx).toFixed(1)}" cy="${ky(22).toFixed(1)}" r="${(2.2 * s).toFixed(1)}" fill="none" stroke="${GLYPH_MUTED}" stroke-width="1"/>`
      )
      .join('');
  } else {
    knuckles = ellipse(cx, cy, 14 * s, 18 * s, GLYPH_MUTED);
  }

  const digits = (
    [
      ['little', h.little, bases.little],
      ['ring', h.ring, bases.ring],
      ['middle', h.middle, bases.middle],
      ['index', h.index, bases.index],
    ] as const
  )
    .map(([, pose, baseX]) => {
      const end = endFor(pose, baseX);
      return line(kx(baseX), ky(knuckle), end.x, end.y);
    })
    .join('');

  const thumb = line(thumbStart.x, thumbStart.y, thumbTip.x, thumbTip.y, SW * 0.95);

  return `${wrist}${palm}${knuckles}${digits}${thumb}`;
}

const EXTEND: Pick<HandSpec, 'index' | 'middle' | 'ring' | 'little'> = {
  index: 'extend',
  middle: 'extend',
  ring: 'extend',
  little: 'extend',
};

function gyanLike(
  facing: 'palm' | 'back',
  leftCx: number,
  rightCx: number
): string {
  const common = {
    direction: 'up' as const,
    thumb: 'toIndex' as const,
    index: 'toThumb' as DigitPose,
    middle: 'extend' as DigitPose,
    ring: 'extend' as DigitPose,
    little: 'extend' as DigitPose,
    cy: 118,
    scale: 0.82,
    facing,
  };
  return (
    drawHand({ ...common, side: 'left', cx: leftCx, thumb: 'toIndex' }) +
    drawHand({ ...common, side: 'right', cx: rightCx })
  );
}

function oneFingerToThumb(
  digit: 'index' | 'middle' | 'ring' | 'little',
  cx = 120
): string {
  const poses: Pick<HandSpec, 'index' | 'middle' | 'ring' | 'little' | 'thumb'> =
    {
      ...EXTEND,
      thumb:
        digit === 'index'
          ? 'toIndex'
          : digit === 'middle'
            ? 'toMiddle'
            : digit === 'ring'
              ? 'toRing'
              : 'toLittle',
      index: digit === 'index' ? 'toThumb' : 'extend',
      middle: digit === 'middle' ? 'toThumb' : 'extend',
      ring: digit === 'ring' ? 'toThumb' : 'extend',
      little: digit === 'little' ? 'toThumb' : 'extend',
    };
  return (
    drawHand({
      side: 'left',
      facing: 'palm',
      direction: 'up',
      cx: cx - 48,
      cy: 118,
      scale: 0.82,
      ...poses,
    }) +
    drawHand({
      side: 'right',
      facing: 'palm',
      direction: 'up',
      cx: cx + 48,
      cy: 118,
      scale: 0.82,
      ...poses,
    })
  );
}

function groundLine(): string {
  return line(48, 178, 192, 178, 1.2, GLYPH_MUTED);
}

function mudraMarkup(id: MudraId): string {
  switch (id) {
    case 'gyan':
      return gyanLike('palm', 72, 168);
    case 'chin':
      return gyanLike('back', 72, 168);
    case 'anjali':
      return (
        drawHand({
          side: 'left',
          facing: 'back',
          direction: 'up',
          thumb: 'out',
          ...EXTEND,
          cx: 102,
          cy: 112,
          scale: 0.88,
        }) +
        drawHand({
          side: 'right',
          facing: 'back',
          direction: 'up',
          thumb: 'out',
          ...EXTEND,
          cx: 138,
          cy: 112,
          scale: 0.88,
        })
      );
    case 'vishnu':
      return drawHand({
        side: 'right',
        facing: 'palm',
        direction: 'up',
        thumb: 'out',
        index: 'fold',
        middle: 'fold',
        ring: 'extend',
        little: 'extend',
        cx: 120,
        cy: 112,
      });
    case 'dhyana':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toIndex',
          index: 'extend',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 108,
          cy: 128,
          scale: 0.9,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'toIndex',
          index: 'extend',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 132,
          cy: 112,
          scale: 0.9,
        })
      );
    case 'prana':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toRing',
          index: 'extend',
          middle: 'extend',
          ring: 'toThumb',
          little: 'toThumb',
          cx: 72,
          cy: 118,
          scale: 0.82,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'toRing',
          index: 'extend',
          middle: 'extend',
          ring: 'toThumb',
          little: 'toThumb',
          cx: 168,
          cy: 118,
          scale: 0.82,
        })
      );
    case 'apana':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toMiddle',
          index: 'extend',
          middle: 'toThumb',
          ring: 'toThumb',
          little: 'extend',
          cx: 72,
          cy: 118,
          scale: 0.82,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'toMiddle',
          index: 'extend',
          middle: 'toThumb',
          ring: 'toThumb',
          little: 'extend',
          cx: 168,
          cy: 118,
          scale: 0.82,
        })
      );
    case 'apana-vayu':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toMiddle',
          index: 'pressBase',
          middle: 'toThumb',
          ring: 'toThumb',
          little: 'extend',
          cx: 72,
          cy: 118,
          scale: 0.82,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'toMiddle',
          index: 'pressBase',
          middle: 'toThumb',
          ring: 'toThumb',
          little: 'extend',
          cx: 168,
          cy: 118,
          scale: 0.82,
        })
      );
    case 'yoni':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'down',
          thumb: 'toIndex',
          index: 'toThumb',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 92,
          cy: 88,
          scale: 0.85,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'down',
          thumb: 'toIndex',
          index: 'toThumb',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 148,
          cy: 88,
          scale: 0.85,
        })
      );
    case 'linga':
      return (
        drawHand({
          side: 'left',
          facing: 'back',
          direction: 'up',
          thumb: 'tucked',
          index: 'fold',
          middle: 'fold',
          ring: 'fold',
          little: 'fold',
          cx: 102,
          cy: 118,
          scale: 0.88,
        }) +
        drawHand({
          side: 'right',
          facing: 'back',
          direction: 'up',
          thumb: 'out',
          index: 'fold',
          middle: 'fold',
          ring: 'fold',
          little: 'fold',
          cx: 138,
          cy: 118,
          scale: 0.88,
        })
      );
    case 'shuni':
      return oneFingerToThumb('middle');
    case 'surya':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'pressRing',
          index: 'extend',
          middle: 'extend',
          ring: 'pressBase',
          little: 'extend',
          cx: 72,
          cy: 118,
          scale: 0.82,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'pressRing',
          index: 'extend',
          middle: 'extend',
          ring: 'pressBase',
          little: 'extend',
          cx: 168,
          cy: 118,
          scale: 0.82,
        })
      );
    case 'buddhi':
      return oneFingerToThumb('little');
    case 'prithvi':
      return oneFingerToThumb('ring');
    case 'varun':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toLittle',
          index: 'extend',
          middle: 'extend',
          ring: 'extend',
          little: 'toThumb',
          cx: 78,
          cy: 112,
          scale: 0.78,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'toLittle',
          index: 'extend',
          middle: 'extend',
          ring: 'extend',
          little: 'toThumb',
          cx: 162,
          cy: 112,
          scale: 0.78,
        }) +
        `<path d="M110 168 C120 178 120 178 130 168" fill="none" stroke="${GLYPH_MUTED}" stroke-width="1.2" stroke-linecap="round"/>`
      );
    case 'vayu':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'pressIndex',
          index: 'pressBase',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 72,
          cy: 118,
          scale: 0.82,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'pressIndex',
          index: 'pressBase',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 168,
          cy: 118,
          scale: 0.82,
        })
      );
    case 'hakini':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'out',
          index: 'extend',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 78,
          cy: 120,
          scale: 0.8,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'out',
          index: 'extend',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 162,
          cy: 120,
          scale: 0.8,
        }) +
        line(108, 52, 132, 52, 1.4, GLYPH_GOLD_DIM)
      );
    case 'adi':
      return (
        drawHand({
          side: 'left',
          facing: 'back',
          direction: 'up',
          thumb: 'tucked',
          index: 'fold',
          middle: 'fold',
          ring: 'fold',
          little: 'fold',
          cx: 72,
          cy: 118,
          scale: 0.82,
        }) +
        drawHand({
          side: 'right',
          facing: 'back',
          direction: 'up',
          thumb: 'tucked',
          index: 'fold',
          middle: 'fold',
          ring: 'fold',
          little: 'fold',
          cx: 168,
          cy: 118,
          scale: 0.82,
        })
      );
    case 'abhaya':
      return drawHand({
        side: 'right',
        facing: 'palm',
        direction: 'up',
        thumb: 'out',
        ...EXTEND,
        cx: 120,
        cy: 108,
      });
    case 'bhumisparsha':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toIndex',
          ...EXTEND,
          cx: 78,
          cy: 108,
          scale: 0.78,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'down',
          thumb: 'out',
          ...EXTEND,
          cx: 158,
          cy: 88,
          scale: 0.82,
        }) +
        groundLine()
      );
    case 'dharmachakra':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'up',
          thumb: 'toIndex',
          index: 'toThumb',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 88,
          cy: 112,
          scale: 0.8,
        }) +
        drawHand({
          side: 'right',
          facing: 'palm',
          direction: 'up',
          thumb: 'toIndex',
          index: 'toThumb',
          middle: 'extend',
          ring: 'extend',
          little: 'extend',
          cx: 152,
          cy: 112,
          scale: 0.8,
        })
      );
    case 'varada':
      return (
        drawHand({
          side: 'left',
          facing: 'palm',
          direction: 'down',
          thumb: 'out',
          ...EXTEND,
          cx: 120,
          cy: 78,
        }) + groundLine()
      );
    case 'vitarka':
      return drawHand({
        side: 'right',
        facing: 'palm',
        direction: 'up',
        thumb: 'toIndex',
        index: 'toThumb',
        middle: 'extend',
        ring: 'extend',
        little: 'extend',
        cx: 120,
        cy: 108,
      });
    case 'uttarabodhi':
      return (
        drawHand({
          side: 'left',
          facing: 'back',
          direction: 'up',
          thumb: 'tucked',
          index: 'extend',
          middle: 'fold',
          ring: 'fold',
          little: 'fold',
          cx: 104,
          cy: 118,
          scale: 0.88,
        }) +
        drawHand({
          side: 'right',
          facing: 'back',
          direction: 'up',
          thumb: 'tucked',
          index: 'extend',
          middle: 'fold',
          ring: 'fold',
          little: 'fold',
          cx: 136,
          cy: 118,
          scale: 0.88,
        })
      );
    case 'karana':
      return drawHand({
        side: 'right',
        facing: 'palm',
        direction: 'up',
        thumb: 'pressIndex',
        index: 'extend',
        middle: 'fold',
        ring: 'fold',
        little: 'extend',
        cx: 120,
        cy: 108,
      });
  }
}

export function mudraInnerMarkup(id: MudraId): string {
  return mudraMarkup(id);
}

export function mudraSvgDocument(id: MudraId): string {
  return wrapSvgDocument(MUDRA_VIEW.w, MUDRA_VIEW.h, mudraInnerMarkup(id));
}
