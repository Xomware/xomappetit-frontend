'use client';
import Link from 'next/link';
import { Cook, Recipe } from '@/types';

interface Props {
  cook: Cook;
  recipe: Recipe;
}

/**
 * Feed item shape for "X cooked Recipe Y on Z". Distinct visual from
 * RecipeCard so the user reads the feed as activity, not catalog.
 *
 * Tap goes to the cook detail (`/cooks/view`), with a secondary link
 * to the recipe itself in the body.
 */
export function CookActivityCard({ cook, recipe }: Props) {
  const date = new Date(cook.cookedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const chefHandle = recipe.authorHandle; // best signal we have for "who cooked"

  return (
    <Link
      href={`/cooks/view?id=${encodeURIComponent(cook.cookId)}`}
      className="group block bg-zinc-900/60 border-l-2 border-coral-500/50 border-t border-r border-b border-zinc-800 hover:border-coral-500/50 rounded-xl p-4 transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-coral-500 to-flame-500 grid place-items-center text-white text-xl shrink-0">
          🔥
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
            Cook session · {date}
          </p>
          <h3 className="font-bold text-base text-zinc-100 truncate group-hover:text-coral-300 transition">
            {chefHandle ? (
              <>
                <span className="text-coral-400">@{chefHandle}</span>{' '}
                <span className="text-zinc-400 font-normal">cooked</span>{' '}
                {recipe.name}
              </>
            ) : (
              <>Someone cooked {recipe.name}</>
            )}
          </h3>
          {cook.notes && (
            <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{cook.notes}</p>
          )}
          <div className="text-xs text-zinc-500 flex items-center gap-3 mt-2">
            {cook.rating != null && (
              <span className="flex items-center gap-1">
                <span className="text-coral-300">★</span>
                <span className="text-zinc-300 font-semibold">{cook.rating}/5</span>
              </span>
            )}
            {cook.diners.length > 0 && (
              <span>
                <span className="text-zinc-300 font-semibold">{cook.diners.length}</span>{' '}
                {cook.diners.length === 1 ? 'diner' : 'diners'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
