'use client';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useBlocks } from '@/lib/hooks';
import { useUsersById } from '@/lib/use-users-by-id';
import Loader from '@/components/Loader';

export default function BlocksPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { blocked, isLoading, unblock } = useBlocks();
  const { map: users } = useUsersById(blocked.map((b) => b.userId));
  const dataReady = isAuthenticated && !isLoading;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wide">Blocked users</h2>
        <p className="text-sm text-zinc-400 mt-1">
          {blocked.length === 0
            ? 'no one'
            : `${blocked.length} ${blocked.length === 1 ? 'person' : 'people'}`}
        </p>
      </div>

      {!dataReady || authLoading ? (
        <Loader caption="loading…" />
      ) : blocked.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">
            You haven&apos;t blocked anyone. The ⋯ menu on a profile is where you start.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {blocked.map((b) => {
            const profile = users.get(b.userId);
            const handle = profile?.preferredUsername;
            const name = profile?.displayName || (handle ? `@${handle}` : `${b.userId.slice(0, 8)}…`);
            const initial = (name || '?').charAt(0).toUpperCase();
            return (
              <li
                key={b.userId}
                className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2"
              >
                <div className="min-w-0 flex items-center gap-3 flex-1">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
                    {profile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="h-full w-full grid place-items-center bg-gradient-to-br from-zinc-600 to-zinc-700 text-white font-black text-sm">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    {handle ? (
                      <Link
                        href={`/u/view?handle=${encodeURIComponent(handle)}`}
                        className="text-sm font-semibold text-zinc-100 hover:text-coral-300 transition truncate block"
                      >
                        {name}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-100 truncate">{name}</p>
                    )}
                    <p className="text-[11px] text-zinc-500">
                      blocked {new Date(b.blockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => unblock(b.userId)}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-coral-500/50 text-zinc-200 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-md transition focus:outline-none focus:ring-2 focus:ring-coral-400/40 shrink-0"
                >
                  Unblock
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
