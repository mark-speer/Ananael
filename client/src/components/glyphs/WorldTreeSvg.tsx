import { WORLD_TREE_VIEW, worldTreeInnerMarkup } from '../../lib/glyphs';

interface WorldTreeSvgProps {
  selectedId?: string;
  className?: string;
}

/** Inline SVG axis mundi (Phase 47). */
export default function WorldTreeSvg({
  selectedId,
  className = 'h-72 w-40',
}: WorldTreeSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${WORLD_TREE_VIEW.w} ${WORLD_TREE_VIEW.h}`}
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: worldTreeInnerMarkup(selectedId) }}
    />
  );
}
