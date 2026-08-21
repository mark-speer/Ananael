import type { TarotCardData } from '../data/tarotDeck';
import {
  getTarotCardImageUrl,
  type DeckStyle,
} from '../data/tarotDeckArt';

export interface DealtCard {
  card: TarotCardData;
  isReversed: boolean;
  position: string;
  isFlipped: boolean;
}

interface TarotCardProps {
  dealt: DealtCard;
  onFlip: () => void;
  deckStyle: DeckStyle;
  /** Narrower card for dense spreads like Celtic Cross. */
  size?: 'default' | 'compact';
  /** Rotate the card shell 90° (crossing Challenge over Present). */
  crossing?: boolean;
  /** Omit the under-card meaning paragraph (e.g. when meanings are listed below the board). */
  hideMeaning?: boolean;
  /** Omit the position label above the card. */
  hideLabel?: boolean;
}

/**
 * Single tarot card with a CSS 3D flip. Face-down until clicked.
 * Reversed cards render the face rotated 180° after flip.
 */
export default function TarotCard({
  dealt,
  onFlip,
  deckStyle,
  size = 'default',
  crossing = false,
  hideMeaning = false,
  hideLabel = false,
}: TarotCardProps) {
  const { card, isReversed, position, isFlipped } = dealt;
  const meaning = isReversed ? card.reversed : card.upright;
  const imageUrl =
    deckStyle === 'rider-waite-smith'
      ? getTarotCardImageUrl(card.id)
      : undefined;
  const compact = size === 'compact';
  const cardHeight = compact ? 'h-[140px] sm:h-[170px]' : 'h-[220px]';
  const cardWidth = compact
    ? 'w-[88px] sm:w-[110px]'
    : 'w-[120px] sm:w-[140px] md:w-[160px]';

  const faces = (
    <div
      className={['card-flip relative h-full w-full', isFlipped ? 'is-flipped' : ''].join(
        ' '
      )}
    >
      {/* Face down */}
      <div className="card-face absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-ananael-gold/40 bg-gradient-to-br from-ananael-violet-deep via-ananael-surface to-ananael-bg shadow-glow">
        <div className="flex h-[85%] w-[80%] items-center justify-center rounded border border-ananael-gold/30">
          <span
            className={[
              'font-display text-ananael-gold/80',
              compact ? 'text-2xl' : 'text-3xl',
            ].join(' ')}
          >
            ✦
          </span>
        </div>
      </div>

      {/* Face up */}
      <div className="card-face card-face-back absolute inset-0 overflow-hidden rounded-lg border border-ananael-bronze/50 bg-ananael-panel shadow-gold">
        {imageUrl ? (
          <div
            className={[
              'relative h-full w-full',
              isReversed ? 'card-reversed' : '',
            ].join(' ')}
          >
            <img
              src={imageUrl}
              alt={card.name}
              className="h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ananael-bg/90 via-ananael-bg/50 to-transparent px-2 pb-2 pt-6">
              <p
                className={[
                  'font-display text-center leading-tight text-ananael-gold',
                  compact ? 'text-[10px]' : 'text-xs',
                ].join(' ')}
              >
                {card.name}
              </p>
              {isReversed && (
                <p className="mt-0.5 text-center text-[10px] uppercase tracking-wider text-ananael-bronze">
                  Reversed
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            className={[
              'flex h-full flex-col p-3',
              isReversed ? 'card-reversed' : '',
            ].join(' ')}
          >
            <p
              className={[
                'font-display text-center leading-tight text-ananael-gold',
                compact ? 'text-xs' : 'text-sm',
              ].join(' ')}
            >
              {card.name}
            </p>
            <div className="my-2 flex flex-1 items-center justify-center">
              <span
                className={[
                  'text-ananael-violet',
                  compact ? 'text-3xl' : 'text-4xl',
                ].join(' ')}
              >
                {arcanaGlyph(card.arcana)}
              </span>
            </div>
            {isReversed && (
              <p className="text-center text-[10px] uppercase tracking-wider text-ananael-bronze">
                Reversed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const ariaLabel = isFlipped
    ? `${card.name}${isReversed ? ' (reversed)' : ''}`
    : `Reveal card for ${position}`;

  /**
   * Crossing cards: hit target matches the visible horizontal band.
   * Rotating the button itself left a tall untransformed hit box that covered Present.
   */
  const shell = crossing ? (
    <button
      type="button"
      onClick={onFlip}
      aria-label={ariaLabel}
      className="relative h-[88px] w-[140px] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ananael-gold sm:h-[110px] sm:w-[170px]"
    >
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 ${cardHeight} w-[88px] -translate-x-1/2 -translate-y-1/2 rotate-90 sm:w-[110px]`}
      >
        <div className="perspective h-full w-full">{faces}</div>
      </div>
    </button>
  ) : (
    <button
      type="button"
      onClick={onFlip}
      aria-label={ariaLabel}
      className={[
        'perspective w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ananael-gold',
        cardHeight,
      ].join(' ')}
    >
      {faces}
    </button>
  );

  const outerWidth = crossing ? 'w-[140px] sm:w-[170px]' : cardWidth;

  return (
    <div className={['flex flex-col items-center gap-2', outerWidth].join(' ')}>
      {!hideLabel && (
        <p className="text-center text-[11px] uppercase tracking-[0.15em] text-ananael-muted">
          {position}
        </p>
      )}

      {shell}

      {!hideMeaning && isFlipped && (
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
