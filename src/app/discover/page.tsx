'use client';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { usePublicRecipes } from '@/lib/hooks';
import { useUsersById } from '@/lib/use-users-by-id';
import { RecipeCard } from '@/components/RecipeCard';
import Loader from '@/components/Loader';

export default function DiscoverPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { recipes, nextCursor, isLoading, loadMore } = usePublicRecipes();
  const { map: users } = useUsersById(recipes.map((r) => r.authorUserId));
  const dataReady = isAuthenticated && !isLoading;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wide">Discover</h2>
        <p className="text-sm text-zinc-400 mt-1">
          <span className="text-coral-400 font-semibold">{recipes.length}</span>{' '}
          public {recipes.length === 1 ? 'recipe' : 'recipes'} from the kitchen
        </p>
      </div>

      {!dataReady || authLoading ? (
        <Loader caption="finding recipes…" />
      ) : recipes.length === 0 ? (
        <EmptyDiscover />
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
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-5 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
          >
            Load more
          </button>
        </div>
      )}
    </main>
  );
}

function EmptyDiscover() {
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
      <div className="text-5xl mb-3">🍽️</div>
      <h3 className="font-display text-2xl font-black uppercase tracking-wide">
        Nothing public yet
      </h3>
      <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
        When chefs publish recipes, they show up here. Be the first.
      </p>
      <Link
        href="/recipes/new"
        className="mt-5 inline-block bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
      >
        Add a recipe
      </Link>
    </div>
  );
}
