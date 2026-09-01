export interface ArtifactProps {
  artifact: {
    _id?: string;
    name?: string;
    kind?: string;
    targetType?: string;
    targetId?: number;
    userNotes?: string;
    config?: Record<string, any>;
    items?: Array<{ id: string; type: string; x: number; y: number; label?: string }>;
    notes?: string;
    date?: string | Date;
    tradition?: string;
    visibility?: string;
    [key: string]: any;
  };
}

export function TalismanViewer({ artifact }: ArtifactProps) {
  const name = artifact.name || 'Untitled Talisman';
  const kind = artifact.kind || 'Talisman';
  const config = artifact.config || {};
  const notes = artifact.notes || '';

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6 shadow-inner">
        <div className="mb-4 flex items-center justify-between border-b border-ananael-gold/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-ananael-gold">{name}</h2>
          <span className="rounded bg-ananael-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ananael-gold">
            {kind}
          </span>
        </div>

        {config.planet && (
          <p className="text-sm text-ananael-gold/80">
            <strong>Planet / Attribution:</strong> {String(config.planet)}
          </p>
        )}
        {config.intention && (
          <p className="mt-2 text-sm text-ananael-gold/80">
            <strong>Intention:</strong> {String(config.intention)}
          </p>
        )}
        {config.phrase && (
          <p className="mt-2 text-sm text-ananael-gold/80">
            <strong>Phrase / Verse:</strong> {String(config.phrase)}
          </p>
        )}

        {Object.keys(config).length > 0 && (
          <div className="mt-4 rounded bg-ananael-bg/80 p-4 font-mono text-xs text-ananael-gold/70 overflow-x-auto">
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}
      </div>

      {notes && (
        <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ananael-gold">Notes & Commentary</h3>
          <p className="whitespace-pre-wrap text-sm text-ananael-gold/90 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}

export function CircleViewer({ artifact }: ArtifactProps) {
  const name = artifact.name || 'Solomonic Circle';
  const tradition = artifact.tradition || artifact.config?.tradition || 'Goetia';
  const config = artifact.config || {};
  const notes = artifact.notes || '';

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6 shadow-inner">
        <div className="mb-4 flex items-center justify-between border-b border-ananael-gold/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-ananael-gold">{name}</h2>
          <span className="rounded bg-ananael-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ananael-gold">
            {tradition} Circle
          </span>
        </div>

        {config.spiritId && (
          <p className="text-sm text-ananael-gold/80">
            <strong>Associated Spirit:</strong> {config.spiritId}
          </p>
        )}
        {config.weekday && (
          <p className="mt-1 text-sm text-ananael-gold/80">
            <strong>Weekday:</strong> {config.weekday}
          </p>
        )}
        {config.rings && Array.isArray(config.rings) && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ananael-gold/70">Concentric Rings ({config.rings.length})</h4>
            <div className="space-y-1">
              {config.rings.map((ring: any, idx: number) => (
                <div key={idx} className="flex justify-between rounded bg-ananael-bg/50 px-3 py-1.5 text-xs text-ananael-gold/90">
                  <span className="font-medium">{ring.label || `Ring ${idx + 1}`}</span>
                  <span className="font-mono text-ananael-gold/70">{ring.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {notes && (
        <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ananael-gold">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ananael-gold/90 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}

export function RitualViewer({ artifact }: ArtifactProps) {
  const name = artifact.name || 'Ritual Layout';
  const items = artifact.items || [];
  const notes = artifact.notes || '';

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6 shadow-inner">
        <div className="mb-4 flex items-center justify-between border-b border-ananael-gold/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-ananael-gold">{name}</h2>
          <span className="rounded bg-ananael-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ananael-gold">
            Altar Layout ({items.length} items)
          </span>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((item, idx) => (
              <div key={idx} className="rounded border border-ananael-gold/20 bg-ananael-bg/60 p-3 text-xs">
                <span className="font-bold text-ananael-gold uppercase">{item.type}</span>
                {item.label && <p className="text-ananael-gold/80 font-medium mt-1">{item.label}</p>}
                <p className="text-ananael-gold/50 text-[10px] mt-0.5">Position: ({item.x}, {item.y})</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-ananael-gold/60">No items configured in layout.</p>
        )}
      </div>

      {notes && (
        <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ananael-gold">Ritual Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ananael-gold/90 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}

export function TreeNoteViewer({ artifact }: ArtifactProps) {
  const targetType = artifact.targetType || 'Sephira';
  const targetId = artifact.targetId ?? 1;
  const userNotes = artifact.userNotes || artifact.notes || '';

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6 shadow-inner">
        <div className="mb-4 flex items-center justify-between border-b border-ananael-gold/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-ananael-gold">
            Tree of Life Study Note
          </h2>
          <span className="rounded bg-ananael-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ananael-gold">
            {targetType} #{targetId}
          </span>
        </div>

        <div className="rounded-lg bg-ananael-bg/80 p-4 border border-ananael-gold/20">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ananael-gold/70">Practitioner Study Entry</h3>
          <p className="whitespace-pre-wrap text-sm text-ananael-gold/90 leading-relaxed">{userNotes || 'No commentary provided.'}</p>
        </div>
      </div>
    </div>
  );
}

export function OpusViewer({ artifact }: ArtifactProps) {
  const name = artifact.name || 'Opus Vessel';
  const config = artifact.config || {};
  const notes = artifact.notes || '';

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6 shadow-inner">
        <div className="mb-4 flex items-center justify-between border-b border-ananael-gold/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-ananael-gold">{name}</h2>
          <span className="rounded bg-ananael-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ananael-gold">
            Athanor Opus Vessel
          </span>
        </div>

        {config.stage && (
          <p className="text-sm text-ananael-gold/80">
            <strong>Alchemical Stage:</strong> <span className="uppercase text-ananael-gold">{String(config.stage)}</span>
          </p>
        )}

        {Object.keys(config).length > 0 && (
          <div className="mt-4 rounded bg-ananael-bg/80 p-4 font-mono text-xs text-ananael-gold/70 overflow-x-auto">
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}
      </div>

      {notes && (
        <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ananael-gold">Vessel Journal & Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ananael-gold/90 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}

export function PracticeViewer({ artifact }: ArtifactProps) {
  const name = artifact.name || 'Practice Vessel';
  const config = artifact.config || {};
  const notes = artifact.notes || '';

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6 shadow-inner">
        <div className="mb-4 flex items-center justify-between border-b border-ananael-gold/20 pb-3">
          <h2 className="font-display text-2xl font-bold text-ananael-gold">{name}</h2>
          <span className="rounded bg-ananael-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ananael-gold">
            Practice Vessel
          </span>
        </div>

        {config.system && (
          <p className="text-sm text-ananael-gold/80">
            <strong>System:</strong> <span className="capitalize text-ananael-gold">{String(config.system)}</span>
          </p>
        )}

        {Object.keys(config).length > 0 && (
          <div className="mt-4 rounded bg-ananael-bg/80 p-4 font-mono text-xs text-ananael-gold/70 overflow-x-auto">
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}
      </div>

      {notes && (
        <div className="rounded-lg border border-ananael-gold/30 bg-ananael-card/60 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ananael-gold">Practice Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ananael-gold/90 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}
