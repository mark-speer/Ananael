import type { DirectionId } from '../../data/shamanism';
import {
  DIRECTION_WHEEL_VIEW,
  directionWheelInnerMarkup,
} from '../../lib/glyphs';

interface DirectionWheelSvgProps {
  directionIds: DirectionId[];
  selectedId?: string;
  className?: string;
}

/** Inline SVG direction wheel (Phase 47). */
export default function DirectionWheelSvg({
  directionIds,
  selectedId,
  className = 'h-56 w-56',
}: DirectionWheelSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${DIRECTION_WHEEL_VIEW.w} ${DIRECTION_WHEEL_VIEW.h}`}
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: directionWheelInnerMarkup(directionIds, selectedId),
      }}
    />
  );
}
