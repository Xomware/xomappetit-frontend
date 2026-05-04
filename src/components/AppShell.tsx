'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * Persistent app chrome. Mounts once via the root layout, so navigating
 * between /, /cooks, /recipes/new, etc. does NOT remount the header — no
 * flicker, no layout shift.
 *
 * Auth pages (sign-in/up/verify/callback) stand alone with their own
 * AuthShell card, so we suppress the global header there.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const showHeader = !pathname.startsWith('/auth');
  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
}
