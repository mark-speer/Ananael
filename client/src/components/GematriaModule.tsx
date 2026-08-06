import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  computeGematria,
  GEMATRIA_SYSTEMS,
  type GematriaSystemId,
} from '../lib/gematria';

/**
 * Gematria calculator: live totals, per-letter breakdown, optional profile save.
 */
export default function GematriaModule() {
  const { isAuthenticated, token } = useAuth();
  const [text, setText] = useState('');
  const [system, setSystem] = useState<GematriaSystemId>('hebrew_sofit');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => computeGematria(text, system), [text, system]);
  const activeMeta = GEMATRIA_SYSTEMS.find((s) => s.id === system)!;

  const saveQuery = async () => {
    if (!token || !text.trim()) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/gematria/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          system,
          total: result.total,
          notes,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save query');
      }
      setSaveStatus('Query saved to your profile.');
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Gematria</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Calculate letter values across Hebrew, Greek, and English systems.
          Guests may compute freely; sign in to archive queries.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <label className="block text-sm text-ananael-muted">
            Text
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSaveStatus(null);
              }}
              rows={4}
              placeholder="Enter Hebrew, Greek, or Latin letters…"
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              dir="auto"
            />
          </label>

          <label className="block text-sm text-ananael-muted">
            System
            <select
              value={system}
              onChange={(e) => {
                setSystem(e.target.value as GematriaSystemId);
                setSaveStatus(null);
              }}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            >
              {GEMATRIA_SYSTEMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-ananael-muted">{activeMeta.description}</p>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-ananael-muted">
            Total
          </p>
          <p className="mt-2 font-display text-5xl text-ananael-gold">
            {result.total}
          </p>
          {result.ignoredCount > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              {result.ignoredCount} character
              {result.ignoredCount === 1 ? '' : 's'} ignored
            </p>
          )}
        </div>
      </div>

      {text.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface/40">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                <th className="px-4 py-3 font-medium">Character</th>
                <th className="px-4 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((item, index) => (
                <tr
                  key={`${item.char}-${index}`}
                  className="border-b border-ananael-border/30 last:border-0"
                >
                  <td className="px-4 py-2 font-display text-lg text-zinc-100">
                    {item.char === ' ' ? '␣' : item.char}
                  </td>
                  <td
                    className={[
                      'px-4 py-2',
                      item.counted ? 'text-ananael-gold' : 'text-zinc-600',
                    ].join(' ')}
                  >
                    {item.counted ? item.value : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAuthenticated && text.trim().length > 0 && (
        <div className="max-w-xl space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel/50 p-4">
          <label className="block text-sm text-ananael-muted">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Correspondences, ritual context…"
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={saveQuery}
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Query to Profile'}
          </button>
          {saveStatus && <p className="text-sm text-zinc-400">{saveStatus}</p>}
        </div>
      )}
    </div>
  );
}
