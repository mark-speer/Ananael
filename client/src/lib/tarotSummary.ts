/**
 * Deterministic, client-side tarot interpretation.
 * Position-templated walkthroughs + suit / Major / reversal / dignity /
 * numerology / court / combo pattern notes, GD correspondences, and prompts.
 */

import { getCorrespondenceByTarotId } from '../data/correspondences';
import { findComboGlosses } from '../data/tarotCombos';
import {
  getCardById,
  type Arcana,
  type TarotCardData,
} from '../data/tarotDeck';
import { getPathByTarotId } from '../data/treeOfLife';

export type SpreadType = 'single' | 'three' | 'celtic' | 'horseshoe' | 'pyramid' | 'wheel' | 'diamond';

export interface SummaryDealtCard {
  card: TarotCardData;
  isReversed: boolean;
  position: string;
}

export interface ReadingSummary {
  walkthrough: string[];
  patterns: string[];
  /** Golden Dawn / Tree path notes for Major Arcana in the pull. */
  correspondences: string[];
  /** Templated reflection questions. */
  prompts: string[];
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

export type CourtRank = 'page' | 'knight' | 'queen' | 'king';

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

/** Classical elemental affinities for dignity (strengthen / weaken). */
const SUIT_ELEMENT: Record<MinorSuit, 'fire' | 'water' | 'air' | 'earth'> = {
  wands: 'fire',
  cups: 'water',
  swords: 'air',
  pentacles: 'earth',
};

const ELEMENT_STRENGTHENS: Record<
  'fire' | 'water' | 'air' | 'earth',
  'fire' | 'water' | 'air' | 'earth'
> = {
  fire: 'air',
  air: 'fire',
  water: 'earth',
  earth: 'water',
};

const ELEMENT_WEAKENS: Record<
  'fire' | 'water' | 'air' | 'earth',
  'fire' | 'water' | 'air' | 'earth'
> = {
  fire: 'water',
  water: 'fire',
  air: 'earth',
  earth: 'air',
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

/** Adjacent Celtic pairs used for elemental dignity checks. */
const CELTIC_DIGNITY_PAIRS: Array<[string, string]> = [
  ['Present', 'Challenge'],
  ['Foundation', 'Recent Past'],
  ['Crown', 'Near Future'],
  ['Self', 'Environment'],
  ['Hopes & Fears', 'Outcome'],
  ['Present', 'Foundation'],
  ['Crown', 'Outcome'],
];

const COURT_RANK_BY_SUFFIX: Record<string, CourtRank> = {
  '11': 'page',
  '12': 'knight',
  '13': 'queen',
  '14': 'king',
};

const COURT_LABEL: Record<CourtRank, string> = {
  page: 'Pages',
  knight: 'Knights',
  queen: 'Queens',
  king: 'Kings',
};

const REVERSAL_BY_SUIT: Record<MinorSuit | 'major', string> = {
  cups: 'turned inward — feelings may be blocked, withheld, or privately circulating',
  wands: 'delayed or misdirected — drive stalls or burns without aim',
  swords: 'twisted in the mind — clarity clouds into worry or harsh self-talk',
  pentacles: 'stuck in the material — resources feel scarce, tight, or poorly rooted',
  major: 'turned inward — archetypal energy may be blocked, delayed, or privately working',
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

/** Page/Knight/Queen/King from minor court ids (…-11 …-14). */
export function courtRank(card: TarotCardData): CourtRank | null {
  const m = card.id.match(/^(?:wands|cups|swords|pentacles)-(1[1-4])$/);
  if (!m) return null;
  return COURT_RANK_BY_SUFFIX[m[1]] ?? null;
}

function cardBody(card: TarotCardData, isReversed: boolean): string {
  const orientation = isReversed ? 'reversed' : 'upright';
  const meaning = isReversed ? card.reversed : card.upright;
  const kw =
    card.keywords?.length > 0 ? `${card.keywords.join(', ')}. ` : '';
  return `${card.name} (${orientation}) — ${kw}${meaning}`;
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

function byPosition(
  cards: SummaryDealtCard[],
  position: string
): SummaryDealtCard | undefined {
  return cards.find((c) => c.position === position);
}

function shortLabel(card: TarotCardData): string {
  return card.name.replace(/^The\s+/i, '');
}

function keywordHint(card: TarotCardData): string {
  if (card.keywords?.length) {
    return card.keywords.slice(0, 2).join(' / ');
  }
  return shortLabel(card);
}

/** Spread-role synthesis for key position pairs. */
export function synthesisNotes(
  cards: SummaryDealtCard[],
  spreadType: SpreadType
): string[] {
  const notes: string[] = [];

  if (spreadType === 'three') {
    const past = byPosition(cards, 'Past');
    const future = byPosition(cards, 'Future');
    if (past && future) {
      notes.push(
        `From Past (${shortLabel(past.card)}: ${keywordHint(past.card)}) toward Future (${shortLabel(future.card)}: ${keywordHint(future.card)}) — the arc moves from what was established into what approaches.`
      );
    }
  }

  if (spreadType === 'celtic') {
    const present = byPosition(cards, 'Present');
    const challenge = byPosition(cards, 'Challenge');
    if (present && challenge) {
      notes.push(
        `Challenge (${shortLabel(challenge.card)}: ${keywordHint(challenge.card)}) presses against Present (${shortLabel(present.card)}: ${keywordHint(present.card)}) — the crossing force shapes the heart of the matter.`
      );
    }

    const crown = byPosition(cards, 'Crown');
    const outcome = byPosition(cards, 'Outcome');
    if (crown && outcome) {
      notes.push(
        `Crown (${shortLabel(crown.card)}) aims toward Outcome (${shortLabel(outcome.card)}) — influence above meets where the reading tends.`
      );
    }
  }

  return notes;
}

/** Golden Dawn / Tree path notes for majors in the reading. */
export function correspondenceNotes(cards: SummaryDealtCard[]): string[] {
  const notes: string[] = [];
  const seen = new Set<string>();

  for (const d of cards) {
    if (d.card.arcana !== 'major' || seen.has(d.card.id)) continue;
    seen.add(d.card.id);

    const path = getPathByTarotId(d.card.id);
    const corr = getCorrespondenceByTarotId(d.card.id);
    if (!path && !corr) continue;

    const letter =
      path?.letterName ?? corr?.letterName ?? corr?.hebrewLetter ?? null;
    const sphere =
      path?.correspondence ??
      corr?.planet ??
      corr?.zodiac ??
      corr?.element ??
      null;
    const blurb = path?.blurb ?? corr?.notes ?? null;

    const bits: string[] = [];
    if (letter) bits.push(`letter ${letter}`);
    if (sphere) bits.push(sphere);
    const meta = bits.length > 0 ? ` (${bits.join(', ')})` : '';
    const detail = blurb ? ` — ${blurb}` : '';
    notes.push(
      `${d.card.name} on the Tree${meta}${detail}`
    );
  }

  return notes.slice(0, 4);
}

function dignityRelation(
  a: MinorSuit,
  b: MinorSuit
): 'strengthen' | 'weaken' | 'neutral' | 'same' {
  if (a === b) return 'same';
  const ea = SUIT_ELEMENT[a];
  const eb = SUIT_ELEMENT[b];
  if (ELEMENT_STRENGTHENS[ea] === eb) return 'strengthen';
  if (ELEMENT_WEAKENS[ea] === eb) return 'weaken';
  return 'neutral';
}

/** Elemental dignity notes between neighboring positions. */
export function dignityNotes(
  cards: SummaryDealtCard[],
  spreadType: SpreadType
): string[] {
  const notes: string[] = [];
  const pairs: Array<[SummaryDealtCard, SummaryDealtCard]> = [];

  if (spreadType === 'three') {
    const past = byPosition(cards, 'Past');
    const present = byPosition(cards, 'Present');
    const future = byPosition(cards, 'Future');
    if (past && present) pairs.push([past, present]);
    if (present && future) pairs.push([present, future]);
  } else if (spreadType === 'celtic') {
    for (const [pa, pb] of CELTIC_DIGNITY_PAIRS) {
      const a = byPosition(cards, pa);
      const b = byPosition(cards, pb);
      if (a && b) pairs.push([a, b]);
    }
  }

  for (const [a, b] of pairs) {
    if (!isMinorSuit(a.card.arcana) || !isMinorSuit(b.card.arcana)) continue;
    const rel = dignityRelation(a.card.arcana, b.card.arcana);
    const left = `${shortLabel(a.card)} (${a.position})`;
    const right = `${shortLabel(b.card)} (${b.position})`;
    if (rel === 'strengthen' || rel === 'same') {
      notes.push(
        `${left} beside ${right} — elemental support; the suits reinforce each other.`
      );
    } else if (rel === 'weaken') {
      notes.push(
        `${left} beside ${right} — elemental friction; the suits pull against each other.`
      );
    }
  }

  return notes.slice(0, 2);
}

/** Numerology / pip progression notes. */
export function numerologyNotes(
  cards: SummaryDealtCard[],
  spreadType: SpreadType
): string[] {
  const notes: string[] = [];
  const numbered = cards.filter((c) => typeof c.card.number === 'number');
  const byNum = new Map<number, SummaryDealtCard[]>();
  for (const d of numbered) {
    const n = d.card.number!;
    const list = byNum.get(n) ?? [];
    list.push(d);
    byNum.set(n, list);
  }

  for (const [n, list] of [...byNum.entries()].sort((a, b) => a[0] - b[0])) {
    if (list.length >= 2) {
      const names = list.map((d) => shortLabel(d.card)).join(', ');
      notes.push(
        `Number ${n} repeats (${names}) — a shared stage of the cycle is emphasized.`
      );
    }
  }

  const aces = cards.filter((c) => c.card.number === 1);
  if (aces.length >= 2) {
    notes.push(
      'Multiple Aces — beginnings and seeded potential cluster in this pull.'
    );
  }

  if (spreadType === 'three') {
    const past = byPosition(cards, 'Past');
    const present = byPosition(cards, 'Present');
    const future = byPosition(cards, 'Future');
    const nums = [past, present, future]
      .map((d) => d?.card.number)
      .filter((n): n is number => typeof n === 'number');
    if (nums.length === 3) {
      if (nums[0] < nums[1] && nums[1] < nums[2]) {
        notes.push(
          'Numbers climb from Past to Future — a building, ascending arc.'
        );
      } else if (nums[0] > nums[1] && nums[1] > nums[2]) {
        notes.push(
          'Numbers descend from Past to Future — a releasing or winding-down arc.'
        );
      }
    }
  }

  return notes.slice(0, 2);
}

/** Court-card cluster notes. */
export function courtNotes(cards: SummaryDealtCard[]): string[] {
  const notes: string[] = [];
  const courts = cards.filter((c) => courtRank(c.card) != null);
  if (courts.length === 0) return notes;

  if (courts.length >= 3) {
    notes.push(
      'Many court cards — people, roles, and interpersonal dynamics are strongly in play.'
    );
  }

  const byRank = new Map<CourtRank, SummaryDealtCard[]>();
  for (const d of courts) {
    const rank = courtRank(d.card)!;
    const list = byRank.get(rank) ?? [];
    list.push(d);
    byRank.set(rank, list);
  }
  for (const [rank, list] of byRank) {
    if (list.length >= 2) {
      notes.push(
        `Multiple ${COURT_LABEL[rank]} — the same court rank echoes across suits.`
      );
    }
  }

  const majors = cards.filter((c) => c.card.arcana === 'major');
  if (courts.length >= 1 && majors.length >= 1) {
    const court = courts[0];
    const major = majors[0];
    notes.push(
      `${shortLabel(court.card)} faces ${shortLabel(major.card)} — a figure on the larger path.`
    );
  }

  return notes.slice(0, 2);
}

/** Classic combo dictionary hits. */
export function comboNotes(cards: SummaryDealtCard[]): string[] {
  return findComboGlosses(cards.map((c) => c.card.id)).slice(0, 2);
}

/** Note when a card in this pull also leads recent journal history. */
export function historyRecurrenceNotes(
  cards: SummaryDealtCard[],
  history?: Pick<TarotHistoryAggregate, 'topCards'> | null
): string[] {
  if (!history?.topCards?.length || cards.length === 0) return [];
  const notes: string[] = [];
  const inPull = new Set(cards.map((c) => c.card.id));
  for (const top of history.topCards) {
    if (top.count < 2 || !inPull.has(top.cardId)) continue;
    notes.push(
      `${top.name} returns — ${top.count} times in your recent journal.`
    );
    if (notes.length >= 2) break;
  }
  return notes;
}

/** Templated journaling / reflection prompts. */
export function journalingPrompts(
  cards: SummaryDealtCard[],
  spreadType: SpreadType
): string[] {
  if (cards.length === 0) return [];

  const prompts: string[] = [];

  if (spreadType === 'single') {
    const d = cards[0];
    prompts.push(
      `Where is "${keywordHint(d.card)}" asking for attention in your day?`
    );
    prompts.push(
      `What would following ${shortLabel(d.card)}'s guidance look like in one concrete act?`
    );
    return prompts.slice(0, 3);
  }

  if (spreadType === 'three') {
    const challenge = byPosition(cards, 'Present') ?? cards[1];
    const future = byPosition(cards, 'Future') ?? cards[cards.length - 1];
    if (challenge) {
      prompts.push(
        `How is the Present (${shortLabel(challenge.card)}) showing up in your week?`
      );
    }
    if (future) {
      prompts.push(
        `What small step invites the Future theme of ${shortLabel(future.card)}?`
      );
    }
  }

  if (spreadType === 'celtic') {
    const challenge = byPosition(cards, 'Challenge');
    const outcome = byPosition(cards, 'Outcome');
    const self = byPosition(cards, 'Self');
    if (challenge) {
      prompts.push(
        `Where is the Challenge (${shortLabel(challenge.card)}) meeting you this week?`
      );
    }
    if (self) {
      prompts.push(
        `How are you meeting this as ${shortLabel(self.card)} suggests?`
      );
    }
    if (outcome) {
      prompts.push(
        `What would align you with the Outcome (${shortLabel(outcome.card)})?`
      );
    }
  }

  // Fallback for any revealed card if templates missed
  if (prompts.length === 0 && cards[0]) {
    prompts.push(
      `What question does ${shortLabel(cards[0].card)} leave you sitting with?`
    );
  }

  return prompts.slice(0, 3);
}

/**
 * Pattern notes from elemental / structural / synthesis / dignity / number /
 * court / combo tallies. Skips elemental rules for single-card draws.
 */
export function readingPatternNotes(
  cards: SummaryDealtCard[],
  spreadType: SpreadType,
  history?: Pick<TarotHistoryAggregate, 'topCards'> | null
): string[] {
  if (cards.length === 0) return [];

  const notes: string[] = [];
  const deckCards = cards.map((c) => c.card);
  const suits = countSuits(deckCards);
  const minors = deckCards.filter((c) => isMinorSuit(c.arcana));
  const minorTotal = minors.length;
  const majors = countMajors(deckCards);
  const rev = reversalRate(cards);

  // Synthesis first — highest “interpreted” signal
  notes.push(...synthesisNotes(cards, spreadType));

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
    const reversed = cards.filter((c) => c.isReversed);
    const suitOf = (c: SummaryDealtCard): MinorSuit | 'major' =>
      isMinorSuit(c.card.arcana) ? c.card.arcana : 'major';
    const dominantRev = (() => {
      const counts: Record<string, number> = {};
      for (const c of reversed) {
        const k = suitOf(c);
        counts[k] = (counts[k] ?? 0) + 1;
      }
      return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        'major') as MinorSuit | 'major';
    })();
    notes.push(
      `Many cards arrive reversed — energy may be ${REVERSAL_BY_SUIT[dominantRev]}.`
    );
  }

  notes.push(...dignityNotes(cards, spreadType));
  notes.push(...numerologyNotes(cards, spreadType));
  notes.push(...courtNotes(cards));
  notes.push(...comboNotes(cards));
  notes.push(...historyRecurrenceNotes(cards, history));

  return notes.slice(0, 8);
}

function joinSummaryText(summary: Omit<ReadingSummary, 'text'>): string {
  const parts = [...summary.walkthrough];
  if (summary.patterns.length > 0) {
    parts.push(summary.patterns.join(' '));
  }
  if (summary.correspondences.length > 0) {
    parts.push(summary.correspondences.join(' '));
  }
  if (summary.prompts.length > 0) {
    parts.push(`Reflect: ${summary.prompts.join(' ')}`);
  }
  return parts.join(' ');
}

/** Build a position-templated summary for a dealt (or revealed) set. */
export function summarizeReading(
  dealt: SummaryDealtCard[],
  spreadType: SpreadType,
  history?: Pick<TarotHistoryAggregate, 'topCards'> | null
): ReadingSummary {
  const walkthrough = dealt.map((d) =>
    frameSentence(spreadType, d.position, cardBody(d.card, d.isReversed))
  );
  const patterns = readingPatternNotes(dealt, spreadType, history);
  const correspondences = correspondenceNotes(dealt);
  const prompts = journalingPrompts(dealt, spreadType);
  const base = { walkthrough, patterns, correspondences, prompts };
  return {
    ...base,
    text: joinSummaryText(base),
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

  if (agg.totalCards >= 3 && agg.majorCount / agg.totalCards >= 0.5) {
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
    horseshoe: 0,
    pyramid: 0,
    wheel: 0,
    diamond: 0,
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
