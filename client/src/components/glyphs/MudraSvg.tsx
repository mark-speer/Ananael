import { MUDRA_VIEW, mudraInnerMarkup } from '../../lib/glyphs';
import type { MudraId } from '../../data/mudras';

interface MudraSvgProps {
  mudraId: MudraId;
  className?: string;
  title?: string;
}

/** Inline schematic mudra glyph (study silhouette). */
export default function MudraSvg({
  mudraId,
  className = 'h-40 w-48',
  title,
}: MudraSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${MUDRA_VIEW.w} ${MUDRA_VIEW.h}`}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
      dangerouslySetInnerHTML={{ __html: mudraInnerMarkup(mudraId) }}
    />
  );
}
