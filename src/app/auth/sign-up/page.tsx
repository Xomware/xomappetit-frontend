'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import AuthShell, {
  authInputClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from '@/components/AuthShell';
import { useAuth } from '@/lib/auth-context';

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_HANDLES = new Set([
  'admin',
  'system',
  'xomappetit',
  'chef',
  'diner',
  'xomware',
  'support',
]);

function validateHandle(handle: string): string | null {
  if (!HANDLE_REGEX.test(handle)) {
    return 'Handle must be 3–20 lowercase letters, numbers, or underscores.';
  }
  if (RESERVED_HANDLES.has(handle)) {
    return 'That handle is reserved. Pick another.';
  }
  return null;
}

export default function SignUpPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedHandle = handle.trim().toLowerCase();
    const handleError = validateHandle(trimmedHandle);
    if (handleError) {
      setError(handleError);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password, trimmedHandle);
    setSubmitting(false);

    if (result.kind === 'success') {
      // Pass the opaque Username (UUID) so /auth/verify can call
      // confirmSignUp directly. Email-alias lookup is unreliable on
      // UNCONFIRMED users; passing the UUID is the safe path.
      const params = new URLSearchParams({
        email: result.email,
        username: result.username,
      });
      window.location.assign(`/auth/verify?${params.toString()}`);
      return;
    }
    setError(result.message);
  }

  return (
    <AuthShell
      title="Pull up a chair"
      subtitle="Create your account. Pick a handle — it's your kitchen ID."
      footer={
        <>
          Already cooking?{' '}
          <Link className="text-coral-400 hover:text-coral-300 font-semibold" href="/auth/sign-in">
            Sign in
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
          <label htmlFor="handle" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
            <input
              id="handle"
              type="text"
              autoComplete="username"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className={`${authInputClass} pl-7`}
              placeholder="hungry_chef"
              disabled={submitting}
              aria-describedby="handle-help"
              minLength={3}
              maxLength={20}
              pattern="^[a-z0-9_]{3,20}$"
            />
          </div>
          <p id="handle-help" className="text-xs text-zinc-500">
            3–20 chars · lowercase letters, numbers, underscores
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="At least 8 characters"
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
          {submitting ? 'Creating account…' : 'Create account'}
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
          aria-label="Continue with Google"
          disabled={submitting}
        >
          Continue with Google
        </button>
      </form>
    </AuthShell>
  );
}
