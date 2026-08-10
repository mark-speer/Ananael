interface AnanaelWordmarkProps {
  className?: string;
}

/**
 * Brand wordmark: triangle-and-circle mark as the first “A”, then “nanael”.
 * Inherits display font, color, weight, and size from the parent.
 */
export default function AnanaelWordmark({ className }: AnanaelWordmarkProps) {
  return (
    <span
      className={['inline-flex items-center gap-[0.06em]', className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Ananael"
    >
      <svg
        aria-hidden
        className="relative top-[0.02em] h-[0.92em] w-[0.92em] shrink-0"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M16 4 L28 28 H4 Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="16"
          cy="18"
          r="3"
          stroke="#7c3aed"
          strokeWidth="1.5"
        />
      </svg>
      <span aria-hidden>nanael</span>
    </span>
  );
}
