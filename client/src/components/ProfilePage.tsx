import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PublicUser {
  _id: string;
  username: string;
  createdAt: string;
  traditions?: string[];
  profileImageUrl?: string;
}

interface ErrorResponse {
  message: string;
}

type LoadingState = 'loading' | 'success' | 'error' | 'private';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [state, setState] = useState<LoadingState>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!username) {
      setState('error');
      setError('No username provided');
      return;
    }

    async function fetchProfile() {
      try {
        setState('loading');
        const response = await fetch(
          `/api/users/by-username/${encodeURIComponent(username!)}/public`
        );

        if (!response.ok) {
          if (response.status === 403) {
            setState('private');
            return;
          }
          if (response.status === 404) {
            setState('error');
            setError('Practitioner not found');
            return;
          }
          const errorData = (await response.json()) as ErrorResponse;
          setState('error');
          setError(errorData.message || 'Failed to load profile');
          return;
        }

        const data = (await response.json()) as PublicUser;
        setProfile(data);
        setState('success');
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    }

    fetchProfile();
  }, [username]);

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ananael-gold">
            {isOwnProfile ? 'Your Profile' : 'Practitioner Card'}
          </h1>
          <p className="text-ananael-text/60">
            {isOwnProfile
              ? 'Manage your public presence'
              : 'View this practitioner\'s profile'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-ananael-panel text-ananael-text transition hover:bg-ananael-panel/80"
          aria-label="Back to dashboard"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {state === 'loading' && (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="mb-4 animate-spin">
              <svg
                className="mx-auto h-8 w-8 text-ananael-gold"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-ananael-text/60">Loading profileâ€¦</p>
          </div>
        </div>
      )}

      {/* Private Profile */}
      {state === 'private' && (
        <div className="rounded-lg border border-ananael-border bg-ananael-panel p-8 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-ananael-text/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-ananael-text">This profile is private</p>
          <p className="mt-2 text-sm text-ananael-text/60">
            The practitioner has chosen to keep their profile private.
          </p>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-8 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-ananael-text">{error}</p>
        </div>
      )}

      {/* Success State - Profile Card */}
      {state === 'success' && profile && (
        <div className="rounded-lg border border-ananael-border bg-ananael-panel p-8">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="border-b border-ananael-border/40 pb-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-ananael-gold/20 to-ananael-gold/5 font-display text-2xl font-bold text-ananael-gold">
                    {profile.username?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl text-ananael-gold">
                    @{profile.username}
                  </h2>
                  <p className="mt-2 text-sm text-ananael-text/60">
                    Member since{' '}
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Traditions */}
              {profile.traditions && profile.traditions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase text-ananael-gold/60">
                    Traditions
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.traditions.map((tradition) => (
                      <span
                        key={tradition}
                        className="rounded-full border border-ananael-gold/40 bg-ananael-gold/5 px-3 py-1 text-sm text-ananael-gold/80"
                      >
                        {tradition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase text-ananael-gold/60">
                  Your Profile
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Profile editing is accessible via the Edit Profile button in the account modal
                      console.log('Open account modal to edit profile');
                    }}
                    className="rounded-lg bg-ananael-gold/10 px-4 py-2 text-ananael-gold transition hover:bg-ananael-gold/20"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/u/${profile.username}`;
                      navigator.clipboard.writeText(url);
                      // TODO: Show toast notification
                      alert('Profile link copied to clipboard');
                    }}
                    className="rounded-lg bg-ananael-panel px-4 py-2 text-ananael-text transition hover:bg-ananael-panel/80"
                  >
                    Copy Profile Link
                  </button>
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase text-ananael-gold/60">
                  Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/u/${profile.username}`;
                      navigator.clipboard.writeText(url);
                      // TODO: Show toast notification
                      alert('Profile link copied to clipboard');
                    }}
                    className="rounded-lg bg-ananael-gold/10 px-4 py-2 text-ananael-gold transition hover:bg-ananael-gold/20"
                  >
                    Copy Profile Link
                  </button>
                </div>
              </div>
            )}

            {/* Info Footer */}
            <div className="border-t border-ananael-border/40 pt-6">
              <p className="text-xs text-ananael-text/40">
                Public profiles are visible to all practitioners. Only the username,
                traditions, and join date are shown.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
