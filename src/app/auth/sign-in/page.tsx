'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import AuthShell, {
  authInputClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from '@/components/AuthShell';
import { useAuth } from '@/lib/auth-context';

export default function SignInPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextPath(): string {
    if (typeof window === 'undefined') return '/';
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    return next && next.startsWith('/') ? next : '/';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.kind === 'success') {
      window.location.replace(nextPath());
      return;
    }
    if (result.kind === 'requires-confirmation') {
      const target = `/auth/verify?email=${encodeURIComponent(result.email)}`;
      window.location.assign(target);
      return;
    }
    setError(result.message);
  }

  return (
    <AuthShell
      title="Welcome back, chef"
      subtitle="Sign in to log meals and roast your own cooking."
      footer={
        <>
          New here?{' '}
          <Link className="text-coral-400 hover:text-coral-300 font-semibold" href="/auth/sign-up">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-coral-400 hover:text-coral-300"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="••••••••"
            disabled={submitting}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="text-sm text-coral-300 bg-coral-500/10 border border-coral-500/30 rounded-lg px-3 py-2"
          >
            {error}
          </div>
        )}

        <button type="submit" className={authPrimaryBtnClass} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs uppercase tracking-wider text-zinc-600">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className={authSecondaryBtnClass}
          aria-label="Sign in with Google"
          disabled={submitting}
        >
          Sign in with Google
        </button>
      </form>
    </AuthShell>
  );
}
