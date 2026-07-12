import { BusFront, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../services/api-client';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900 p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white shadow-lg shadow-brand-950/40">
            <BusFront size={24} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-white">TransitOps</h1>
            <p className="text-sm text-slate-400">Operations Control Login</p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm text-slate-300">
          <LockKeyhole size={16} className="text-brand-400" aria-hidden="true" />
          <span>Sign in to access your operations workspace.</span>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              placeholder="name@transitops.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          {error ? (
            <p className="rounded-md border border-rose-900/80 bg-rose-950/40 px-3 py-2 text-sm text-rose-200" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <LoaderCircle className="animate-spin" size={18} aria-hidden="true" /> : null}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}
