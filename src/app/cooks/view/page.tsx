'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth, useAuth } from '@/lib/auth-context';
import { useCook, useRecipe } from '@/lib/hooks';
import { useUsersById } from '@/lib/use-users-by-id';
import { CookForm, CookFormValues } from '@/components/CookForm';
import { IconRating, RATING_AXES } from '@/components/IconRating';
import { CookComments } from '@/components/CookComments';
import Loader from '@/components/Loader';
import { PublicUserProfile } from '@/lib/users';

export default function CookViewPage() {
  return (
    <Suspense fallback={<Fallback caption="loading cook…" />}>
      <CookViewInner />
    </Suspense>
  );
}

function CookViewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const cookId = params.get('id');
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const { cook, isLoading, error, edit, remove } = useCook(cookId);
  const { recipe } = useRecipe(cook?.recipeId ?? null);
  const { map: users } = useUsersById([
    ...(cook?.chefs ?? []),
    ...(cook?.diners ?? []),
  ]);
  const [editing, setEditing] = useState(false);

  if (authLoading || !isAuthenticated) return <Fallback caption="heating up…" />;
  if (!cookId) return <FullPageMessage caption="Missing cook id." backHref="/cooks" />;
  if (isLoading) return <Fallback caption="loading cook…" />;
  if (error || !cook) {
    return (
      <FullPageMessage
        caption={error?.message ? `Couldn't load: ${error.message}` : 'Cook unavailable'}
        backHref="/cooks"
      />
    );
  }

  const isChef = user ? cook.chefs.includes(user.sub) : false;

  const handleEditSubmit = async (values: CookFormValues) => {
    await edit({
      notes: values.notes,
      photoUrl: values.photoUrl,
      rating: values.rating,
      spiciness: values.spiciness,
      sweetness: values.sweetness,
      saltiness: values.saltiness,
      richness: values.richness,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Delete this cook session? This cannot be undone.');
      if (!ok) return;
    }
    await remove();
    router.push('/cooks');
  };

  if (editing) {
    return (
      <div>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black uppercase tracking-wide">
              Edit cook
            </h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-zinc-400 hover:text-coral-300 transition uppercase tracking-wider font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-200">Note:</span> cookedAt, chefs, and
            diners are immutable. Delete and re-log to change them.
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
            <CookForm
              initial={{
                cookedAt: cook.cookedAt,
                chefs: cook.chefs,
                diners: cook.diners,
                notes: cook.notes,
                photoUrl: cook.photoUrl,
                rating: cook.rating,
                spiciness: cook.spiciness,
                sweetness: cook.sweetness,
                saltiness: cook.saltiness,
                richness: cook.richness,
              }}
              showCookedAt
              cookedAtImmutable
              participantsImmutable
              submitLabel="Save changes"
              onSubmit={handleEditSubmit}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/cooks"
            className="text-xs text-zinc-400 hover:text-coral-300 transition uppercase tracking-wider font-semibold"
          >
            ← All cooks
          </Link>
          {recipe && (
            <Link
              href={`/recipes/view?id=${encodeURIComponent(recipe.recipeId)}`}
              className="text-xs text-coral-300 hover:text-coral-200 transition uppercase tracking-wider font-semibold"
            >
              View recipe →
            </Link>
          )}
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 brand-stamp space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-coral-300 font-semibold">
              Cook session
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wide mt-1">
              {recipe?.name ?? 'Recipe'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">{formatDate(cook.cookedAt)}</p>
          </div>

          {cook.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cook.photoUrl}
              alt=""
              className="w-full max-h-96 object-cover rounded-lg border border-zinc-800"
            />
          )}

          <div className="space-y-2 pt-1">
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Ratings
            </div>
            {RATING_AXES.every((a) =>
              ((cook as unknown as Record<string, number | null>)[a.key === 'overall' ? 'rating' : a.key] ?? null) === null,
            ) ? (
              <div className="text-xs text-zinc-500 italic">Not rated.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RATING_AXES.map((axis) => {
                  const cookKey = axis.key === 'overall' ? 'rating' : axis.key;
                  const v = (cook as unknown as Record<string, number | null>)[cookKey];
                  return (
                    <div
                      key={axis.key}
                      className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-zinc-300 font-semibold">{axis.label}</span>
                      {v != null ? (
                        <IconRating value={v} icon={axis.icon} size="sm" readOnly />
                      ) : (
                        <span className="text-[11px] text-zinc-600 italic">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cook.notes ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                Notes
              </div>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{cook.notes}</p>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic">No notes.</div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp space-y-4">
          <PeopleList
            title="Chefs"
            userIds={cook.chefs}
            users={users}
            highlightUserId={user?.sub ?? null}
          />
          <PeopleList
            title="Diners"
            userIds={cook.diners}
            users={users}
            highlightUserId={user?.sub ?? null}
          />
        </section>

        {isChef && (
          <section className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold uppercase tracking-wider py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-zinc-900 hover:bg-coral-900/40 border border-zinc-800 hover:border-coral-700 text-zinc-300 hover:text-coral-200 text-sm font-semibold uppercase tracking-wider py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
            >
              Delete
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
          <CookComments cookId={cook.cookId} />
        </section>
      </main>
    </div>
  );
}

function PeopleList({
  title,
  userIds,
  users,
  highlightUserId,
}: {
  title: string;
  userIds: string[];
  users: Map<string, PublicUserProfile>;
  highlightUserId: string | null;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
        {title} ({userIds.length})
      </div>
      {userIds.length === 0 ? (
        <div className="text-xs text-zinc-500 italic">none</div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {userIds.map((id) => (
            <PersonPill
              key={id}
              userId={id}
              profile={users.get(id)}
              isMe={id === highlightUserId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PersonPill({
  userId,
  profile,
  isMe,
}: {
  userId: string;
  profile: PublicUserProfile | undefined;
  isMe: boolean;
}) {
  const handle = profile?.preferredUsername;
  const name = profile?.displayName?.trim();
  const avatarUrl = profile?.avatarUrl;
  const label = isMe ? 'you' : name || (handle ? `@${handle}` : `${userId.slice(0, 6)}…`);
  const initial = (name || handle || '?').charAt(0).toUpperCase();

  const cls = isMe
    ? 'bg-coral-500/15 border-coral-500/40 text-coral-100'
    : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-coral-500/50 hover:text-coral-200';

  const inner = (
    <span className={`inline-flex items-center gap-2 text-xs font-medium pl-1 pr-3 py-1 rounded-full border transition ${cls}`}>
      <span className="h-6 w-6 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white text-[10px] font-black uppercase">
            {initial}
          </span>
        )}
      </span>
      <span className="truncate max-w-[10rem]">{label}</span>
    </span>
  );

  return (
    <li>
      {handle && !isMe ? (
        <Link href={`/u/view?handle=${encodeURIComponent(handle)}`}>{inner}</Link>
      ) : (
        inner
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Fallback({ caption = 'loading…' }: { caption?: string } = {}) {
  return <Loader fullscreen caption={caption} />;
}

function FullPageMessage({ caption, backHref }: { caption: string; backHref: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-coral-400 text-3xl" aria-hidden="true">
          🍳
        </div>
        <div className="text-zinc-400 text-sm mt-3">{caption}</div>
        <Link
          href={backHref}
          className="mt-5 inline-block bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
