import {
  GEOMANCY_VIEW,
  geomancyFigureInnerMarkup,
  type GeomancyGlyphInput,
} from '../../lib/glyphs';

interface GeomancyFigureSvgProps {
  figure: GeomancyGlyphInput;
  featured?: boolean;
  className?: string;
}

/** Inline SVG geomantic figure (Phase 40). */
export default function GeomancyFigureSvg({
  figure,
  featured = false,
  className = 'h-24 w-16',
}: GeomancyFigureSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${GEOMANCY_VIEW.w} ${GEOMANCY_VIEW.h}`}
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{
        __html: geomancyFigureInnerMarkup(figure, { featured }),
      }}
    />
  );
}
