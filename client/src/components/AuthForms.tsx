import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

/**
 * Compact login / register panel for the dashboard header area.
 */
export default function AuthForms() {
  const { login, register, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return (
      <div className="rounded-lg border border-ananael-border/70 bg-ananael-panel/60 px-4 py-3 text-sm text-zinc-300">
        Welcome back, <span className="text-ananael-gold">{user.username}</span>. Your
        readings can be saved to your profile.
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-ananael-border/70 bg-ananael-panel/60 p-4">
      <div className="mb-3 flex gap-2">
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

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        {mode === 'register' && (
          <label className="flex flex-col gap-1 text-xs text-ananael-muted">
            Username
            <input
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
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
            className="rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
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
            className="rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-ananael-violet px-4 py-2 text-sm font-medium text-white transition hover:bg-ananael-violet-deep disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
