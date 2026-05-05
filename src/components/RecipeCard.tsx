'use client';
import Link from 'next/link';
import { Recipe } from '@/types';
import { PrivacyBadge } from './PrivacyBadge';
import LikeButton from './LikeButton';

interface Props {
  recipe: Recipe;
}

function diffColor(d: string) {
  return d === 'Easy'
    ? 'text-emerald-400'
    : d === 'Medium'
    ? 'text-amber-400'
    : 'text-coral-400';
}

export function RecipeCard({ recipe }: Props) {
  return (
    <Link
      href={`/recipes/view?id=${encodeURIComponent(recipe.recipeId)}`}
      className="group bg-zinc-900/60 border border-zinc-800 hover:border-coral-500/50 rounded-xl p-4 space-y-3 transition hover:shadow-lg hover:shadow-coral-500/10 focus:outline-none focus:ring-2 focus:ring-coral-400/50 block"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-base truncate group-hover:text-coral-300 transition">
            {recipe.name}
          </h3>
          <div className="text-xs flex items-center gap-1.5 mt-0.5">
            <span className={`font-semibold ${diffColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
            {recipe.timeMinutes > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-400">{recipe.timeMinutes}m</span>
              </>
            )}
          </div>
        </div>
        <PrivacyBadge privacy={recipe.privacy} />
      </div>

      {recipe.description && (
        <p className="text-xs text-zinc-400 line-clamp-2">{recipe.description}</p>
      )}

      {recipe.proteinSource && (
        <span className="inline-block bg-coral-500/15 text-coral-300 text-xs px-2 py-0.5 rounded-full">
          {recipe.proteinSource}
        </span>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 gap-2">
        <div className="text-xs text-zinc-500 flex items-center gap-3 min-w-0">
          <LikeButton
            recipeId={recipe.recipeId}
            initialCount={recipe.likeCount ?? 0}
            initialLiked={recipe.likedByMe ?? false}
            compact
          />
          <span className="truncate">
            <span className="text-zinc-300 font-semibold">{recipe.cookCount}</span>{' '}
            {recipe.cookCount === 1 ? 'cook' : 'cooks'}
          </span>
          {recipe.ratingCount > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <span className="text-coral-300">★</span>
              <span className="text-zinc-300 font-semibold">
                {recipe.avgRating.toFixed(1)}
              </span>
            </span>
          )}
        </div>
        {recipe.authorHandle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.assign(`/u/view?handle=${encodeURIComponent(recipe.authorHandle!)}`);
            }}
            className="text-xs text-zinc-500 hover:text-coral-300 transition shrink-0"
          >
            @{recipe.authorHandle}
          </button>
        )}
      </div>
    </Link>
  );
}
