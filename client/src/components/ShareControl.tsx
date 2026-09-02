import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { apiFetch } from '../lib/api';

export type ShareVisibility = 'private' | 'unlisted' | 'public';

interface ShareControlProps {
  type: string;
  id: string;
  endpoint: string;
  visibility?: ShareVisibility;
  onVisibilityChange?: (visibility: ShareVisibility) => void;
}

export default function ShareControl({
  type, id, endpoint, visibility = 'private', onVisibilityChange,
}: ShareControlProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ShareVisibility>(visibility);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const link = `${window.location.origin}/s/${type}/${id}`;

  useEffect(() => {
    let active = true;
    setQrDataUrl(null);
    QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 1, width: 256 })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setError('Unable to generate QR code.');
      });
    return () => {
      active = false;
    };
  }, [link]);

  const updateVisibility = async (next: ShareVisibility) => {
    setError(null);
    try {
      const response = await apiFetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(data.message || 'Unable to update sharing settings');
      setCurrent(next);
      onVisibilityChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update sharing settings');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setError(null);
    } catch {
      setError('Could not copy link. Please copy it manually.');
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setError(null); }}
        className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-2 text-sm text-zinc-100 hover:bg-ananael-violet/20">
        Share
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Share design">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-ananael-border bg-ananael-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ananael-gold">Share design</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-100" aria-label="Close">×</button>
            </div>
            <label className="block text-sm text-ananael-muted">Visibility
              <select value={current} onChange={(event) => void updateVisibility(event.target.value as ShareVisibility)}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-zinc-100">
                <option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option>
              </select>
            </label>
            <div className="flex items-center gap-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code for shared design" className="h-32 w-32 bg-white p-2" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center bg-white p-2 text-center text-xs text-black">
                  Generating QR code…
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-all text-xs text-ananael-muted">{link}</p>
                <button type="button" onClick={() => void copyLink()} className="mt-3 rounded-md border border-ananael-gold/50 px-3 py-2 text-sm text-ananael-gold">
                  {copied ? 'Copied' : 'Copy share link'}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
