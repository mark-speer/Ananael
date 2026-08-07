/**
 * Sparse classic card-pair glosses for deterministic summary enrichment.
 * Keys are sorted card-id pairs joined by "|".
 */

export interface TarotCombo {
  /** Sorted pair of card ids. */
  ids: [string, string];
  gloss: string;
}

const RAW: TarotCombo[] = [
  {
    ids: ['major-00', 'major-21'],
    gloss: 'Fool and World — a journey from first leap to full completion.',
  },
  {
    ids: ['major-01', 'major-02'],
    gloss: 'Magician and High Priestess — will meets the veiled inner knowing.',
  },
  {
    ids: ['major-03', 'major-04'],
    gloss: 'Empress and Emperor — fertile nurture paired with structured rule.',
  },
  {
    ids: ['major-06', 'major-15'],
    gloss: 'Lovers and Devil — sacred choice pressed against binding desire.',
  },
  {
    ids: ['major-13', 'major-03'],
    gloss: 'Death and Empress — ending that clears ground for new growth.',
  },
  {
    ids: ['major-13', 'major-17'],
    gloss: 'Death and Star — after the ending, hope and healing return.',
  },
  {
    ids: ['major-15', 'major-16'],
    gloss: 'Devil and Tower — bondage meets the sudden crack of liberation.',
  },
  {
    ids: ['major-16', 'major-17'],
    gloss: 'Tower and Star — upheaval followed by calm, restoring light.',
  },
  {
    ids: ['major-16', 'major-19'],
    gloss: 'Tower and Sun — false structures fall so truth can shine.',
  },
  {
    ids: ['major-18', 'major-19'],
    gloss: 'Moon and Sun — illusion yielding to clarity and vitality.',
  },
  {
    ids: ['major-09', 'major-02'],
    gloss: 'Hermit and High Priestess — solitude deepened by inner mysteries.',
  },
  {
    ids: ['major-07', 'major-08'],
    gloss: 'Chariot and Strength — directed will tempered by gentle courage.',
  },
  {
    ids: ['major-10', 'major-16'],
    gloss: 'Wheel and Tower — fate turns; sudden change is part of the cycle.',
  },
  {
    ids: ['major-11', 'major-20'],
    gloss: 'Justice and Judgement — fairness meets the call to rise and answer.',
  },
  {
    ids: ['major-12', 'major-13'],
    gloss: 'Hanged Man and Death — surrender preparing the way for true change.',
  },
  {
    ids: ['major-14', 'major-15'],
    gloss: 'Temperance and Devil — alchemy of balance versus excess and chain.',
  },
  {
    ids: ['major-05', 'major-15'],
    gloss: 'Hierophant and Devil — tradition tested by shadow attachment.',
  },
  {
    ids: ['major-04', 'major-16'],
    gloss: 'Emperor and Tower — rigid authority meeting necessary collapse.',
  },
  {
    ids: ['major-00', 'major-16'],
    gloss: 'Fool and Tower — leap of faith colliding with sudden upheaval.',
  },
  {
    ids: ['major-17', 'major-18'],
    gloss: 'Star and Moon — hope navigating the dreamlike, uncertain path.',
  },
  {
    ids: ['major-19', 'major-21'],
    gloss: 'Sun and World — radiant success ripening into full completion.',
  },
  {
    ids: ['major-01', 'major-15'],
    gloss: 'Magician and Devil — focused will at risk of manipulative attachment.',
  },
  {
    ids: ['major-08', 'major-15'],
    gloss: 'Strength and Devil — compassionate mastery facing raw craving.',
  },
  {
    ids: ['major-03', 'major-17'],
    gloss: 'Empress and Star — fertile care bathed in healing inspiration.',
  },
  {
    ids: ['major-10', 'major-21'],
    gloss: 'Wheel and World — turning fortune arriving at integrated fulfillment.',
  },
  {
    ids: ['cups-02', 'major-06'],
    gloss: 'Two of Cups and Lovers — partnership themes echo across the spread.',
  },
  {
    ids: ['swords-03', 'major-13'],
    gloss: 'Three of Swords and Death — heartbreak as gateway to transformation.',
  },
  {
    ids: ['wands-10', 'major-16'],
    gloss: 'Ten of Wands and Tower — overloaded burden meeting a forced release.',
  },
  {
    ids: ['cups-10', 'major-21'],
    gloss: 'Ten of Cups and World — emotional fulfillment meeting life completion.',
  },
  {
    ids: ['pentacles-10', 'major-04'],
    gloss: 'Ten of Pentacles and Emperor — legacy and lasting structure aligned.',
  },
  {
    ids: ['swords-10', 'major-17'],
    gloss: 'Ten of Swords and Star — rock bottom opening into renewed hope.',
  },
  {
    ids: ['cups-08', 'major-09'],
    gloss: 'Eight of Cups and Hermit — walking away into solitary seeking.',
  },
  {
    ids: ['wands-01', 'major-01'],
    gloss: 'Ace of Wands and Magician — spark of fire meeting skilled manifestation.',
  },
  {
    ids: ['swords-01', 'major-11'],
    gloss: 'Ace of Swords and Justice — cutting truth in service of fairness.',
  },
  {
    ids: ['cups-01', 'major-03'],
    gloss: 'Ace of Cups and Empress — emotional opening meeting fertile nurture.',
  },
  {
    ids: ['pentacles-01', 'major-04'],
    gloss: 'Ace of Pentacles and Emperor — material seed under disciplined rule.',
  },
];

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

const BY_PAIR = new Map(
  RAW.map((c) => [pairKey(c.ids[0], c.ids[1]), c.gloss])
);

/** Return glosses for known classic pairs present among the given card ids. */
export function findComboGlosses(cardIds: string[]): string[] {
  const unique = [...new Set(cardIds)];
  const glosses: string[] = [];
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const gloss = BY_PAIR.get(pairKey(unique[i], unique[j]));
      if (gloss) glosses.push(gloss);
    }
  }
  return glosses;
}
