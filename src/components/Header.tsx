'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import Brand from './Brand';

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Xom Appétit home"
          className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-coral-400/50 rounded"
        >
          <Brand height={44} />
        </Link>
        <div className="flex items-center gap-2">
          <NavLinks />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function NavLinks() {
  const pathname = usePathname() || '/';
  const isRecipes = pathname === '/' || pathname.startsWith('/recipes');
  const isDiscover = pathname.startsWith('/discover') || pathname.startsWith('/u/');
  const isCooks = pathname.startsWith('/cooks');

  return (
    <nav className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
      <NavLink href="/" active={isRecipes}>
        Recipes
      </NavLink>
      <NavLink href="/discover" active={isDiscover}>
        Discover
      </NavLink>
      <NavLink href="/cooks" active={isCooks}>
        Cooks
      </NavLink>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  const cls = active
    ? 'bg-zinc-800 text-coral-300'
    : 'text-zinc-400 hover:text-white hover:bg-zinc-800';
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${cls}`}
    >
      {children}
    </Link>
  );
}

function UserMenu() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/auth/sign-in"
        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
      >
        Sign in
      </Link>
    );
  }

  const handle = profile?.preferredUsername ?? user.preferredUsername;
  const label = profile?.displayName?.trim() || handle || 'You';
  const avatarUrl = profile?.avatarUrl ?? null;
  const initial = (label || 'U').charAt(0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${label}`}
        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-2 py-1 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
      >
        <span className="h-7 w-7 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white text-xs font-black uppercase">
              {initial}
            </span>
          )}
        </span>
        <span className="max-w-[8rem] truncate hidden sm:inline">{label}</span>
        <span className="text-zinc-500" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/40 overflow-hidden z-40"
        >
          <div className="px-3 py-2 border-b border-zinc-800">
            <div className="text-sm font-semibold text-zinc-100 truncate">{label}</div>
            {handle && <div className="text-xs text-zinc-500 truncate">@{handle}</div>}
          </div>
          <Link
            role="menuitem"
            href="/profile"
            className="block px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-coral-300 transition"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut();
              if (typeof window !== 'undefined') {
                window.location.assign('/auth/sign-in');
              }
            }}
            className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-coral-300 transition border-t border-zinc-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
