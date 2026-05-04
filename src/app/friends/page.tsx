'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useFriends } from '@/lib/hooks';
import { usersApi } from '@/lib/users';
import Loader from '@/components/Loader';

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export default function FriendsPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const {
    friends,
    incomingPending,
    outgoingPending,
    isLoading,
    refresh,
    addFriend,
    respond,
    remove,
  } = useFriends();

  const [handle, setHandle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const dataReady = isAuthenticated && !isLoading;

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = handle.trim().toLowerCase();
    setError(null);
    setInfo(null);
    if (!HANDLE_REGEX.test(cleaned)) {
      setError('Handle must be 3–20 lowercase letters, numbers, or underscores.');
      return;
    }
    setPending(true);
    try {
      const target = await usersApi.getByHandle(cleaned);
      const res = await addFriend(target.userId);
      if (res.alreadyFriends) setInfo(`@${cleaned} is already your friend.`);
      else if (res.alreadyRequested) setInfo(`Already sent a request to @${cleaned}.`);
      else if (res.mutualRequest) setInfo(`Friends with @${cleaned}! (mutual request)`);
      else setInfo(`Request sent to @${cleaned}.`);
      setHandle('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t add friend.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wide">Friends</h2>
        <p className="text-sm text-zinc-400 mt-1">
          <span className="text-coral-400 font-semibold">{friends.length}</span>{' '}
          {friends.length === 1 ? 'friend' : 'friends'}
          {incomingPending.length > 0 && (
            <span className="ml-2 text-coral-300">
              · {incomingPending.length} pending {incomingPending.length === 1 ? 'request' : 'requests'}
            </span>
          )}
        </p>
      </div>

      {/* Add */}
      <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Add a friend
        </h3>
        <form onSubmit={submitAdd} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
            <input
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="someone"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-coral-400/40 focus:border-coral-400"
              disabled={pending}
            />
          </div>
          <button
            type="submit"
            disabled={pending || !handle.trim()}
            className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            {pending ? 'Sending…' : 'Send'}
          </button>
        </form>
        {error && <p role="alert" className="text-xs text-coral-300 mt-2">{error}</p>}
        {info && <p className="text-xs text-emerald-300 mt-2">{info}</p>}
      </section>

      {!dataReady || authLoading ? (
        <Loader caption="loading friends…" />
      ) : (
        <>
          {/* Incoming requests */}
          {incomingPending.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Incoming requests
              </h3>
              <ul className="space-y-2">
                {incomingPending.map((req) => (
                  <UserRow
                    key={req.userId}
                    userId={req.userId}
                    timestamp={req.requestedAt}
                    timestampLabel="requested"
                    actions={
                      <>
                        <SmallBtn primary onClick={() => respond(req.userId, 'accept')}>
                          Accept
                        </SmallBtn>
                        <SmallBtn onClick={() => respond(req.userId, 'decline')}>
                          Decline
                        </SmallBtn>
                      </>
                    }
                  />
                ))}
              </ul>
            </section>
          )}

          {/* Friends */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Friends
            </h3>
            {friends.length === 0 ? (
              <p className="text-sm text-zinc-500 italic py-4">
                No friends yet. Add one above or browse <Link href="/discover" className="text-coral-400 hover:text-coral-300">Discover</Link>.
              </p>
            ) : (
              <ul className="space-y-2">
                {friends.map((f) => (
                  <UserRow
                    key={f.userId}
                    userId={f.userId}
                    timestamp={f.since}
                    timestampLabel="friends since"
                    actions={
                      <SmallBtn onClick={() => remove(f.userId)}>Remove</SmallBtn>
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Outgoing pending */}
          {outgoingPending.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Pending (you sent)
              </h3>
              <ul className="space-y-2">
                {outgoingPending.map((req) => (
                  <UserRow
                    key={req.userId}
                    userId={req.userId}
                    timestamp={req.requestedAt}
                    timestampLabel="sent"
                    actions={
                      <SmallBtn onClick={() => remove(req.userId)}>Cancel</SmallBtn>
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function UserRow({
  userId,
  timestamp,
  timestampLabel,
  actions,
}: {
  userId: string;
  timestamp?: string;
  timestampLabel?: string;
  actions: React.ReactNode;
}) {
  // Truncate the userId for display until we resolve handles. Click goes
  // nowhere yet — handle/profile lookup by userId would need a new endpoint.
  return (
    <li className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
      <div className="min-w-0 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-coral-500 to-flame-500 grid place-items-center text-white font-black text-sm shrink-0">
          {userId.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <code className="text-sm font-mono text-zinc-300 truncate block">
            {userId.slice(0, 8)}…
          </code>
          {timestamp && (
            <p className="text-[11px] text-zinc-500">
              {timestampLabel} {new Date(timestamp).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">{actions}</div>
    </li>
  );
}

function SmallBtn({
  children,
  primary,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? 'bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md transition focus:outline-none focus:ring-2 focus:ring-coral-400/50'
          : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-coral-500/50 text-zinc-200 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-md transition focus:outline-none focus:ring-2 focus:ring-coral-400/40'
      }
    >
      {children}
    </button>
  );
}
