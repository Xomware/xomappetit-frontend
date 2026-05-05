'use client';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { searchApi, usersSearchApi } from '@/lib/api';
import { PublicUserProfile } from '@/lib/users';
import { useUsersById } from '@/lib/use-users-by-id';
import { Recipe } from '@/types';
import { RecipeCard } from '@/components/RecipeCard';
import Loader from '@/components/Loader';

export default function SearchPage() {
  return (
    <Suspense fallback={<Loader caption="loading…" />}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve recipe authors for card display.
  const { map: authorMap } = useUsersById(recipes.map((r) => r.authorUserId));

  useEffect(() => {
    if (!isAuthenticated || !q.trim() || q.trim().length < 2) {
      setRecipes([]);
      setUsers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.allSettled([searchApi.recipes(q), usersSearchApi.byHandlePrefix(q)])
      .then(([rRes, uRes]) => {
        if (cancelled) return;
        setRecipes(rRes.status === 'fulfilled' ? rRes.value.items : []);
        setUsers(uRes.status === 'fulfilled' ? uRes.value.users : []);
        if (rRes.status === 'rejected' && uRes.status === 'rejected') {
          setError('Search failed. Try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, q]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setQ(draft.trim());
  };

  if (authLoading) return <Loader fullscreen />;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wide">Search</h2>
        <p className="text-sm text-zinc-400 mt-1">Recipes by name, people by handle.</p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="search"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="pad thai, @dom, …"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-coral-400/40 focus:border-coral-400"
        />
        <button
          type="submit"
          disabled={draft.trim().length < 2}
          className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
        >
          Search
        </button>
      </form>

      {error && <p role="alert" className="text-coral-300 text-sm">{error}</p>}

      {loading ? (
        <Loader caption="searching…" />
      ) : !q ? (
        <p className="text-sm text-zinc-500 italic py-8">
          Type at least 2 characters to search.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              People {users.length > 0 && <span className="text-zinc-600">· {users.length}</span>}
            </h3>
            {users.length === 0 ? (
              <p className="text-zinc-500 italic text-sm">No matching handles.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {users.map((u) => (
                  <li key={u.userId}>
                    <Link
                      href={u.preferredUsername ? `/u/view?handle=${encodeURIComponent(u.preferredUsername)}` : '#'}
                      className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 hover:border-coral-500/50 rounded-lg p-3 transition"
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="h-full w-full grid place-items-center bg-gradient-to-br from-coral-500 to-flame-500 text-white text-sm font-black">
                            {(u.displayName || u.preferredUsername || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">
                          {u.displayName || `@${u.preferredUsername}`}
                        </p>
                        {u.preferredUsername && (
                          <p className="text-[11px] text-zinc-500">@{u.preferredUsername}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recipes {recipes.length > 0 && <span className="text-zinc-600">· {recipes.length}</span>}
            </h3>
            {recipes.length === 0 ? (
              <p className="text-zinc-500 italic text-sm">No matching recipes.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((r) => (
                  <RecipeCard key={r.recipeId} recipe={r} author={authorMap.get(r.authorUserId)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
