import { useEffect, useRef } from 'react';
import type { SkySnapshot } from '../lib/celestialEphemeris';
import type { PlanetaryHoursChart } from '../lib/planetaryHours';
import SkyDisc from './SkyDisc';

interface SkyDiscModalProps {
  open: boolean;
  onClose: () => void;
  snapshot: SkySnapshot;
  hours?: PlanetaryHoursChart | null;
}

/**
 * Lightbox for the Magical OS sky disc — enlarged horizon map without leaving the dashboard.
 */
export default function SkyDiscModal({
  open,
  onClose,
  snapshot,
  hours,
}: SkyDiscModalProps) {
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
        aria-label="Close sky disc dialog"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sky-disc-modal-title"
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-[min(90vw,36rem)] flex-col overflow-y-auto rounded-lg border border-ananael-border bg-ananael-panel p-5 shadow-lg outline-none"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="sky-disc-modal-title"
            className="font-display text-lg text-ananael-gold"
          >
            Sky disc
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-ananael-muted transition hover:text-zinc-200"
          >
            Close
          </button>
        </div>
        <SkyDisc
          snapshot={snapshot}
          hours={hours}
          className="mx-auto aspect-square h-auto w-full"
        />
      </div>
    </div>
  );
}
