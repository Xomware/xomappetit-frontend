'use client';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useFeed } from '@/lib/hooks';
import { RecipeCard } from '@/components/RecipeCard';
import { CookActivityCard } from '@/components/CookActivityCard';
import { MASCOTS, mascotFor } from '@/components/Mascot';
import Loader from '@/components/Loader';

/**
 * Home = Feed. Recipes from caller + accepted friends, newest first.
 *
 * Empty states are tiered:
 *   - 0 friends + 0 recipes: nudge to add a recipe and find friends
 *   - 0 friends + some recipes (yours): show them and prompt to find friends
 *   - has friends but feed empty: prompt to publish a recipe
 */
export default function Feed() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { items, friendCount, isLoading } = useFeed();
  const dataReady = isAuthenticated && !isLoading;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">Feed</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {friendCount > 0 ? (
              <>
                from you and{' '}
                <span className="text-coral-400 font-semibold">{friendCount}</span>{' '}
                {friendCount === 1 ? 'friend' : 'friends'}
              </>
            ) : (
              'just your kitchen for now'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/recipes/new"
            className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            + New recipe
          </Link>
        </div>
      </div>

      {!dataReady || authLoading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyFeed friendCount={friendCount} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            if (item.type === 'cook') {
              return (
                <CookActivityCard
                  key={`cook-${item.cook.cookId}`}
                  cook={item.cook}
                  recipe={item.recipe}
                />
              );
            }
            return (
              <RecipeCard key={`recipe-${item.recipe.recipeId}`} recipe={item.recipe} />
            );
          })}
        </div>
      )}
    </main>
  );
}

function EmptyFeed({ friendCount }: { friendCount: number }) {
  const mascot = MASCOTS[mascotFor('empty-feed')];
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
      <div className="text-5xl mb-3">{mascot.emoji}</div>
      <h2 className="font-display text-2xl font-black uppercase tracking-wide">
        {friendCount === 0 ? 'Find your kitchen crew' : 'Quiet in here'}
      </h2>
      <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
        {friendCount === 0
          ? 'Add friends to see their cooking, or post your first recipe so they can see yours.'
          : 'Your friends haven’t posted yet. Add one of your own.'}
      </p>
      <div className="mt-5 flex gap-2 justify-center flex-wrap">
        <Link
          href="/recipes/new"
          className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
        >
          New recipe
        </Link>
        {friendCount === 0 && (
          <>
            <Link
              href="/friends"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
            >
              Find friends
            </Link>
            <Link
              href="/discover"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
            >
              Discover
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
