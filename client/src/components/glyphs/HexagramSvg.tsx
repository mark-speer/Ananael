import { hexagramInnerMarkup, ICHING_VIEW } from '../../lib/glyphs';
import type { LineValue } from '../../lib/iching';

interface HexagramSvgProps {
  lines: LineValue[];
  className?: string;
}

/** Inline SVG I Ching hexagram (Phase 40). */
export default function HexagramSvg({
  lines,
  className = 'h-40 w-36',
}: HexagramSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${ICHING_VIEW.w} ${ICHING_VIEW.h}`}
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: hexagramInnerMarkup(lines),
      }}
    />
  );
}
