'use client';
import Link from 'next/link';
import { Recipe, TAG_LABELS } from '@/types';
import { PublicUserProfile } from '@/lib/users';
import { PrivacyBadge } from './PrivacyBadge';
import LikeButton from './LikeButton';

interface Props {
  recipe: Recipe;
  /** Public profile of the recipe author, when resolved. */
  author?: PublicUserProfile | null;
}

export function RecipeCard({ recipe, author }: Props) {
  const handle = author?.preferredUsername ?? recipe.authorHandle ?? null;
  const name = author?.displayName ?? null;
  const avatarUrl = author?.avatarUrl ?? null;
  const initial = (name || handle || '?').charAt(0).toUpperCase();
  // Difficulty is 1..5 going forward, but back-compat for any unmigrated rows.
  const diff = typeof recipe.difficulty === 'number' ? recipe.difficulty : 3;
  const tags = recipe.tags ?? [];
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
          <div className="text-xs flex items-center gap-1.5 mt-0.5 text-zinc-400">
            <DifficultyDots value={diff} />
            {recipe.timeMinutes > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span>{recipe.timeMinutes}m</span>
              </>
            )}
            {recipe.servings > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span>{recipe.servings} {recipe.servings === 1 ? 'serv' : 'servs'}</span>
              </>
            )}
          </div>
        </div>
        <PrivacyBadge privacy={recipe.privacy} />
      </div>

      {recipe.description && (
        <p className="text-xs text-zinc-400 line-clamp-2">{recipe.description}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="inline-block bg-zinc-800/80 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded-full"
            >
              {TAG_LABELS[t] ?? t}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="inline-block text-[10px] text-zinc-500 px-1">
              +{tags.length - 4}
            </span>
          )}
        </div>
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
          {recipe.ratingCount > 0 && recipe.avgRating != null && (
            <span className="flex items-center gap-1 shrink-0">
              <span className="text-coral-300">★</span>
              <span className="text-zinc-300 font-semibold">
                {recipe.avgRating.toFixed(1)}
              </span>
            </span>
          )}
        </div>
        {handle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.assign(`/u/view?handle=${encodeURIComponent(handle)}`);
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-coral-300 transition shrink-0 min-w-0"
            title={name || `@${handle}`}
          >
            <span className="h-5 w-5 rounded-full overflow-hidden bg-zinc-800 grid place-items-center shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[9px] font-black text-white bg-gradient-to-br from-coral-500 to-flame-500 h-full w-full grid place-items-center">
                  {initial}
                </span>
              )}
            </span>
            <span className="truncate max-w-[6rem]">{name || `@${handle}`}</span>
          </button>
        )}
      </div>
    </Link>
  );
}

function DifficultyDots({ value }: { value: number }) {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Difficulty ${v} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${
            n <= v ? 'bg-coral-400' : 'bg-zinc-700'
          }`}
        />
      ))}
    </span>
  );
}
