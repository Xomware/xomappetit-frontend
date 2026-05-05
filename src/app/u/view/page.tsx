'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth, useAuth } from '@/lib/auth-context';
import { useUserRecipes, useFriends } from '@/lib/hooks';
import { usersApi, PublicUserProfile } from '@/lib/users';
import { RecipeCard } from '@/components/RecipeCard';
import Loader from '@/components/Loader';
import UserActionsMenu from '@/components/UserActionsMenu';

export default function UserPage() {
  return (
    <Suspense fallback={<Loader fullscreen caption="loading profile…" />}>
      <UserPageInner />
    </Suspense>
  );
}

function UserPageInner() {
  const params = useSearchParams();
  const handle = params.get('handle')?.trim().toLowerCase() || null;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !handle) return;
    setProfileLoading(true);
    setProfileError(null);
    usersApi
      .getByHandle(handle)
      .then((p) => setProfile(p))
      .catch((err: Error) => setProfileError(err.message || 'User not found'))
      .finally(() => setProfileLoading(false));
  }, [isAuthenticated, handle]);

  const { recipes, isLoading: recipesLoading } = useUserRecipes(profile?.userId ?? null);

  if (authLoading) return <Loader fullscreen />;
  if (!handle) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-zinc-400">No handle in URL. Try <code className="text-coral-300">/u/view?handle=someone</code>.</p>
      </main>
    );
  }
  if (profileLoading) return <Loader caption="loading profile…" />;
  if (profileError || !profile) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center space-y-3">
        <h2 className="font-display text-2xl font-black uppercase">No such chef</h2>
        <p className="text-zinc-400 text-sm">
          Couldn&apos;t find <span className="text-coral-300">@{handle}</span>.
        </p>
        <Link href="/discover" className="inline-block text-coral-400 hover:text-coral-300 text-sm font-semibold">
          ← Back to Discover
        </Link>
      </main>
    );
  }

  const isPrivate = profile.profileVisibility === 'private';
  const isSelf = user?.sub === profile.userId;
  const initial = (profile.displayName || profile.preferredUsername || '?').charAt(0).toUpperCase();

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 grid place-items-center shrink-0">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white text-2xl font-black uppercase">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-black tracking-tight truncate">
            {profile.displayName || `@${profile.preferredUsername}`}
          </h1>
          {profile.preferredUsername && (
            <p className="text-sm text-zinc-400">@{profile.preferredUsername}</p>
          )}
        </div>
        {!isSelf && (
          <>
            <FriendButton targetUserId={profile.userId} />
            <UserActionsMenu
              targetUserId={profile.userId}
              targetHandle={profile.preferredUsername}
            />
          </>
        )}
      </header>

      {isPrivate && !isSelf ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <div className="text-5xl mb-3">🔒</div>
          <h3 className="font-display text-xl font-black uppercase tracking-wide">Private profile</h3>
          <p className="text-zinc-400 text-sm mt-2">
            This kitchen is closed to outsiders.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-black uppercase tracking-wide">
            {isSelf ? 'Your recipes' : 'Public recipes'}
          </h2>
          {recipesLoading ? (
            <Loader caption="loading recipes…" />
          ) : recipes.length === 0 ? (
            <p className="text-zinc-500 italic text-sm">No public recipes yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((r) => (
                <RecipeCard key={r.recipeId} recipe={r} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function FriendButton({ targetUserId }: { targetUserId: string }) {
  const { friends, incomingPending, outgoingPending, addFriend, respond, remove } = useFriends();
  const [busy, setBusy] = useState(false);

  const isFriend = friends.some((f) => f.userId === targetUserId);
  const incoming = incomingPending.find((r) => r.userId === targetUserId);
  const outgoing = outgoingPending.some((r) => r.userId === targetUserId);

  const wrap = (fn: () => Promise<unknown>) => async () => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  if (isFriend) {
    return (
      <button
        type="button"
        onClick={wrap(() => remove(targetUserId))}
        disabled={busy}
        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-coral-400/40 disabled:opacity-50 shrink-0"
      >
        ✓ Friends
      </button>
    );
  }
  if (incoming) {
    return (
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={wrap(() => respond(targetUserId, 'accept'))}
          disabled={busy}
          className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={wrap(() => respond(targetUserId, 'decline'))}
          disabled={busy}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    );
  }
  if (outgoing) {
    return (
      <button
        type="button"
        onClick={wrap(() => remove(targetUserId))}
        disabled={busy}
        className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 shrink-0"
      >
        Cancel request
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={wrap(() => addFriend(targetUserId))}
      disabled={busy}
      className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50 disabled:opacity-50 shrink-0"
    >
      + Add friend
    </button>
  );
}
