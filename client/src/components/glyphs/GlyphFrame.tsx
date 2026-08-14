import type { ReactNode } from 'react';

interface GlyphFrameProps {
  children: ReactNode;
  /** Larger gold border for featured figures (e.g. geomancy Judge). */
  featured?: boolean;
  className?: string;
  label?: string;
}

/**
 * Modest framed card for Divination SVG glyphs.
 */
export default function GlyphFrame({
  children,
  featured = false,
  className = '',
  label,
}: GlyphFrameProps) {
  return (
    <div
      className={[
        'inline-flex flex-col items-center justify-center rounded-lg border bg-ananael-bg/80 px-3 py-3',
        featured
          ? 'border-ananael-gold/60 shadow-glow'
          : 'border-ananael-border/50',
        className,
      ].join(' ')}
    >
      {label && (
        <p className="mb-1 text-[9px] uppercase tracking-wider text-ananael-muted">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}
