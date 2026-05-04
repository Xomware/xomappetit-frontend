'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import Brand from './Brand';
import Monster from './Monster';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered card layout shared by every /auth/* page.
 * Matches the Xom Appétit brand: dark zinc base, animated coral/flame
 * blobs + occasional lightning behind the content (Monster), banner mark
 * above the card.
 */
export default function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-zinc-950 overflow-hidden">
      <Monster />
      <div className="relative w-full max-w-md" style={{ zIndex: 1 }}>
        <div className="text-center mb-8">
          <Link
            href="/"
            aria-label="Xom Appétit home"
            className="inline-block focus:outline-none focus:ring-2 focus:ring-coral-400/50 rounded"
          >
            <Brand height={96} />
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6 sm:p-8 brand-stamp">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-black uppercase tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-zinc-400">{footer}</div>}
      </div>
    </div>
  );
}

/** Shared input class — coral focus ring, dark surface, generous padding. */
export const authInputClass =
  'w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-400/30 transition disabled:opacity-50';

/** Shared primary button class — gradient coral, uppercase, loud. */
export const authPrimaryBtnClass =
  'w-full rounded-lg bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-4 py-2.5 transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50 disabled:opacity-60 disabled:cursor-not-allowed';

/** Shared secondary button — used for the Google stub. */
export const authSecondaryBtnClass =
  'w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold px-4 py-2.5 transition border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:opacity-60';
