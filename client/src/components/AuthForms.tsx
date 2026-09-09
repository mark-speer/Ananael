import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register' | 'settings';

interface AuthFormsProps {
  onSuccess?: () => void;
  /** Optional wrapper class for splash / modal layout variants. */
  className?: string;
}

/**
 * Login / register form for account modal and splash; shows welcome + sign out when authenticated.
 */
export default function AuthForms({ onSuccess, className }: AuthFormsProps) {
  const { login, register, logout, isAuthenticated, user, refetchUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>(
    user?.visibility || 'private'
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (isAuthenticated && user) {
    if (mode === 'settings') {
      const handleVisibilityChange = async (newVisibility: 'private' | 'unlisted' | 'public') => {
        setError(null);
        setSuccess(null);
        setSubmitting(true);
        try {
          const response = await fetch('/api/auth/me/visibility', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ visibility: newVisibility }),
          });

          if (!response.ok) {
            const data = await response.json() as { message?: string };
            throw new Error(data.message || 'Failed to update visibility');
          }

          setVisibility(newVisibility);
          setSuccess('Profile visibility updated');
          await refetchUser();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update visibility');
        } finally {
          setSubmitting(false);
        }
      };

      return (
        <div className={['space-y-6', className].filter(Boolean).join(' ')}>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-ananael-gold/60">
              Profile Settings
            </h3>

            <div className="space-y-3 rounded-lg border border-ananael-border/40 bg-ananael-panel/40 p-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ananael-gold/60">
                  Profile Visibility
                </label>
                <p className="text-xs text-ananael-text/60">
                  Choose who can see your profile at /u/{user.username}
                </p>
              </div>

              <div className="space-y-2">
                {(['private', 'unlisted', 'public'] as const).map((v) => (
                  <label key={v} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={visibility === v}
                      onChange={(e) => handleVisibilityChange(e.target.value as typeof v)}
                      disabled={submitting}
                      className="rounded border-ananael-border"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium capitalize text-ananael-text">
                        {v}
                      </div>
                      <div className="text-xs text-ananael-text/60">
                        {v === 'private' && 'Only you can see your profile'}
                        {v === 'unlisted' && 'Anyone with the link can see your profile'}
                        {v === 'public' && 'Your profile is visible to all practitioners'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-ananael-gold">{success}</p>}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-ananael-violet hover:text-ananael-gold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                onSuccess?.();
              }}
              className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-red-700 hover:text-red-400"
            >
              Sign out
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={['space-y-4', className].filter(Boolean).join(' ')}>
        <div className="space-y-2">
          <p className="text-sm text-zinc-300">
            Welcome back, <span className="text-ananael-gold">{user.username}</span>.
          </p>
          <p className="text-xs text-ananael-text/60">
            Your profile visibility is{' '}
            <span className="font-medium text-ananael-gold">{user.visibility || 'private'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode('settings');
            setError(null);
            setSuccess(null);
          }}
          className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-ananael-violet hover:text-ananael-gold"
        >
          Profile Settings
        </button>
        <button
          type="button"
          onClick={() => {
            navigate(`/u/${user.username}`);
            onSuccess?.();
          }}
          className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-ananael-violet hover:text-ananael-gold"
        >
          Edit Profile
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            onSuccess?.();
          }}
          className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-ananael-violet hover:text-ananael-gold"
        >
          Sign out
        </button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={[
            'rounded px-3 py-1 text-sm',
            mode === 'login'
              ? 'bg-ananael-violet/30 text-ananael-gold'
              : 'text-ananael-muted hover:text-zinc-200',
          ].join(' ')}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={[
            'rounded px-3 py-1 text-sm',
            mode === 'register'
              ? 'bg-ananael-violet/30 text-ananael-gold'
              : 'text-ananael-muted hover:text-zinc-200',
          ].join(' ')}
        >
          Register
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === 'register' && (
          <label className="flex flex-col gap-1 text-xs text-ananael-muted">
            Username
            <input
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet w-full"
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-ananael-muted">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet w-full"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ananael-muted">
          Password
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet w-full"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-ananael-violet px-4 py-2 text-sm font-medium text-white transition hover:bg-ananael-violet-deep disabled:opacity-60"
        >
          {submitting ? 'Please waitâ€¦' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
