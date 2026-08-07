import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

interface AuthFormsProps {
  onSuccess?: () => void;
  /** Optional wrapper class for splash / modal layout variants. */
  className?: string;
}

/**
 * Login / register form for account modal and splash; shows welcome + sign out when authenticated.
 */
export default function AuthForms({ onSuccess, className }: AuthFormsProps) {
  const { login, register, logout, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return (
      <div className={['space-y-4', className].filter(Boolean).join(' ')}>
        <p className="text-sm text-zinc-300">
          Welcome back, <span className="text-ananael-gold">{user.username}</span>.
          Your readings can be saved to your profile.
        </p>
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
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
