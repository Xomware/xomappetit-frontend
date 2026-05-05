'use client';
import { useEffect, useMemo, useState } from 'react';
import { useFriends } from '@/lib/hooks';
import { useUsersById } from '@/lib/use-users-by-id';
import { usersSearchApi } from '@/lib/api';
import { PublicUserProfile } from '@/lib/users';

interface Props {
  open: boolean;
  title: string;
  /** User IDs already selected. */
  selected: string[];
  /** User IDs to exclude entirely (e.g. chefs hidden from the diners picker). */
  excludeUserIds?: string[];
  onClose: () => void;
  onChange: (next: string[]) => void;
}

/**
 * Multi-select people picker. Shows friends first, then a network search by
 * handle prefix when the query has 2+ characters. Selected people stay pinned
 * at the top so removing one is one tap.
 *
 * Returns user IDs (Cognito sub) — the cook-log API takes these directly.
 */
export default function PeoplePickerModal({
  open,
  title,
  selected,
  excludeUserIds = [],
  onClose,
  onChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const { friends } = useFriends();
  // Resolve display profiles for friends + selected (selected may include
  // non-friends if the picker was used with handle search).
  const idsToResolve = useMemo(
    () => Array.from(new Set([...friends.map((f) => f.userId), ...selected])),
    [friends, selected],
  );
  const { map: profiles } = useUsersById(idsToResolve);

  const exclude = useMemo(() => new Set(excludeUserIds), [excludeUserIds]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Network search debounced lightly — we don't need a fancy debounce since
  // the results lazily render and Cognito search is ~200ms.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      usersSearchApi
        .byHandlePrefix(q, 12)
        .then((res) => {
          if (cancelled) return;
          setSearchResults(res.users);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  // Esc + body scroll lock
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSearchResults([]);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (userId: string) => {
    if (selectedSet.has(userId)) {
      onChange(selected.filter((x) => x !== userId));
    } else {
      onChange([...selected, userId]);
    }
  };

  // Build the rendered rows. Pinned selected first, then friends, then search.
  const friendIds = friends.map((f) => f.userId);
  const visibleFriendIds = friendIds.filter((id) => {
    if (exclude.has(id)) return false;
    if (!query.trim()) return true;
    const p = profiles.get(id);
    const haystack = `${p?.displayName ?? ''} ${p?.preferredUsername ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const seenInLists = new Set<string>([...selected, ...visibleFriendIds]);
  const searchOnlyResults = searchResults.filter(
    (u) => !seenInLists.has(u.userId) && !exclude.has(u.userId),
  );

  const selectedRows: { userId: string; profile: PublicUserProfile | undefined }[] = selected.map(
    (id) => ({ userId: id, profile: profiles.get(id) }),
  );
  const friendRows = visibleFriendIds
    .filter((id) => !selectedSet.has(id))
    .map((id) => ({ userId: id, profile: profiles.get(id) }));
  const searchRows = searchOnlyResults.map((u) => ({ userId: u.userId, profile: u }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 -z-10"
      />
      <div className="bg-zinc-950 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <header className="flex items-center justify-between gap-3 p-4 border-b border-zinc-800">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-black uppercase tracking-wide truncate">
              {title}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {selected.length} selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 grid place-items-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6.4 4.99 12 10.6l5.6-5.61 1.41 1.41L13.41 12l5.6 5.6-1.41 1.41L12 13.41l-5.6 5.6-1.41-1.41L10.59 12l-5.6-5.6L6.4 4.99z"
              />
            </svg>
          </button>
        </header>

        <div className="p-3 border-b border-zinc-800">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends or by @handle…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {selectedRows.length > 0 && (
            <Section label="Selected">
              {selectedRows.map(({ userId, profile }) => (
                <PersonRow
                  key={userId}
                  userId={userId}
                  profile={profile}
                  selected
                  onClick={() => toggle(userId)}
                />
              ))}
            </Section>
          )}

          {friendRows.length > 0 && (
            <Section label={query.trim() ? 'Matching friends' : 'Friends'}>
              {friendRows.map(({ userId, profile }) => (
                <PersonRow
                  key={userId}
                  userId={userId}
                  profile={profile}
                  selected={false}
                  onClick={() => toggle(userId)}
                />
              ))}
            </Section>
          )}

          {searching && (
            <p className="text-xs text-zinc-500 italic px-2 py-1">Searching…</p>
          )}

          {!searching && searchRows.length > 0 && (
            <Section label="Other people">
              {searchRows.map(({ userId, profile }) => (
                <PersonRow
                  key={userId}
                  userId={userId}
                  profile={profile}
                  selected={false}
                  onClick={() => toggle(userId)}
                />
              ))}
            </Section>
          )}

          {!searching &&
            selectedRows.length === 0 &&
            friendRows.length === 0 &&
            searchRows.length === 0 && (
              <p className="text-sm text-zinc-500 italic text-center py-8">
                {query.trim()
                  ? 'No matches. Try a different handle.'
                  : 'No friends yet. Add some in /friends or search by handle above.'}
              </p>
            )}
        </div>

        <footer className="border-t border-zinc-800 p-3 flex gap-2">
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-2 mb-1">
        {label}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function PersonRow({
  userId,
  profile,
  selected,
  onClick,
}: {
  userId: string;
  profile: PublicUserProfile | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const handle = profile?.preferredUsername;
  const name = profile?.displayName?.trim();
  const avatarUrl = profile?.avatarUrl;
  const headline = name || (handle ? `@${handle}` : `${userId.slice(0, 8)}…`);
  const subline = name && handle ? `@${handle}` : null;
  const initial = (name || handle || '?').charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
        selected
          ? 'bg-coral-500/15 hover:bg-coral-500/20'
          : 'bg-zinc-900/50 hover:bg-zinc-900'
      }`}
    >
      <span className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white text-sm font-black uppercase">
            {initial}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-sm font-semibold truncate ${selected ? 'text-coral-200' : 'text-zinc-100'}`}>
          {headline}
        </span>
        {subline && (
          <span className="block text-[11px] text-zinc-500 truncate">{subline}</span>
        )}
      </span>
      {selected && (
        <span className="text-coral-300 text-base shrink-0" aria-label="Selected">
          ✓
        </span>
      )}
    </button>
  );
}
