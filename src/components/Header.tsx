'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useFriends, useNotifications } from '@/lib/hooks';
import Brand from './Brand';

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              aria-label="Xom Appétit home"
              className="inline-flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-coral-400/50 rounded"
            >
              <Brand height={44} className="hidden sm:block" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="Xom Appétit"
                className="sm:hidden h-9 w-9 rounded-md"
                draggable={false}
              />
            </Link>
            <span className="px-2 py-0.5 rounded-md border border-coral-400/40 bg-coral-500/10 text-[11px] font-bold uppercase tracking-wider text-coral-300 select-none">
              Beta
            </span>
          </div>

          {/* Desktop cluster */}
          <div className="hidden sm:flex items-center gap-2">
            <NavLinks />
            <NotificationsBell />
            <UserMenu />
          </div>

          {/* Mobile cluster */}
          <div className="sm:hidden flex items-center gap-1">
            <NotificationsBell />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              className="h-10 w-10 grid place-items-center rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function NavLinks() {
  const pathname = usePathname() || '/';
  const isFeed = pathname === '/' || pathname.startsWith('/recipes');
  const isDiscover = pathname.startsWith('/discover') || pathname.startsWith('/u/');
  const isSearch = pathname.startsWith('/search');
  const isFriends = pathname.startsWith('/friends');
  const isCooks = pathname.startsWith('/cooks');

  const { incomingPending } = useFriends();
  const friendsBadge = incomingPending.length;

  return (
    <nav className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
      <NavLink href="/" active={isFeed}>Feed</NavLink>
      <NavLink href="/discover" active={isDiscover}>Discover</NavLink>
      <NavLink href="/search" active={isSearch}>Search</NavLink>
      <NavLink href="/friends" active={isFriends} badge={friendsBadge}>Friends</NavLink>
      <NavLink href="/cooks" active={isCooks}>Cooks</NavLink>
    </nav>
  );
}

function NavLink({ href, active, badge, children }: { href: string; active: boolean; badge?: number; children: React.ReactNode }) {
  const cls = active
    ? 'bg-zinc-800 text-coral-300'
    : 'text-zinc-400 hover:text-white hover:bg-zinc-800';
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${cls}`}
    >
      {children}
      {badge && badge > 0 ? (
        <span
          aria-label={`${badge} pending`}
          className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full bg-coral-500 text-[10px] leading-4 font-bold text-white text-center"
        >
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

function NotificationsBell() {
  const pathname = usePathname() || '/';
  const isActive = pathname.startsWith('/notifications');
  const { unreadCount } = useNotifications();

  const cls = isActive
    ? 'bg-zinc-800 text-coral-300'
    : 'text-zinc-400 hover:text-white hover:bg-zinc-800';

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      className={`relative inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-md transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${cls}`}
    >
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"
          fill="currentColor"
        />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute top-1 right-1 sm:top-0 sm:right-0 min-w-[1rem] h-4 px-1 rounded-full bg-coral-500 text-[10px] leading-4 font-bold text-white text-center"
          aria-hidden="true"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
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
        <span className="max-w-[8rem] truncate hidden md:inline">{label}</span>
        <span className="text-zinc-500" aria-hidden="true">▾</span>
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
          <Link
            role="menuitem"
            href="/blocks"
            className="block px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-coral-300 transition"
            onClick={() => setOpen(false)}
          >
            Blocked users
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

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();
  const { incomingPending } = useFriends();
  const { unreadCount } = useNotifications();
  const pathname = usePathname() || '/';

  // Close on route change so navigation feels native.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Esc + body scroll lock while drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const friendsBadge = incomingPending.length;
  const handle = profile?.preferredUsername ?? user?.preferredUsername;
  const label = profile?.displayName?.trim() || handle || 'You';
  const avatarUrl = profile?.avatarUrl ?? null;
  const initial = (label || 'U').charAt(0);

  const items: Array<{ href: string; label: string; active: boolean; badge?: number }> = [
    { href: '/', label: 'Feed', active: pathname === '/' || pathname.startsWith('/recipes') },
    { href: '/discover', label: 'Discover', active: pathname.startsWith('/discover') || pathname.startsWith('/u/') },
    { href: '/search', label: 'Search', active: pathname.startsWith('/search') },
    { href: '/friends', label: 'Friends', active: pathname.startsWith('/friends'), badge: friendsBadge },
    { href: '/cooks', label: 'Cooks', active: pathname.startsWith('/cooks') },
    { href: '/notifications', label: 'Notifications', active: pathname.startsWith('/notifications'), badge: unreadCount },
  ];

  return (
    <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-800">
          {isAuthenticated && user ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none focus:ring-2 focus:ring-coral-400/40 rounded-md -m-1 p-1"
            >
              <span className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white text-sm font-black uppercase">
                    {initial}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{label}</p>
                {handle && <p className="text-xs text-zinc-500 truncate">@{handle}</p>}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="" className="h-9 w-9 rounded-md" />
              <p className="text-sm font-semibold text-zinc-100">Xom Appétit</p>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="h-9 w-9 grid place-items-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6.4 4.99 12 10.6l5.6-5.61 1.41 1.41L13.41 12l5.6 5.6-1.41 1.41L12 13.41l-5.6 5.6-1.41-1.41L10.59 12l-5.6-5.6L6.4 4.99z"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={onClose}
              aria-current={it.active ? 'page' : undefined}
              className={`flex items-center justify-between px-4 py-3 text-base font-medium transition ${
                it.active
                  ? 'bg-zinc-900 text-coral-300 border-l-2 border-coral-400'
                  : 'text-zinc-200 hover:bg-zinc-900 hover:text-white border-l-2 border-transparent'
              }`}
            >
              <span>{it.label}</span>
              {it.badge && it.badge > 0 ? (
                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-coral-500 text-[11px] leading-5 font-bold text-white text-center">
                  {it.badge > 9 ? '9+' : it.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="border-t border-zinc-800 py-2">
          {isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                onClick={onClose}
                className="block px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900 hover:text-coral-300 transition"
              >
                Profile
              </Link>
              <Link
                href="/blocks"
                onClick={onClose}
                className="block px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900 hover:text-coral-300 transition"
              >
                Blocked users
              </Link>
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await signOut();
                  if (typeof window !== 'undefined') {
                    window.location.assign('/auth/sign-in');
                  }
                }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-900 hover:text-coral-300 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              onClick={onClose}
              className="block mx-4 my-2 text-center bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition shadow-lg shadow-coral-500/20"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
