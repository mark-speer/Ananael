import { RUNE_VIEW, runeInnerMarkup } from '../../lib/glyphs';

interface RuneSvgProps {
  runeId: string;
  reversed?: boolean;
  className?: string;
}

/** Inline SVG Elder Futhark rune (Phase 40). */
export default function RuneSvg({
  runeId,
  reversed = false,
  className = 'h-28 w-20',
}: RuneSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${RUNE_VIEW.w} ${RUNE_VIEW.h}`}
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: runeInnerMarkup(runeId, { reversed }),
      }}
    />
  );
}
