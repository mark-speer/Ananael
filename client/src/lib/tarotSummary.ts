/**
 * Deterministic, client-side tarot interpretation.
 * Position-templated walkthroughs + suit / Major / reversal pattern notes.
 */

import {
  getCardById,
  type Arcana,
  type TarotCardData,
} from '../data/tarotDeck';

export type SpreadType = 'single' | 'three' | 'celtic';

export interface SummaryDealtCard {
  card: TarotCardData;
  isReversed: boolean;
  position: string;
}

export interface ReadingSummary {
  walkthrough: string[];
  patterns: string[];
  /** Joined prose for journal payload / display. */
  text: string;
}

export interface HistoryCardDrawn {
  cardId: string;
  isReversed: boolean;
  position: string;
}

export interface HistoryReading {
  spreadType: SpreadType;
  cardsDrawn: HistoryCardDrawn[];
}

export type MinorSuit = Exclude<Arcana, 'major'>;

export interface SuitCounts {
  wands: number;
  cups: number;
  swords: number;
  pentacles: number;
}

export interface CardFrequency {
  cardId: string;
  name: string;
  count: number;
}

export interface TarotHistoryAggregate {
  topCards: CardFrequency[];
  suitCounts: SuitCounts;
  suitPercents: SuitCounts;
  totalCards: number;
  majorCount: number;
  minorCount: number;
  majorRatio: number;
  reversalRate: number;
  spreadMix: Record<SpreadType, number>;
  trends: string[];
}

const SUIT_KEYS: MinorSuit[] = ['wands', 'cups', 'swords', 'pentacles'];

const ELEMENTAL_THEME: Record<MinorSuit, string> = {
  cups: 'emotional and relational waters',
  wands: 'drive, passion, and fiery initiative',
  swords: 'mind, clarity, and conflict',
  pentacles: 'material, work, and grounded resources',
};

const ELEMENTAL_INTENSIFY: Record<MinorSuit, string> = {
  cups: 'This pull is steeped in Cups — feelings and bonds dominate the story.',
  wands: 'This pull burns with Wands — will and creative fire crowd out other voices.',
  swords: 'This pull is edged with Swords — thought and tension set the tone.',
  pentacles: 'This pull is rooted in Pentacles — practical and material stakes prevail.',
};

const THREE_FRAMES: Record<string, (body: string) => string> = {
  Past: (body) => `In the Past: ${body}`,
  Present: (body) => `In the Present: ${body}`,
  Future: (body) => `Looking ahead: ${body}`,
};

const CELTIC_FRAMES: Record<string, (body: string) => string> = {
  Present: (body) => `At the heart of the matter: ${body}`,
  Challenge: (body) => `Crossing this: ${body}`,
  Foundation: (body) => `Beneath it all: ${body}`,
  'Recent Past': (body) => `From the recent past: ${body}`,
  Crown: (body) => `Above, as aim or influence: ${body}`,
  'Near Future': (body) => `Approaching soon: ${body}`,
  Self: (body) => `How you meet this: ${body}`,
  Environment: (body) => `Around you: ${body}`,
  'Hopes & Fears': (body) => `Hopes and fears: ${body}`,
  Outcome: (body) => `The outcome points to: ${body}`,
};

function emptySuitCounts(): SuitCounts {
  return { wands: 0, cups: 0, swords: 0, pentacles: 0 };
}

function isMinorSuit(arcana: Arcana): arcana is MinorSuit {
  return arcana !== 'major';
}

/** Count minor-suit cards among a set of deck cards. */
export function countSuits(cards: TarotCardData[]): SuitCounts {
  const counts = emptySuitCounts();
  for (const card of cards) {
    if (isMinorSuit(card.arcana)) {
      counts[card.arcana] += 1;
    }
  }
  return counts;
}

/** Count Major Arcana cards. */
export function countMajors(cards: TarotCardData[]): number {
  return cards.filter((c) => c.arcana === 'major').length;
}

/** Fraction of cards that are reversed (0–1). */
export function reversalRate(cards: Array<{ isReversed: boolean }>): number {
  if (cards.length === 0) return 0;
  const reversed = cards.filter((c) => c.isReversed).length;
  return reversed / cards.length;
}

function cardBody(card: TarotCardData, isReversed: boolean): string {
  const orientation = isReversed ? 'reversed' : 'upright';
  const meaning = isReversed ? card.reversed : card.upright;
  return `${card.name} (${orientation}) — ${meaning}`;
}

function frameSentence(
  spreadType: SpreadType,
  position: string,
  body: string
): string {
  if (spreadType === 'single') {
    return `Guidance: ${body}`;
  }
  if (spreadType === 'three') {
    const frame = THREE_FRAMES[position];
    return frame ? frame(body) : `${position}: ${body}`;
  }
  const frame = CELTIC_FRAMES[position];
  return frame ? frame(body) : `${position}: ${body}`;
}

function dominantSuit(
  counts: SuitCounts,
  minorTotal: number
): MinorSuit | null {
  if (minorTotal === 0) return null;

  const ranked = SUIT_KEYS.map((suit) => ({
    suit,
    count: counts[suit],
  })).sort((a, b) => b.count - a.count);

  const top = ranked[0];
  if (!top || top.count === 0) return null;

  const second = ranked[1]?.count ?? 0;
  const share = top.count / minorTotal;
  const clearPlurality = top.count > second;

  if (share >= 0.4 || clearPlurality) {
    return top.suit;
  }
  return null;
}

/**
 * Pattern notes from elemental / structural tallies.
 * Skips elemental rules for single-card draws; returns at most 3 notes.
 */
export function readingPatternNotes(
  cards: SummaryDealtCard[],
  spreadType: SpreadType
): string[] {
  if (cards.length === 0) return [];

  const notes: string[] = [];
  const deckCards = cards.map((c) => c.card);
  const suits = countSuits(deckCards);
  const minors = deckCards.filter((c) => isMinorSuit(c.arcana));
  const minorTotal = minors.length;
  const majors = countMajors(deckCards);
  const rev = reversalRate(cards);

  if (spreadType !== 'single' && cards.length >= 2) {
    const monoSuit =
      cards.length >= 3 &&
      minorTotal >= 3 &&
      minors.every((c) => c.arcana === minors[0].arcana)
        ? (minors[0].arcana as MinorSuit)
        : null;

    if (monoSuit) {
      notes.push(ELEMENTAL_INTENSIFY[monoSuit]);
    } else {
      const lead = dominantSuit(suits, minorTotal);
      if (lead) {
        notes.push(
          `${lead.charAt(0).toUpperCase()}${lead.slice(1)} lead this spread — a tilt toward ${ELEMENTAL_THEME[lead]}.`
        );
      }
    }
  }

  const majorHeavy =
    (cards.length > 0 && majors / cards.length >= 0.5) ||
    (spreadType === 'celtic' && majors >= 3);
  if (majorHeavy && cards.length >= 2) {
    notes.push(
      'Major Arcana weigh heavily here — initiatory, life-path stakes are in play.'
    );
  }

  if (cards.length >= 2 && rev >= 0.4) {
    notes.push(
      'Many cards arrive reversed — energy may be blocked, delayed, or turned inward.'
    );
  }

  return notes.slice(0, 3);
}

/** Build a position-templated summary for a dealt (or revealed) set. */
export function summarizeReading(
  dealt: SummaryDealtCard[],
  spreadType: SpreadType
): ReadingSummary {
  const walkthrough = dealt.map((d) =>
    frameSentence(spreadType, d.position, cardBody(d.card, d.isReversed))
  );
  const patterns = readingPatternNotes(dealt, spreadType);
  const parts = [...walkthrough];
  if (patterns.length > 0) {
    parts.push(patterns.join(' '));
  }
  return {
    walkthrough,
    patterns,
    text: parts.join(' '),
  };
}

function percentMap(counts: SuitCounts, total: number): SuitCounts {
  if (total <= 0) return emptySuitCounts();
  return {
    wands: Math.round((counts.wands / total) * 100),
    cups: Math.round((counts.cups / total) * 100),
    swords: Math.round((counts.swords / total) * 100),
    pentacles: Math.round((counts.pentacles / total) * 100),
  };
}

function historyTrendNotes(agg: {
  suitCounts: SuitCounts;
  minorCount: number;
  majorCount: number;
  totalCards: number;
  reversalRate: number;
}): string[] {
  const trends: string[] = [];
  const lead = dominantSuit(agg.suitCounts, agg.minorCount);
  if (lead && agg.minorCount >= 3) {
    trends.push(
      `${lead.charAt(0).toUpperCase()}${lead.slice(1)} lead your recent draws — ${ELEMENTAL_THEME[lead]} recur often.`
    );
  }

  if (
    agg.totalCards >= 3 &&
    agg.majorCount / agg.totalCards >= 0.5
  ) {
    trends.push(
      'Major Arcana appear often in your journal — readings lean toward larger life themes.'
    );
  } else if (agg.majorCount >= 5) {
    trends.push(
      'Majors show up regularly — initiatory and archetypal notes keep returning.'
    );
  }

  if (agg.totalCards >= 3 && agg.reversalRate >= 0.4) {
    trends.push(
      'Reversals appear often — blocked or internalized themes are a recurring pattern.'
    );
  }

  return trends.slice(0, 3);
}

/** Aggregate saved history pulls into frequencies and canned trend sentences. */
export function aggregateTarotHistory(
  readings: HistoryReading[]
): TarotHistoryAggregate {
  const suitCounts = emptySuitCounts();
  const freq = new Map<string, number>();
  let majorCount = 0;
  let minorCount = 0;
  let reversedCount = 0;
  let totalCards = 0;
  const spreadMix: Record<SpreadType, number> = {
    single: 0,
    three: 0,
    celtic: 0,
  };

  for (const reading of readings) {
    if (reading.spreadType in spreadMix) {
      spreadMix[reading.spreadType] += 1;
    }
    for (const drawn of reading.cardsDrawn ?? []) {
      totalCards += 1;
      if (drawn.isReversed) reversedCount += 1;
      freq.set(drawn.cardId, (freq.get(drawn.cardId) ?? 0) + 1);

      const card = getCardById(drawn.cardId);
      if (!card) continue;
      if (card.arcana === 'major') {
        majorCount += 1;
      } else if (isMinorSuit(card.arcana)) {
        minorCount += 1;
        suitCounts[card.arcana] += 1;
      }
    }
  }

  const topCards: CardFrequency[] = [...freq.entries()]
    .map(([cardId, count]) => ({
      cardId,
      name: getCardById(cardId)?.name ?? cardId,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  const revRate = totalCards === 0 ? 0 : reversedCount / totalCards;
  const suitPercents = percentMap(suitCounts, Math.max(minorCount, 1));

  const trends = historyTrendNotes({
    suitCounts,
    minorCount,
    majorCount,
    totalCards,
    reversalRate: revRate,
  });

  return {
    topCards,
    suitCounts,
    suitPercents: minorCount === 0 ? emptySuitCounts() : suitPercents,
    totalCards,
    majorCount,
    minorCount,
    majorRatio: totalCards === 0 ? 0 : majorCount / totalCards,
    reversalRate: revRate,
    spreadMix,
    trends,
  };
}
