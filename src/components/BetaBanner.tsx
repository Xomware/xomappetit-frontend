'use client';
import { useEffect, useState } from 'react';
import { BETA_BANNER_STORAGE_KEY } from '@/lib/beta-banner';

const FEEDBACK_URL = 'https://github.com/Xomware/xomappetit-frontend/issues';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(BETA_BANNER_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(BETA_BANNER_STORAGE_KEY, '1');
    } catch {
      // Storage is blocked (private mode, disabled site data): the banner just comes back next visit.
    }
  }

  return (
    <section aria-label="Beta notice" className="beta-banner border-b border-zinc-800 bg-zinc-900">
      <div className="max-w-6xl mx-auto pl-4 pr-1 sm:pr-2 flex items-center gap-2">
        <p className="flex-1 py-2 text-sm leading-snug text-zinc-300">
          Xom Appétit is in beta — things may change or break.{' '}
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-coral-300 underline underline-offset-2 hover:text-coral-200 hover:decoration-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-400/50"
          >
            Feedback welcome<span className="sr-only"> (opens GitHub in a new tab)</span>
          </a>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss beta notice"
          className="h-11 w-11 sm:h-9 sm:w-9 shrink-0 grid place-items-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-400/50 motion-reduce:transition-none"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6.4 4.99 12 10.6l5.6-5.61 1.41 1.41L13.41 12l5.6 5.6-1.41 1.41L12 13.41l-5.6 5.6-1.41-1.41L10.59 12l-5.6-5.6L6.4 4.99z"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
