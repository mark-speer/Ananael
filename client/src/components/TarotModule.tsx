import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { shuffleDeck, TAROT_DECK } from '../data/tarotDeck';
import {
  loadDeckStyle,
  saveDeckStyle,
  type DeckStyle,
} from '../data/tarotDeckArt';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import {
  aggregateTarotHistory,
  summarizeReading,
  type HistoryReading,
  type MinorSuit,
} from '../lib/tarotSummary';
import type { ModuleId } from './Sidebar';
import TarotCard, { type DealtCard } from './TarotCard';

const SUIT_LABELS: Record<MinorSuit, string> = {
  cups: 'Cups',
  wands: 'Wands',
  swords: 'Swords',
  pentacles: 'Pentacles',
};

export type SpreadType = 'single' | 'three' | 'celtic' | 'horseshoe' | 'pyramid' | 'wheel' | 'diamond';

interface SpreadConfig {
  id: SpreadType;
  label: string;
  description: string;
  positions: string[];
}

const SPREADS: SpreadConfig[] = [
  {
    id: 'single',
    label: 'Single Card Draw',
    description: 'Daily Guidance',
    positions: ['Guidance'],
  },
  {
    id: 'three',
    label: 'Three-Card Spread',
    description: 'Past · Present · Future',
    positions: ['Past', 'Present', 'Future'],
  },
  {
    id: 'celtic',
    label: 'Celtic Cross',
    description: '10-card deep reading',
    positions: [
      'Present',
      'Challenge',
      'Foundation',
      'Recent Past',
      'Crown',
      'Near Future',
      'Self',
      'Environment',
      'Hopes & Fears',
      'Outcome',
    ],
  },
  {
    id: 'horseshoe',
    label: 'Horseshoe Spread',
    description: '7-card V-shaped layout',
    positions: [
      'Situation',
      'Obstacle',
      'Foundation',
      'Advice',
      'External Influence',
      'Near Future',
      'Outcome',
    ],
  },
  {
    id: 'pyramid',
    label: 'Pyramid Spread',
    description: '6-card foundation to peak',
    positions: [
      'Foundation',
      'Left Factor',
      'Right Factor',
      'Challenge',
      'Crowning Influence',
      'Outcome',
    ],
  },
  {
    id: 'wheel',
    label: 'Wheel of Year',
    description: '8-card seasonal cycle',
    positions: [
      'Spring',
      'Summer',
      'Autumn',
      'Winter',
      'Current Energy',
      'Challenge',
      'Gift',
      'Resolution',
    ],
  },
  {
    id: 'diamond',
    label: 'Diamond Spread',
    description: '5-card focused reflection',
    positions: [
      'Heart of the Matter',
      'Left perspective',
      'Right perspective',
      'Bridge',
      'Resolution',
    ],
  },
];

/** ~20% mathematical chance a dealt card is reversed. */
const REVERSAL_CHANCE = 0.2;

interface TarotModuleProps {
  /** When true, hide the standalone page header (used inside Divination portal). */
  embedded?: boolean;
  onNavigate?: (module: ModuleId, opts?: { filter?: 'divination' }) => void;
}

/**
 * Virtual Tarot module: spread selection, interactive board, save to Magical Journal.
 */
export default function TarotModule({
  embedded = false,
  onNavigate,
}: TarotModuleProps) {
  const { isAuthenticated } = useAuth();
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>(() => loadDeckStyle());
  const [dealt, setDealt] = useState<DealtCard[]>([]);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryReading[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const handleDeckStyleChange = (style: DeckStyle) => {
    setDeckStyle(style);
    saveDeckStyle(style);
  };

  const activeSpread = useMemo(
    () => SPREADS.find((s) => s.id === spreadType)!,
    [spreadType]
  );

  const flipped = useMemo(() => dealt.filter((d) => d.isFlipped), [dealt]);

  const historyAggregate = useMemo(
    () => aggregateTarotHistory(history),
    [history]
  );

  const readingSummary = useMemo(
    () =>
      flipped.length > 0
        ? summarizeReading(
            flipped,
            spreadType,
            historyLoaded ? historyAggregate : null
          )
        : null,
    [flipped, spreadType, historyLoaded, historyAggregate]
  );

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      setHistoryLoaded(false);
      return;
    }
    try {
      const res = await apiFetch('/api/tarot/history');
      const data = (await res.json()) as {
        readings?: HistoryReading[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load history');
      }
      setHistory(data.readings ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const drawCards = () => {
    setSaveStatus(null);
    const shuffled = shuffleDeck(TAROT_DECK);
    const next: DealtCard[] = activeSpread.positions.map((position, index) => ({
      card: shuffled[index],
      isReversed: Math.random() < REVERSAL_CHANCE,
      position,
      isFlipped: false,
    }));
    setDealt(next);
  };

  const flipCard = (index: number) => {
    setDealt((prev) =>
      prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
    );
  };

  const flipAll = () => {
    setDealt((prev) => prev.map((c) => ({ ...c, isFlipped: true })));
  };

  const saveReading = async () => {
    if (!isAuthenticated || dealt.length === 0) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      // Match live UI: summarize only flipped (revealed) cards.
      const revealed = dealt.filter((d) => d.isFlipped);
      const summaryText =
        revealed.length > 0
          ? summarizeReading(
              revealed,
              spreadType,
              historyLoaded ? historyAggregate : null
            ).text
          : undefined;
      const res = await apiFetch('/api/tarot/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadType,
          cardsDrawn: dealt.map((d) => ({
            cardId: d.card.id,
            isReversed: d.isReversed,
            position: d.position,
          })),
          userNotes: notes,
          occurredAt: now.toISOString(),
          sky,
          ...(summaryText ? { summary: summaryText } : {}),
          entities: dealt.map((d) => ({
            kind: 'tarot',
            id: d.card.id,
            label: d.card.name,
          })),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save reading');
      }
      setSaveStatus('Saved to Magical Journal.');
      void loadHistory();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {!embedded && (
        <header>
          <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">
            Virtual Tarot
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Select a spread, draw the cards face-down, then reveal each by
            clicking. Approximately one in five cards arrives reversed. Saved
            readings live in the Magical Journal.
          </p>
        </header>
      )}

      {/* Spread selector */}
      <div className="flex flex-wrap gap-3">
        {SPREADS.map((spread) => (
          <button
            key={spread.id}
            type="button"
            onClick={() => {
              setSpreadType(spread.id);
              setDealt([]);
              setSaveStatus(null);
            }}
            className={[
              'w-full rounded-md border px-4 py-3 text-left transition sm:w-auto',
              spreadType === spread.id
                ? 'border-ananael-violet bg-ananael-violet/20 shadow-glow'
                : 'border-ananael-border bg-ananael-panel hover:border-ananael-gold/40',
            ].join(' ')}
          >
            <p className="text-sm font-medium text-zinc-100">{spread.label}</p>
            <p className="text-xs text-ananael-muted">{spread.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm text-ananael-muted">
          Deck art
          <select
            value={deckStyle}
            onChange={(e) =>
              handleDeckStyleChange(e.target.value as DeckStyle)
            }
            className="mt-1 block w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet sm:w-auto"
          >
            <option value="artless">Artless</option>
            <option value="rider-waite-smith">Rider–Waite–Smith</option>
          </select>
        </label>
        <button
          type="button"
          onClick={drawCards}
          className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ananael-violet-deep"
        >
          Draw Cards
        </button>
        {dealt.length > 0 && (
          <button
            type="button"
            onClick={flipAll}
            className="rounded-md border border-ananael-bronze/60 px-5 py-2.5 text-sm text-ananael-gold transition hover:bg-ananael-panel"
          >
            Reveal All
          </button>
        )}
      </div>

      {/* Interactive board */}
      {dealt.length > 0 && (
        spreadType === 'celtic' ? (
          <CelticCrossBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : spreadType === 'single' ? (
          <SingleCardBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : spreadType === 'three' ? (
          <ThreeCardBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : spreadType === 'horseshoe' ? (
          <HorseshoeBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : spreadType === 'pyramid' ? (
          <PyramidBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : spreadType === 'wheel' ? (
          <WheelBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : spreadType === 'diamond' ? (
          <DiamondBoard
            dealt={dealt}
            deckStyle={deckStyle}
            onFlip={flipCard}
          />
        ) : null
      )}

      {/* Card meanings for visual spreads */}
      {dealt.length > 0 && spreadType !== 'celtic' && (
        <MeaningsList dealt={dealt} />
      )}

      {/* Deterministic reading summary (guests + signed-in) */}
      {readingSummary && (
        <section className="max-w-3xl space-y-4 rounded-lg border border-ananael-border/50 bg-ananael-panel p-4">
          <h2 className="font-display text-lg text-ananael-gold">
            Reading summary
          </h2>
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
              Walkthrough
            </h3>
            <ul className="space-y-2">
              {readingSummary.walkthrough.map((sentence, i) => (
                <li
                  key={`walk-${i}`}
                  className="text-sm leading-relaxed text-zinc-300"
                >
                  {sentence}
                </li>
              ))}
            </ul>
          </div>
          {readingSummary.patterns.length > 0 && (
            <div className="space-y-1.5 border-t border-ananael-border/40 pt-3">
              <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
                Patterns
              </h3>
              <ul className="space-y-1.5">
                {readingSummary.patterns.map((note, i) => (
                  <li
                    key={`pat-${i}`}
                    className="text-xs leading-relaxed text-ananael-muted"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {readingSummary.correspondences.length > 0 && (
            <div className="space-y-1.5 border-t border-ananael-border/40 pt-3">
              <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
                Correspondences
              </h3>
              <ul className="space-y-1.5">
                {readingSummary.correspondences.map((note, i) => (
                  <li
                    key={`corr-${i}`}
                    className="text-xs leading-relaxed text-zinc-400"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {readingSummary.prompts.length > 0 && (
            <div className="space-y-1.5 border-t border-ananael-border/40 pt-3">
              <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
                Reflect
              </h3>
              <ul className="space-y-1.5">
                {readingSummary.prompts.map((prompt, i) => (
                  <li
                    key={`prompt-${i}`}
                    className="text-xs leading-relaxed text-ananael-gold/80"
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {flipped.length < dealt.length && (
            <p className="border-t border-ananael-border/40 pt-3 text-xs text-ananael-muted">
              {dealt.length - flipped.length} card
              {dealt.length - flipped.length === 1 ? '' : 's'} still face-down —
              summary covers revealed cards only.
            </p>
          )}
        </section>
      )}

      {/* Journal sync */}
      {isAuthenticated && dealt.length > 0 && (
        <div className="max-w-xl space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel p-4">
          <label className="block text-sm text-ananael-muted">
            Reading notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Reflections, questions, or ritual context…"
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveReading()}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save to Journal'}
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('journal', { filter: 'divination' })}
                className="text-sm text-ananael-violet hover:underline"
              >
                Open Magical Journal
              </button>
            )}
          </div>
          {saveStatus && (
            <p className="text-sm text-zinc-400">
              {saveStatus}
              {saveStatus.startsWith('Saved') && onNavigate && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('journal', { filter: 'divination' })
                    }
                    className="text-ananael-violet hover:underline"
                  >
                    View in Journal
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Signed-in: aggregate patterns across saved pulls */}
      {isAuthenticated && historyLoaded && (
        <section className="max-w-3xl space-y-3 rounded-lg border border-ananael-border/50 bg-ananael-panel p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg text-ananael-gold">
              Your patterns
            </h2>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('journal', { filter: 'divination' })}
                className="text-xs text-ananael-violet hover:underline"
              >
                View in Journal
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-ananael-muted">
              Save readings to see recurring cards, suits, and trends here.
            </p>
          ) : (
            <div className="space-y-4">
              {historyAggregate.topCards.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-ananael-muted">
                    Frequent cards
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {historyAggregate.topCards.map((c) => (
                      <li
                        key={c.cardId}
                        className="flex justify-between gap-3 text-sm text-zinc-300"
                      >
                        <span>{c.name}</span>
                        <span className="text-ananael-muted">{c.count}×</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {historyAggregate.minorCount > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-ananael-muted">
                    Suit mix
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
                    {(
                      Object.keys(SUIT_LABELS) as MinorSuit[]
                    ).map((suit) => (
                      <li key={suit}>
                        {SUIT_LABELS[suit]}{' '}
                        <span className="text-ananael-muted">
                          {historyAggregate.suitCounts[suit]} (
                          {historyAggregate.suitPercents[suit]}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-zinc-400">
                Reversals{' '}
                <span className="text-zinc-300">
                  {Math.round(historyAggregate.reversalRate * 100)}%
                </span>
                <span className="text-ananael-muted"> · </span>
                Major / Minor{' '}
                <span className="text-zinc-300">
                  {historyAggregate.majorCount} / {historyAggregate.minorCount}
                </span>
              </p>
              {historyAggregate.trends.length > 0 && (
                <ul className="space-y-1.5 border-t border-ananael-border/40 pt-3">
                  {historyAggregate.trends.map((t, i) => (
                    <li
                      key={`trend-${i}`}
                      className="text-xs leading-relaxed text-ananael-muted"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {isAuthenticated && dealt.length === 0 && onNavigate && (
        <p className="text-sm text-ananael-muted">
          Past readings are in the{' '}
          <button
            type="button"
            onClick={() => onNavigate('journal', { filter: 'divination' })}
            className="text-ananael-violet hover:underline"
          >
            Magical Journal
          </button>
          .
        </p>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-ananael-muted">
          Sign in to save readings to your Magical Journal.
        </p>
      )}
    </div>
  );
}

/** Deal indices for the classic Celtic Cross cross + staff layout. */
const CELTIC_CROSS_SLOTS = {
  crown: 4,
  past: 3,
  foundation: 2,
  future: 5,
} as const;

const CELTIC_STAFF_INDICES = [6, 7, 8, 9] as const; // Self → Outcome (bottom → top via flex-col-reverse)

interface CelticCrossBoardProps {
  dealt: DealtCard[];
  deckStyle: DeckStyle;
  onFlip: (index: number) => void;
}

/**
 * Standard Celtic Cross: cross (positions 1–6) with Challenge across Present, plus staff (7–10).
 */
function CelticCrossBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  const present = dealt[0];
  const challenge = dealt[1];
  const flipped = dealt.filter((d) => d.isFlipped);

  const slotCard = (index: number) => {
    const card = dealt[index];
    if (!card) return null;
    return (
      <TarotCard
        key={`${card.card.id}-${card.position}`}
        dealt={card}
        onFlip={() => onFlip(index)}
        deckStyle={deckStyle}
        size="compact"
        hideMeaning
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-3 sm:p-6">
        <div className="mx-auto flex flex-col items-center justify-center gap-6 md:min-w-[700px] md:flex-row md:gap-10">
          {/* Cross */}
          <div
            className="grid grid-cols-3 grid-rows-3 place-items-center gap-x-2 gap-y-1 sm:gap-x-3"
            style={{
              gridTemplateAreas: `
                ". crown ."
                "past center future"
                ". foundation ."
              `,
            }}
          >
            <div style={{ gridArea: 'crown' }}>
              {slotCard(CELTIC_CROSS_SLOTS.crown)}
            </div>
            <div style={{ gridArea: 'past' }}>
              {slotCard(CELTIC_CROSS_SLOTS.past)}
            </div>

            {/* Present with Challenge crossing */}
            <div
              className="relative flex flex-col items-center gap-2"
              style={{ gridArea: 'center' }}
            >
              <div className="flex flex-col items-center gap-0.5 text-center">
                <p className="text-[11px] uppercase tracking-[0.15em] text-ananael-muted">
                  Present
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ananael-muted/80">
                  Challenge
                </p>
              </div>
              <div className="relative flex h-[150px] w-[140px] items-center justify-center sm:h-[180px] sm:w-[170px]">
                {present && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TarotCard
                      dealt={present}
                      onFlip={() => onFlip(0)}
                      deckStyle={deckStyle}
                      size="compact"
                      hideMeaning
                      hideLabel
                    />
                  </div>
                )}
                {challenge && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <div className="pointer-events-auto">
                      <TarotCard
                        dealt={challenge}
                        onFlip={() => onFlip(1)}
                        deckStyle={deckStyle}
                        size="compact"
                        crossing
                        hideMeaning
                        hideLabel
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ gridArea: 'future' }}>
              {slotCard(CELTIC_CROSS_SLOTS.future)}
            </div>
            <div style={{ gridArea: 'foundation' }}>
              {slotCard(CELTIC_CROSS_SLOTS.foundation)}
            </div>
          </div>

          {/* Staff: Outcome on top, Self on bottom */}
          <div className="flex flex-col-reverse gap-3 border-t border-ananael-border/40 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            {CELTIC_STAFF_INDICES.map((index) => slotCard(index))}
          </div>
        </div>
      </div>

      {/* Meanings listed below so the cross stays readable */}
      {flipped.length > 0 && (
        <ul className="max-w-3xl space-y-3 rounded-lg border border-ananael-border/50 bg-ananael-panel p-4">
          {flipped.map((d) => {
            const meaning = d.isReversed ? d.card.reversed : d.card.upright;
            return (
              <li key={`${d.card.id}-${d.position}`} className="text-sm">
                <span className="font-medium text-ananael-gold">
                  {d.position}
                </span>
                <span className="text-ananael-muted"> · </span>
                <span className="text-zinc-200">
                  {d.card.name}
                  {d.isReversed ? ' (reversed)' : ''}
                </span>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                  {meaning}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Display card meanings for flipped cards in a spread */
interface MeaningsListProps {
  dealt: DealtCard[];
}

function MeaningsList({ dealt }: MeaningsListProps) {
  const flipped = dealt.filter((d) => d.isFlipped);
  if (flipped.length === 0) return null;

  return (
    <ul className="max-w-3xl space-y-3 rounded-lg border border-ananael-border/50 bg-ananael-panel p-4">
      {flipped.map((d) => {
        const meaning = d.isReversed ? d.card.reversed : d.card.upright;
        return (
          <li key={`${d.card.id}-${d.position}`} className="text-sm">
            <span className="font-medium text-ananael-gold">
              {d.position}
            </span>
            <span className="text-ananael-muted"> · </span>
            <span className="text-zinc-200">
              {d.card.name}
              {d.isReversed ? ' (reversed)' : ''}
            </span>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
              {meaning}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Single card display centered */
function SingleCardBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  return (
    <div className="flex justify-center rounded-xl border border-ananael-border/50 bg-ananael-surface p-6">
      {dealt[0] && (
        <TarotCard
          dealt={dealt[0]}
          onFlip={() => onFlip(0)}
          deckStyle={deckStyle}
        />
      )}
    </div>
  );
}

/** Three-card horizontal layout: Past – Present – Future */
function ThreeCardBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-6">
      <div className="mx-auto flex justify-center gap-8 md:min-w-[600px]">
        {dealt.map((card, index) => (
          <div key={`${card.card.id}-${card.position}`} className="flex flex-col items-center">
           <TarotCard
             dealt={card}
             onFlip={() => onFlip(index)}
             deckStyle={deckStyle}
           />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horseshoe spread: 7-card arc layout
 * Positions in arc: 0,1,2 (left curve) → 3 (bottom) → 4,5,6 (right curve)
 */
function HorseshoeBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  const positions = [
    { index: 0, style: { gridColumn: '1', gridRow: '1' } },     // Top-left
    { index: 1, style: { gridColumn: '2', gridRow: '1-3' } },   // Left
    { index: 2, style: { gridColumn: '3', gridRow: '1-2' } },   // Inner-left
    { index: 3, style: { gridColumn: '4', gridRow: '3' } },     // Bottom center
    { index: 4, style: { gridColumn: '5', gridRow: '1-2' } },   // Inner-right
    { index: 5, style: { gridColumn: '6', gridRow: '1-3' } },   // Right
    { index: 6, style: { gridColumn: '7', gridRow: '1' } },     // Top-right
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-6">
      <div className="mx-auto md:min-w-[750px]">
        <div
          className="grid place-items-center gap-4"
          style={{
           gridTemplateColumns: 'repeat(7, 1fr)',
           gridTemplateRows: 'repeat(3, auto)',
          }}
        >
          {positions.map(({ index, style }) => (
           <div
             key={`pos-${index}`}
             style={style}
             className="flex flex-col items-center"
           >
             {dealt[index] && (
               <TarotCard
                 dealt={dealt[index]}
                 onFlip={() => onFlip(index)}
                 deckStyle={deckStyle}
                 size="compact"
                 hideMeaning
               />
             )}
           </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Pyramid spread: 6-card triangular layout
 * Row 1 (top):    1 card (center)
 * Row 2 (middle): 2 cards
 * Row 3 (base):   3 cards
 * Dealing order: [0,1,2,3,4,5] maps to positions shown
 */
function PyramidBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  // Map deal order to visual pyramid positions using 5-column grid
  // Deal: 0,1,2,3,4,5 → Pyramid: (base) 0,1,2 at cols 1,3,5
  //                              (middle) 3,4 at cols 2,4
  //                              (apex) 5 at col 3
  const positionMap = [
    { index: 0, col: 1, row: 3 },  // Base left
    { index: 1, col: 3, row: 3 },  // Base center
    { index: 2, col: 5, row: 3 },  // Base right
    { index: 3, col: 2, row: 2 },  // Middle left
    { index: 4, col: 4, row: 2 },  // Middle right
    { index: 5, col: 3, row: 1 },  // Apex
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-6">
      <div className="mx-auto md:min-w-[650px]">
        <div
          className="grid place-items-center gap-6 px-4"
          style={{
           gridTemplateColumns: 'repeat(5, 1fr)',
           gridTemplateRows: 'auto auto auto',
          }}
        >
          {positionMap.map(({ index, col, row }) => (
           <div
             key={`pyr-${index}`}
             style={{
               gridColumn: `${col}`,
               gridRow: `${row}`,
             }}
             className="flex flex-col items-center"
           >
             {dealt[index] && (
               <TarotCard
                 dealt={dealt[index]}
                 onFlip={() => onFlip(index)}
                 deckStyle={deckStyle}
                 size="compact"
                 hideMeaning
               />
             )}
           </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Wheel of Year: 8-card circular/radial layout
 * Positions: Spring, Summer, Autumn, Winter (cardinal)
 *            + Current Energy, Challenge, Gift, Resolution (between/center)
 */
function WheelBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  // 5x5 grid for a proper wheel/circle arrangement
  // Cardinal directions at the edges, inner circle for supporting cards
  // Positions in clock order starting from top:
  // 0: Spring (top), 1: Summer (right), 2: Autumn (bottom), 3: Winter (left)
  // 4: Current Energy (center), 5-7: Challenge/Gift/Resolution (inner circle)
  
  const positions = [
    { index: 0, col: 3, row: 1 },   // Spring - top center
    { index: 1, col: 5, row: 3 },   // Summer - right center
    { index: 2, col: 3, row: 5 },   // Autumn - bottom center
    { index: 3, col: 1, row: 3 },   // Winter - left center
    { index: 4, col: 3, row: 3 },   // Current Energy - center
    { index: 5, col: 4, row: 2 },   // Challenge - top-right inner
    { index: 6, col: 4, row: 4 },   // Gift - bottom-right inner
    { index: 7, col: 2, row: 3 },   // Resolution - left inner (alternative: row 2 or 4)
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-6">
      <div className="mx-auto md:min-w-[700px]">
        <div
          className="grid place-items-center gap-3"
          style={{
           gridTemplateColumns: 'repeat(5, 1fr)',
           gridTemplateRows: 'repeat(5, 1fr)',
           minHeight: '400px',
          }}
        >
          {positions.map(({ index, col, row }) => (
           <div
             key={`wheel-${index}`}
             style={{
               gridColumn: `${col}`,
               gridRow: `${row}`,
             }}
             className="flex flex-col items-center"
           >
             {dealt[index] && (
               <TarotCard
                 dealt={dealt[index]}
                 onFlip={() => onFlip(index)}
                 deckStyle={deckStyle}
                 size="compact"
                 hideMeaning
               />
             )}
           </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Diamond spread: 5-card diamond/rhombus layout
 * Positions:
 *      2 (top)
 *   1     3 (sides)
 *      4 (bottom center)
 *      0 (heart/center in middle)
 */
function DiamondBoard({ dealt, deckStyle, onFlip }: CelticCrossBoardProps) {
  const positionMap = [
    { index: 0, col: 2, row: 2 },   // Heart of Matter (center)
    { index: 1, col: 1, row: 2 },   // Left perspective
    { index: 2, col: 2, row: 1 },   // Top
    { index: 3, col: 3, row: 2 },   // Right perspective
    { index: 4, col: 2, row: 3 },   // Bridge/bottom
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-6">
      <div className="mx-auto md:min-w-[550px]">
        <div
          className="grid place-items-center gap-6"
          style={{
           gridTemplateColumns: 'repeat(3, 1fr)',
           gridTemplateRows: 'repeat(3, auto)',
          }}
        >
          {positionMap.map(({ index, col, row }) => (
           <div
             key={`diamond-${index}`}
             style={{
               gridColumn: `${col}`,
               gridRow: `${row}`,
             }}
             className="flex flex-col items-center"
           >
             {dealt[index] && (
               <TarotCard
                 dealt={dealt[index]}
                 onFlip={() => onFlip(index)}
                 deckStyle={deckStyle}
                 size="compact"
                 hideMeaning
               />
             )}
           </div>
          ))}
        </div>
      </div>
    </div>
  );
}
