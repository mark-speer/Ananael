import { useMemo, useState } from 'react';
import { TAROT_DECK } from '../data/tarotDeck';
import type { Arcana, TarotCardData } from '../data/tarotDeck';

type FilterArcana = Arcana | 'all';

export default function TarotReferencePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArcana, setFilterArcana] = useState<FilterArcana>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    return TAROT_DECK.filter((card) => {
      const matchesSearch = searchQuery === '' || 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = filterArcana === 'all' || card.arcana === filterArcana;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterArcana]);

  const arcanaGroups = useMemo(() => {
    const groups: Record<Arcana, TarotCardData[]> = {
      major: [],
      wands: [],
      cups: [],
      swords: [],
      pentacles: [],
    };
    
    filteredCards.forEach(card => {
      groups[card.arcana].push(card);
    });
    
    return groups;
  }, [filteredCards]);

  const arcanaLabels: Record<Arcana, string> = {
    major: 'Major Arcana',
    wands: 'Wands',
    cups: 'Cups',
    swords: 'Swords',
    pentacles: 'Pentacles',
  };

  const handleCardToggle = (cardId: string) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Search and Filter */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search card name or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md bg-ananael-panel px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-ananael-gold"
        />
        
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterArcana('all')}
            className={[
              'rounded-md px-3 py-1.5 text-xs font-medium transition',
              filterArcana === 'all'
                ? 'bg-ananael-violet/30 text-ananael-gold'
                : 'bg-ananael-panel text-zinc-400 hover:text-zinc-200',
            ].join(' ')}
          >
            All
          </button>
          {(['major', 'wands', 'cups', 'swords', 'pentacles'] as const).map((arcana) => (
            <button
              key={arcana}
              type="button"
              onClick={() => setFilterArcana(arcana)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                filterArcana === arcana
                  ? 'bg-ananael-violet/30 text-ananael-gold'
                  : 'bg-ananael-panel text-zinc-400 hover:text-zinc-200',
              ].join(' ')}
            >
              {arcanaLabels[arcana]}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {(['major', 'wands', 'cups', 'swords', 'pentacles'] as const).map((arcana) => {
            if (arcanaGroups[arcana].length === 0) return null;
            
            return (
              <div key={arcana}>
                <div className="mb-2 text-xs font-semibold uppercase text-ananael-gold/70">
                  {arcanaLabels[arcana]}
                </div>
                <div className="space-y-2 pl-2">
                  {arcanaGroups[arcana].map((card) => (
                    <div key={card.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => handleCardToggle(card.id)}
                        className="flex w-full items-center justify-between rounded-md bg-ananael-panel/50 px-3 py-2 text-left transition hover:bg-ananael-panel"
                      >
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {card.name}
                            {card.number !== undefined && (
                              <span className="ml-2 text-xs text-ananael-gold/60">
                                {card.number}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 text-xs text-zinc-400 mt-1">
                            {card.keywords.slice(0, 2).map((kw, i) => (
                              <span key={i}>{kw}</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-ananael-gold/50">
                          {expandedCardId === card.id ? '▼' : '▶'}
                        </span>
                      </button>

                      {expandedCardId === card.id && (
                        <div className="ml-4 space-y-2 rounded-md bg-ananael-surface/50 p-3 text-xs text-zinc-300">
                          <div>
                            <div className="font-semibold text-ananael-gold/70">Upright</div>
                            <p className="mt-1">{card.upright}</p>
                          </div>
                          <div>
                            <div className="font-semibold text-ananael-gold/70">Reversed</div>
                            <p className="mt-1">{card.reversed}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="text-center text-zinc-400 py-8">
              No cards match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
