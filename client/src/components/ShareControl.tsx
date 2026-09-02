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
  const [updating, setUpdating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const link = `${window.location.origin}/s/${type}/${id}`;
  const canShare = 'share' in navigator;

  useEffect(() => {
    setCurrent(visibility);
  }, [visibility]);

  useEffect(() => {
    let active = true;
    if (!open) return undefined;

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
  }, [link, open]);

  const updateVisibility = async (next: ShareVisibility) => {
    setError(null);
    setUpdating(true);
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
    } finally {
      setUpdating(false);
    }
  };

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement('textarea');
        input.value = link;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        const copiedByFallback = document.execCommand('copy');
        input.remove();
        if (!copiedByFallback) throw new Error('Clipboard unavailable');
      }
      setCopied(true);
      setError(null);
    } catch {
      setError('Could not copy link. Please copy it manually.');
    }
  };

  const shareLink = async () => {
    if (!canShare) return;
    setSharing(true);
    try {
      await navigator.share({ title: 'Shared Ananael design', url: link });
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Could not open the device share dialog.');
    } finally {
      setSharing(false);
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
              <select value={current} disabled={updating} onChange={(event) => void updateVisibility(event.target.value as ShareVisibility)}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void copyLink()} className="rounded-md border border-ananael-gold/50 px-3 py-2 text-sm text-ananael-gold">
                    {copied ? 'Copied' : 'Copy share link'}
                  </button>
                  {canShare && (
                    <button type="button" onClick={() => void shareLink()} disabled={sharing}
                      className="rounded-md border border-ananael-violet/50 px-3 py-2 text-sm text-zinc-100 disabled:opacity-60">
                      {sharing ? 'Sharing…' : 'Share'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
