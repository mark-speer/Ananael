import { useAuth } from '../context/AuthContext';

interface AccountButtonProps {
  expanded: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Profile-style trigger: initials circle + username, or "account" when logged out.
 */
export default function AccountButton({
  expanded,
  onClick,
  className = '',
}: AccountButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const label = isAuthenticated && user ? user.username : 'account';
  const initial =
    isAuthenticated && user ? user.username.charAt(0).toUpperCase() : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className={[
        'flex max-w-full items-center gap-3 rounded-md px-2 py-2 text-left transition',
        'text-zinc-300 hover:bg-ananael-panel hover:text-ananael-gold',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium',
          isAuthenticated
            ? 'bg-ananael-violet/40 text-ananael-gold'
            : 'border border-ananael-border bg-ananael-bg text-ananael-muted',
        ].join(' ')}
        aria-hidden
      >
        {initial ?? (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path
              strokeLinecap="round"
              d="M5.5 19.5c1.5-3.5 4-5 6.5-5s5 1.5 6.5 5"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0 truncate text-sm font-medium">{label}</span>
    </button>
  );
}
