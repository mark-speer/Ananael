import type { TarotCardData } from '../data/tarotDeck';

export interface DealtCard {
  card: TarotCardData;
  isReversed: boolean;
  position: string;
  isFlipped: boolean;
}

interface TarotCardProps {
  dealt: DealtCard;
  onFlip: () => void;
}

/**
 * Single tarot card with a CSS 3D flip. Face-down until clicked.
 * Reversed cards render the face rotated 180° after flip.
 */
export default function TarotCard({ dealt, onFlip }: TarotCardProps) {
  const { card, isReversed, position, isFlipped } = dealt;
  const meaning = isReversed ? card.reversed : card.upright;

  return (
    <div className="flex w-[140px] flex-col items-center gap-2 sm:w-[160px]">
      <p className="text-center text-[11px] uppercase tracking-[0.15em] text-ananael-muted">
        {position}
      </p>

      <button
        type="button"
        onClick={onFlip}
        aria-label={
          isFlipped
            ? `${card.name}${isReversed ? ' (reversed)' : ''}`
            : `Reveal card for ${position}`
        }
        className="perspective h-[220px] w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ananael-gold"
      >
        <div
          className={['card-flip relative h-full w-full', isFlipped ? 'is-flipped' : ''].join(
            ' '
          )}
        >
          {/* Face down */}
          <div className="card-face absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-ananael-gold/40 bg-gradient-to-br from-ananael-violet-deep via-ananael-surface to-ananael-bg shadow-glow">
            <div className="flex h-[85%] w-[80%] items-center justify-center rounded border border-ananael-gold/30">
              <span className="font-display text-3xl text-ananael-gold/80">✦</span>
            </div>
          </div>

          {/* Face up */}
          <div className="card-face card-face-back absolute inset-0 overflow-hidden rounded-lg border border-ananael-bronze/50 bg-ananael-panel shadow-gold">
            <div
              className={[
                'flex h-full flex-col p-3',
                isReversed ? 'card-reversed' : '',
              ].join(' ')}
            >
              <p className="font-display text-center text-sm leading-tight text-ananael-gold">
                {card.name}
              </p>
              <div className="my-2 flex flex-1 items-center justify-center">
                <span className="text-4xl text-ananael-violet">
                  {arcanaGlyph(card.arcana)}
                </span>
              </div>
              {isReversed && (
                <p className="text-center text-[10px] uppercase tracking-wider text-ananael-bronze">
                  Reversed
                </p>
              )}
            </div>
          </div>
        </div>
      </button>

      {isFlipped && (
        <p className="min-h-[3.5rem] text-center text-xs leading-relaxed text-zinc-400">
          {meaning}
        </p>
      )}
    </div>
  );
}

function arcanaGlyph(arcana: TarotCardData['arcana']): string {
  switch (arcana) {
    case 'major':
      return '☉';
    case 'wands':
      return '🜂';
    case 'cups':
      return '🜄';
    case 'swords':
      return '⚔';
    case 'pentacles':
      return '🜃';
    default:
      return '✦';
  }
}
