import { useMemo, useState } from 'react';
import { HEXAGRAMS } from '../data/iching';

export default function IChingReferencePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHexId, setExpandedHexId] = useState<number | null>(null);

  const filteredHexagrams = useMemo(() => {
    return HEXAGRAMS.filter((hex) => {
      return searchQuery === '' || 
        hex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hex.chinese.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hex.judgment.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const handleHexToggle = (hexNumber: number) => {
    setExpandedHexId(expandedHexId === hexNumber ? null : hexNumber);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Search */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search hexagram name or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md bg-ananael-panel px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-ananael-gold"
        />
      </div>

      {/* Hexagrams List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {filteredHexagrams.map((hex) => (
            <div key={hex.number} className="space-y-1">
              <button
                type="button"
                onClick={() => handleHexToggle(hex.number)}
                className="flex w-full items-start justify-between rounded-md bg-ananael-panel/50 px-3 py-2 text-left transition hover:bg-ananael-panel"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-ananael-gold w-8">
                      {hex.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200">
                        {hex.name}
                      </div>
                      <div className="text-xs text-ananael-gold/60">
                        {hex.chinese}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="ml-2 text-ananael-gold/50 flex-shrink-0">
                  {expandedHexId === hex.number ? '▼' : '▶'}
                </span>
              </button>

              {expandedHexId === hex.number && (
                <div className="ml-11 space-y-3 rounded-md bg-ananael-surface/50 p-3 text-xs text-zinc-300">
                  <div>
                    <div className="font-semibold text-ananael-gold/70 mb-1">
                      Judgment
                    </div>
                    <p className="leading-relaxed">{hex.judgment}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-ananael-gold/70 mb-1">
                      Image
                    </div>
                    <p className="leading-relaxed">{hex.image}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredHexagrams.length === 0 && (
            <div className="text-center text-zinc-400 py-8">
              No hexagrams match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
