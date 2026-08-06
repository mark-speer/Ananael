import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { shuffleDeck, TAROT_DECK } from '../data/tarotDeck';
import {
  loadDeckStyle,
  saveDeckStyle,
  type DeckStyle,
} from '../data/tarotDeckArt';
import TarotCard, { type DealtCard } from './TarotCard';

export type SpreadType = 'single' | 'three' | 'celtic';

interface SpreadConfig {
  id: SpreadType;
  label: string;
  description: string;
  positions: string[];
}

interface HistoryItem {
  _id: string;
  date: string;
  spreadType: SpreadType;
  cardsDrawn: Array<{
    cardId: string;
    isReversed: boolean;
    position: string;
  }>;
  userNotes?: string;
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
];

const SPREAD_LABELS: Record<SpreadType, string> = {
  single: 'Single Card',
  three: 'Three-Card',
  celtic: 'Celtic Cross',
};

/** ~20% mathematical chance a dealt card is reversed. */
const REVERSAL_CHANCE = 0.2;

/**
 * Virtual Tarot module: spread selection, interactive board, profile save + history.
 */
export default function TarotModule() {
  const { isAuthenticated, token } = useAuth();
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>(() => loadDeckStyle());
  const [dealt, setDealt] = useState<DealtCard[]>([]);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const handleDeckStyleChange = (style: DeckStyle) => {
    setDeckStyle(style);
    saveDeckStyle(style);
  };

  const activeSpread = useMemo(
    () => SPREADS.find((s) => s.id === spreadType)!,
    [spreadType]
  );

  const loadHistory = useCallback(async () => {
    if (!token) {
      setHistory([]);
      return;
    }
    setHistoryError(null);
    try {
      const res = await fetch('/api/tarot/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        readings?: HistoryItem[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load history');
      }
      setHistory(data.readings ?? []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'History failed');
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadHistory();
    } else {
      setHistory([]);
    }
  }, [isAuthenticated, loadHistory]);

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
    if (!token || dealt.length === 0) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/tarot/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spreadType,
          cardsDrawn: dealt.map((d) => ({
            cardId: d.card.id,
            isReversed: d.isReversed,
            position: d.position,
          })),
          userNotes: notes,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save reading');
      }
      setSaveStatus('Reading saved to your profile.');
      await loadHistory();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Virtual Tarot</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Select a spread, draw the cards face-down, then reveal each by clicking.
          Approximately one in five cards arrives reversed.
        </p>
      </header>

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
              'rounded-md border px-4 py-3 text-left transition',
              spreadType === spread.id
                ? 'border-ananael-violet bg-ananael-violet/20 shadow-glow'
                : 'border-ananael-border bg-ananael-panel/40 hover:border-ananael-gold/40',
            ].join(' ')}
          >
            <p className="text-sm font-medium text-zinc-100">{spread.label}</p>
            <p className="text-xs text-ananael-muted">{spread.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.12em] text-ananael-muted">
          Deck art
          <select
            value={deckStyle}
            onChange={(e) =>
              handleDeckStyleChange(e.target.value as DeckStyle)
            }
            className="rounded-md border border-ananael-border bg-ananael-panel/60 px-3 py-2.5 text-sm normal-case tracking-normal text-zinc-100 outline-none focus:border-ananael-gold/50"
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
        <div
          className={[
            'flex flex-wrap justify-center gap-6 rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-6',
            spreadType === 'celtic' ? 'max-w-5xl' : '',
          ].join(' ')}
        >
          {dealt.map((card, index) => (
            <TarotCard
              key={`${card.card.id}-${card.position}`}
              dealt={card}
              onFlip={() => flipCard(index)}
              deckStyle={deckStyle}
            />
          ))}
        </div>
      )}

      {/* Profile sync */}
      {isAuthenticated && dealt.length > 0 && (
        <div className="max-w-xl space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel/50 p-4">
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
          <button
            type="button"
            disabled={saving}
            onClick={saveReading}
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Reading to Profile'}
          </button>
          {saveStatus && (
            <p className="text-sm text-zinc-400">{saveStatus}</p>
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-5">
          <h2 className="font-display text-lg text-ananael-gold">
            Recent readings
          </h2>
          {historyError && (
            <p className="mt-2 text-sm text-red-400/90">{historyError}</p>
          )}
          {!historyError && history.length === 0 && (
            <p className="mt-2 text-sm text-ananael-muted">
              No saved readings yet.
            </p>
          )}
          {history.length > 0 && (
            <ul className="mt-4 space-y-3">
              {history.map((item) => {
                const date = new Date(item.date);
                const names = item.cardsDrawn
                  .map((c) => {
                    const card = TAROT_DECK.find((d) => d.id === c.cardId);
                    const label = card?.name ?? c.cardId;
                    return c.isReversed ? `${label} (rev)` : label;
                  })
                  .join(', ');
                return (
                  <li
                    key={item._id}
                    className="border-b border-ananael-border/30 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-zinc-200">
                      <span className="font-display text-ananael-gold">
                        {SPREAD_LABELS[item.spreadType]}
                      </span>
                      <span className="text-ananael-muted">
                        {' '}
                        · {item.cardsDrawn.length} card
                        {item.cardsDrawn.length === 1 ? '' : 's'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ananael-muted">
                      {date.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                      {names}
                    </p>
                    {item.userNotes && (
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                        {item.userNotes}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
