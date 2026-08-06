import { useMemo, useState } from 'react';
import {
  SCRIPTS,
  transliterate,
  type ScriptId,
} from '../lib/transliterate';

/**
 * Script Translator: Latin ↔ Hebrew / Greek / Elder Futhark (transliteration only).
 */
export default function ScriptTranslatorModule() {
  const [source, setSource] = useState<ScriptId>('latin');
  const [target, setTarget] = useState<ScriptId>('hebrew');
  const [input, setInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const result = useMemo(
    () => transliterate(input, source, target),
    [input, source, target]
  );

  const swap = () => {
    setSource(target);
    setTarget(source);
    setInput(result.output);
    setCopyStatus(null);
  };

  const copyOutput = async () => {
    setCopyStatus(null);
    try {
      await navigator.clipboard.writeText(result.output);
      setCopyStatus('Copied.');
    } catch {
      setCopyStatus('Clipboard unavailable.');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Script Translator
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Phonetic and traditional letter mapping between Latin, Hebrew, Greek,
          and Elder Futhark. This is transliteration — not semantic translation.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm text-ananael-muted">
          From
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as ScriptId);
              setCopyStatus(null);
            }}
            className="mt-1 block min-w-[10rem] rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          >
            {SCRIPTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={swap}
          className="rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-ananael-violet hover:text-ananael-gold"
          aria-label="Swap scripts"
        >
          ⇄ Swap
        </button>

        <label className="block text-sm text-ananael-muted">
          To
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value as ScriptId);
              setCopyStatus(null);
            }}
            className="mt-1 block min-w-[10rem] rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          >
            {SCRIPTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <label className="block text-sm text-ananael-muted">
          Input
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCopyStatus(null);
            }}
            rows={8}
            placeholder="Type or paste text…"
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            dir="auto"
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ananael-muted">Output</span>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!result.output}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-40"
            >
              Copy
            </button>
          </div>
          <div
            className="min-h-[12rem] whitespace-pre-wrap rounded-md border border-ananael-border/50 bg-ananael-surface/40 px-3 py-2 text-sm text-zinc-100"
            dir="auto"
          >
            {result.output || (
              <span className="text-zinc-600">Transliteration appears here.</span>
            )}
          </div>
          {copyStatus && <p className="text-xs text-zinc-500">{copyStatus}</p>}
          {result.unmapped.length > 0 && (
            <p className="text-xs text-zinc-500">
              Unmapped: {Array.from(new Set(result.unmapped)).join(' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
