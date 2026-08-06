import { useEffect, useRef } from 'react';
import AuthForms from './AuthForms';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Centered account dialog hosting login / register / signed-in controls.
 */
export default function AccountModal({ open, onClose }: AccountModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close account dialog"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-lg border border-ananael-border bg-ananael-panel p-5 shadow-lg outline-none"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="account-modal-title"
            className="font-display text-lg text-ananael-gold"
          >
            Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-ananael-muted transition hover:text-zinc-200"
          >
            Close
          </button>
        </div>
        <AuthForms onSuccess={onClose} />
      </div>
    </div>
  );
}
