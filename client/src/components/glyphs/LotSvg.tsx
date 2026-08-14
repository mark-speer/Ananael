import { LOT_VIEW, lotInnerMarkup } from '../../lib/glyphs';

interface LotSvgProps {
  lotId: string;
  className?: string;
}

/** Inline SVG cleromancy lot token (Phase 47). */
export default function LotSvg({
  lotId,
  className = 'h-16 w-16',
}: LotSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${LOT_VIEW.w} ${LOT_VIEW.h}`}
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: lotInnerMarkup(lotId) }}
    />
  );
}
