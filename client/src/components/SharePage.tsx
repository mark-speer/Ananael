import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CreatorCard, type PublicCreator } from './share/CreatorCard';
import {
  TalismanViewer,
  CircleViewer,
  RitualViewer,
  TreeNoteViewer,
  OpusViewer,
  PracticeViewer,
} from './share/ArtifactViewers';

interface PublicArtifact {
  _id?: string;
  name?: string;
  kind?: string;
  targetType?: string;
  targetId?: number;
  userNotes?: string;
  config?: Record<string, unknown>;
  items?: Array<{ id: string; type: string; x: number; y: number; label?: string }>;
  notes?: string;
  date?: string | Date;
  tradition?: string;
  visibility?: string;
  creator?: PublicCreator | null;
}

const API_PATHS: Record<string, string> = {
  talisman: '/talisman',
  talismans: '/talisman',
  circle: '/solomonic',
  solomonic: '/solomonic',
  circles: '/solomonic',
  ritual: '/ritual',
  layout: '/ritual',
  layouts: '/ritual',
  tree: '/tree',
  treenote: '/tree',
  notes: '/tree',
  opus: '/opus',
  vessel: '/opus',
  practice: '/practice',
};

const SUPPORTED_TYPES = new Set(Object.keys(API_PATHS));

/**
 * SharePage component
 * 
 * Renders a specific resource (talisman, circle, ritual, etc.) by type and ID.
 * Handles cold-load scenarios where users access a shareable link.
 * 
 * URL pattern: /s/:type/:id
 * Example: /s/talisman/abc123
 */
export default function SharePage() {
  const { type = '', id = '' } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<PublicArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    async function fetchPublicResource() {
      try {
        setLoading(true);
        setError(null);
        const normalizedType = type.toLowerCase().trim();
        const apiPath = mapTypeToApiPath(normalizedType);
        if (!apiPath) {
          throw new Error('This share link uses an unsupported artifact type.');
        }
        const res = await fetch(`/api${apiPath}/${encodeURIComponent(id)}/public`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('This artifact is private and cannot be viewed via share link.');
          }
          if (res.status === 404) {
            throw new Error('Artifact not found.');
          }
          throw new Error(`Failed to load artifact (${res.status})`);
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading this shared resource.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (type && id) {
      fetchPublicResource();
    } else {
      setLoading(false);
      setError('Invalid share link.');
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [type, id]);

  function mapTypeToApiPath(t: string): string | null {
    return SUPPORTED_TYPES.has(t) ? API_PATHS[t] : null;
  }

  function renderArtifactViewer() {
    if (!data) return null;
    const normType = (type || '').toLowerCase().trim();
    switch (normType) {
      case 'talisman':
      case 'talismans':
        return <TalismanViewer artifact={data} />;
      case 'circle':
      case 'solomonic':
      case 'circles':
        return <CircleViewer artifact={data} />;
      case 'ritual':
      case 'layout':
      case 'layouts':
        return <RitualViewer artifact={data} />;
      case 'tree':
      case 'treenote':
      case 'notes':
        return <TreeNoteViewer artifact={data} />;
      case 'opus':
      case 'vessel':
        return <OpusViewer artifact={data} />;
      case 'practice':
        return <PracticeViewer artifact={data} />;
      default:
        return <TalismanViewer artifact={data} />;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ananael-bg font-display text-ananael-gold">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ananael-gold border-t-transparent"></div>
          <h1 className="text-xl">Loading shared {type}…</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ananael-bg p-4 font-display text-ananael-gold">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-ananael-gold/40 bg-ananael-card p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ananael-gold/10 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold">Unable to View Shared Link</h1>
          <p className="text-sm text-ananael-gold/80">{error}</p>
          <div className="pt-4">
            <Link
              to="/"
              className="inline-block rounded-lg bg-ananael-gold/20 px-6 py-2.5 font-semibold text-ananael-gold transition-colors hover:bg-ananael-gold/30"
            >
              Return to Ananael
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creator: PublicCreator | null = data?.creator || null;

  return (
    <div className="min-h-screen bg-ananael-bg px-4 py-8 font-display text-ananael-gold sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header Branding */}
        <header className="flex items-center justify-between border-b border-ananael-gold/30 pb-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-wider text-ananael-gold">
              ANANAEL
            </span>
          </Link>
          <span className="rounded bg-ananael-gold/10 px-3 py-1 text-xs text-ananael-gold/70">
            Shared Artifact
          </span>
        </header>

        {/* Creator Attribution */}
        {creator && <CreatorCard creator={creator} />}

        {/* Artifact Main Display */}
        <main>{renderArtifactViewer()}</main>

        {/* Footer */}
        <footer className="border-t border-ananael-gold/20 pt-8 text-center text-xs text-ananael-gold/60">
          <p className="mb-2">
            Created and shared via <strong className="text-ananael-gold">Ananael</strong> — Private Practitioner OS.
          </p>
          <Link
            to="/"
            className="text-ananael-gold underline transition-colors hover:text-ananael-gold/80"
          >
            Explore Ananael
          </Link>
        </footer>
      </div>
    </div>
  );
}
