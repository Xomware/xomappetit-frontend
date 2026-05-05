'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useUsersById } from '@/lib/use-users-by-id';
import { useAuth } from '@/lib/auth-context';
import { recipesApi } from '@/lib/api';
import {
  Recipe,
  Tag,
  TAG_GROUPS,
  TAG_LABELS,
  ProteinType,
  PROTEIN_TYPES,
  PROTEIN_LABELS,
} from '@/types';
import { RecipeCard } from '@/components/RecipeCard';
import Loader from '@/components/Loader';

export default function DiscoverPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const auth = useAuth();
  const [filterTags, setFilterTags] = useState<Tag[]>([]);
  const [filterProteins, setFilterProteins] = useState<ProteinType[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Refetch from page 1 whenever filters change. Server applies them, so
  // pagination cursor becomes invalid on a filter change.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    recipesApi
      .listPublic({
        limit: 50,
        tags: filterTags.length > 0 ? filterTags : undefined,
        proteinTypes: filterProteins.length > 0 ? filterProteins : undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setRecipes(res.items);
        setNextCursor(res.nextCursor);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, filterTags, filterProteins, auth.user?.sub]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const res = await recipesApi.listPublic({
        limit: 50,
        cursor: nextCursor,
        tags: filterTags.length > 0 ? filterTags : undefined,
        proteinTypes: filterProteins.length > 0 ? filterProteins : undefined,
      });
      setRecipes((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  const authorIds = useMemo(() => recipes.map((r) => r.authorUserId), [recipes]);
  const { map: users } = useUsersById(authorIds);
  const dataReady = isAuthenticated;
  const activeFilterCount = filterTags.length + filterProteins.length;

  const toggleTag = (t: Tag) =>
    setFilterTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleProtein = (p: ProteinType) =>
    setFilterProteins((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  const clearFilters = () => {
    setFilterTags([]);
    setFilterProteins([]);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">Discover</h2>
          <p className="text-sm text-zinc-400 mt-1">
            <span className="text-coral-400 font-semibold">{recipes.length}</span>{' '}
            public {recipes.length === 1 ? 'recipe' : 'recipes'} from the kitchen
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-coral-400/40 ${
            activeFilterCount > 0
              ? 'bg-coral-500/15 border-coral-500/40 text-coral-200'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-coral-500 text-white text-[10px] font-bold leading-4 min-w-[1rem] h-4 px-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-zinc-400 hover:text-coral-300 transition"
              >
                Clear all
              </button>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
              Protein
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROTEIN_TYPES.map((p) => {
                const on = filterProteins.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProtein(p)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      on
                        ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {PROTEIN_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {TAG_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map((t) => {
                  const on = filterTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        on
                          ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {TAG_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {!dataReady || authLoading || (loading && recipes.length === 0) ? (
        <Loader caption="finding recipes…" />
      ) : recipes.length === 0 ? (
        <EmptyDiscover hasFilters={activeFilterCount > 0} clear={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r.recipeId} recipe={r} author={users.get(r.authorUserId)} />
          ))}
        </div>
      )}

      {dataReady && nextCursor && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => loadMore()}
            disabled={loading}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-5 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-coral-400/40 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </main>
  );
}

function EmptyDiscover({
  hasFilters,
  clear,
}: {
  hasFilters: boolean;
  clear: () => void;
}) {
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
      <div className="text-5xl mb-3">🍽️</div>
      <h3 className="font-display text-2xl font-black uppercase tracking-wide">
        {hasFilters ? 'No matches' : 'Nothing public yet'}
      </h3>
      <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
        {hasFilters
          ? 'No public recipes match every filter you picked.'
          : 'When chefs publish recipes, they show up here. Be the first.'}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={clear}
          className="mt-5 inline-block bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/recipes/new"
          className="mt-5 inline-block bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
        >
          Add a recipe
        </Link>
      )}
    </div>
  );
}
