'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthShell, {
  authInputClass,
  authPrimaryBtnClass,
} from '@/components/AuthShell';
import { useAuth } from '@/lib/auth-context';

export default function VerifyPage() {
  const { confirmSignUp, resendCode } = useAuth();
  const [email, setEmail] = useState('');
  // Opaque Cognito Username (UUID) from sign-up. confirmSignUp uses this
  // directly because email aliases aren't reliable on UNCONFIRMED users
  // (Cognito only enforces email uniqueness post-confirmation; alias
  // resolution returns ambiguous when multiple unconfirmed users share
  // an email and 400s the verify call).
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email');
    const u = params.get('username');
    if (e) setEmail(e);
    if (u) setUsername(u);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    // Prefer the UUID Username from sign-up. Fall back to email for
    // direct-URL access (e.g. confirmed users requesting a code).
    const identifier = username.trim() || email.trim();
    const result = await confirmSignUp(identifier, code.trim());
    setSubmitting(false);

    if (result.kind === 'success') {
      window.location.assign('/auth/sign-in');
      return;
    }
    setError(result.message);
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    const identifier = username.trim() || email.trim();
    if (!identifier) {
      setError('Enter your email first.');
      return;
    }
    setResending(true);
    const result = await resendCode(identifier);
    setResending(false);
    if (result.kind === 'success') {
      setInfo('Code resent. Check your inbox.');
    } else {
      setError(result.message);
    }
  }

  return (
    <AuthShell
      title="Confirm your email"
      subtitle="Drop the 6-digit code from your inbox to fire up your account."
      footer={
        <>
          <Link className="text-coral-400 hover:text-coral-300 font-semibold" href="/auth/sign-in">
            Back to sign in
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
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Confirmation code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={authInputClass}
            placeholder="123456"
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

        {info && (
          <div
            role="status"
            className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2"
          >
            {info}
          </div>
        )}

        <button type="submit" className={authPrimaryBtnClass} disabled={submitting}>
          {submitting ? 'Confirming…' : 'Confirm'}
        </button>

        <button
          type="button"
          onClick={onResend}
          className="w-full text-xs text-zinc-400 hover:text-coral-300 transition disabled:opacity-50"
          disabled={resending}
        >
          {resending ? 'Resending…' : 'Resend code'}
        </button>
      </form>
    </AuthShell>
  );
}
