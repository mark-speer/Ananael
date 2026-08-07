import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { shuffleDeck, TAROT_DECK } from '../data/tarotDeck';
import {
  loadDeckStyle,
  saveDeckStyle,
  type DeckStyle,
} from '../data/tarotDeckArt';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import type { ModuleId } from './Sidebar';
import TarotCard, { type DealtCard } from './TarotCard';

export type SpreadType = 'single' | 'three' | 'celtic';

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
];

/** ~20% mathematical chance a dealt card is reversed. */
const REVERSAL_CHANCE = 0.2;

interface TarotModuleProps {
  onNavigate?: (module: ModuleId, opts?: { filter?: 'divination' }) => void;
}

/**
 * Virtual Tarot module: spread selection, interactive board, save to Magical Journal.
 */
export default function TarotModule({ onNavigate }: TarotModuleProps) {
  const { isAuthenticated } = useAuth();
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>(() => loadDeckStyle());
  const [dealt, setDealt] = useState<DealtCard[]>([]);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDeckStyleChange = (style: DeckStyle) => {
    setDeckStyle(style);
    saveDeckStyle(style);
  };

  const activeSpread = useMemo(
    () => SPREADS.find((s) => s.id === spreadType)!,
    [spreadType]
  );

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
          Approximately one in five cards arrives reversed. Saved readings live in
          the Magical Journal.
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
        <label className="block text-sm text-ananael-muted">
          Deck art
          <select
            value={deckStyle}
            onChange={(e) =>
              handleDeckStyleChange(e.target.value as DeckStyle)
            }
            className="mt-1 block rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
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

      {/* Journal sync */}
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
