import { useParams } from 'react-router-dom';

/**
 * SharePage component
 * 
 * Renders a specific resource (talisman, circle, ritual, etc.) by type and ID.
 * This component handles cold-load scenarios where users access a shareable link.
 * 
 * In Phase 52, this will be fully implemented to:
 * - Load the resource from the database/cache
 * - Apply appropriate styling/branding
 * - Provide share/export options
 * 
 * URL pattern: /s/:type/:id
 * Example: /s/talisman/abc123
 */
export default function SharePage() {
  const { type = '', id = '' } = useParams<{ type: string; id: string }>();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ananael-bg font-display text-ananael-gold">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl">Loading {type}:{id}…</h1>
        <p className="text-sm text-ananael-gold/70">
          Fetching resource from server
        </p>
      </div>
    </div>
  );
}
