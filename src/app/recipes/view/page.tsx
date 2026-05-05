'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth, useAuth } from '@/lib/auth-context';
import { useRecipe } from '@/lib/hooks';
import { RecipeForm, RecipeFormValues } from '@/components/RecipeForm';
import { RecipeComments } from '@/components/RecipeComments';
import LikeButton from '@/components/LikeButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import {
  Ingredient,
  Instruction,
  TAG_LABELS,
  PROTEIN_LABELS,
  ingredientLabel,
  ingredientName,
  instructionText,
  normalizeInstruction,
} from '@/types';
import Loader from '@/components/Loader';
import { IconRating, RATING_AXES } from '@/components/IconRating';

export default function RecipeViewPage() {
  return (
    <Suspense fallback={<Loader fullscreen caption="loading recipe…" />}>
      <RecipeViewInner />
    </Suspense>
  );
}

function RecipeViewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const recipeId = params.get('id');
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const { recipe, isLoading, error, edit, remove } = useRecipe(recipeId);
  const [editing, setEditing] = useState(false);

  if (authLoading || !isAuthenticated) {
    return <Loader fullscreen />;
  }

  if (!recipeId) {
    return (
      <FullPageMessage emoji="🍳" caption="No recipe id in the URL." backHref="/" />
    );
  }

  if (isLoading) {
    return <Loader fullscreen caption="loading recipe…" />;
  }

  if (error || !recipe) {
    return (
      <FullPageMessage
        emoji="🍳"
        caption={error?.message ? `Couldn't load: ${error.message}` : 'Recipe unavailable'}
        backHref="/"
      />
    );
  }

  const isAuthor = user?.sub === recipe.authorUserId;

  const handleDelete = async () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`Delete "${recipe.name}"? This can't be undone.`);
      if (!ok) return;
    }
    await remove();
    router.push('/');
  };

  const handleEditSubmit = async (values: RecipeFormValues) => {
    await edit(values);
    setEditing(false);
  };

  if (editing) {
    return (
      <div>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black uppercase tracking-wide">
              Edit recipe
            </h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-zinc-400 hover:text-coral-300 transition uppercase tracking-wider font-semibold"
            >
              Cancel
            </button>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
            <RecipeForm initial={recipe} submitLabel="Save changes" onSubmit={handleEditSubmit} />
          </div>
        </main>
      </div>
    );
  }

  const ingredients = recipe.ingredients ?? [];
  const instructions = recipe.instructions ?? [];

  return (
    <div>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-coral-300 transition uppercase tracking-wider font-semibold"
          >
            ← All recipes
          </Link>
          <Link
            href={`/cooks/new?recipeId=${encodeURIComponent(recipe.recipeId)}`}
            className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            Log a cook
          </Link>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 brand-stamp space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wide">
                {recipe.name}
              </h1>
              {recipe.description && (
                <p className="mt-2 text-zinc-300">{recipe.description}</p>
              )}
            </div>
            <PrivacyBadge privacy={recipe.privacy} showFriendsHint />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <DifficultyDots value={typeof recipe.difficulty === 'number' ? recipe.difficulty : 3} />
            {recipe.timeMinutes > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span>{recipe.timeMinutes} min</span>
              </>
            )}
            {recipe.servings > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span>
                  {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                </span>
              </>
            )}
            {(recipe.proteinTypes ?? []).map((p) => (
              <span
                key={p}
                className="bg-coral-500/15 text-coral-300 px-2 py-0.5 rounded-full"
              >
                {PROTEIN_LABELS[p] ?? p}
              </span>
            ))}
            {recipe.proteinSource && (recipe.proteinTypes ?? []).length === 0 && (
              <span className="bg-coral-500/15 text-coral-300 px-2 py-0.5 rounded-full">
                {recipe.proteinSource}
              </span>
            )}
          </div>

          {(recipe.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="bg-zinc-800/80 text-zinc-300 text-[11px] px-2 py-0.5 rounded-full"
                >
                  {TAG_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <LikeButton
              recipeId={recipe.recipeId}
              initialCount={recipe.likeCount ?? 0}
              initialLiked={recipe.likedByMe ?? false}
            />
            <span className="text-xs text-zinc-500">
              {recipe.cookCount} {recipe.cookCount === 1 ? 'cook' : 'cooks'}
            </span>
            {recipe.ratingCount > 0 && recipe.avgRating != null && (
              <span className="text-xs text-zinc-500">
                ★ {recipe.avgRating.toFixed(1)} ({recipe.ratingCount})
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 pt-2">
            <Stat label="Cooks" value={String(recipe.cookCount)} />
            <Stat
              label="Avg rating"
              value={
                recipe.ratingCount > 0 && recipe.avgRating != null
                  ? recipe.avgRating.toFixed(1)
                  : '–'
              }
              hint={recipe.ratingCount > 0 ? `${recipe.ratingCount} ratings` : 'no ratings yet'}
            />
            <Stat
              label="Calories"
              value={recipe.macros?.calories ? String(recipe.macros.calories) : '–'}
            />
          </div>

          {recipe.macros && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 mt-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                Macros · {recipe.macrosScope === 'per-serving' ? 'per serving' : 'per recipe'}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  ['Cal', recipe.macros.calories],
                  ['Protein', `${recipe.macros.protein}g`],
                  ['Carbs', `${recipe.macros.carbs}g`],
                  ['Fat', `${recipe.macros.fat}g`],
                ].map(([label, val]) => (
                  <div key={label as string} className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {label}
                    </div>
                    <div className="font-bold text-base mt-0.5">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Ratings
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RATING_AXES.map((axis) => {
                const avg = (recipe as unknown as Record<string, number | null>)[axis.avgKey];
                const count = (recipe as unknown as Record<string, number>)[axis.countKey] ?? 0;
                return (
                  <div
                    key={axis.key}
                    className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="text-xs text-zinc-300 font-semibold">
                        {axis.label}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {count > 0 && avg != null
                          ? `avg ${avg.toFixed(1)} · ${count}`
                          : 'no ratings yet'}
                      </div>
                    </div>
                    {count > 0 && avg != null ? (
                      <IconRating value={Math.round(avg)} icon={axis.icon} size="sm" readOnly />
                    ) : (
                      <span className="text-[11px] text-zinc-600 italic">—</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 italic">
              Want to rate? Log a cook of this recipe — ratings live on the cook session.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Ingredients
          </h2>
          {ingredients.length === 0 ? (
            <div className="text-sm text-zinc-500 italic">No ingredients listed.</div>
          ) : (
            <ul className="space-y-1.5">
              {ingredients.map((ing: string | Ingredient, i) => (
                <li key={i} className="text-sm text-zinc-200 flex items-baseline gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-400 flex-shrink-0 mt-1.5" />
                  {ingredientLabel(ing)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            How to cook
          </h2>
          {instructions.length === 0 ? (
            <div className="text-sm text-zinc-500 italic">No instructions yet.</div>
          ) : (
            <ol className="space-y-3">
              {instructions.map((rawStep, i) => {
                const step: Instruction = normalizeInstruction(rawStep);
                const stepIngs = step.ingredientIndexes
                  .map((idx) => ingredients[idx])
                  .filter((x): x is Ingredient | string => Boolean(x));
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-coral-500/20 text-coral-400 text-xs grid place-items-center font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 leading-relaxed">{step.text || instructionText(rawStep)}</p>
                      {stepIngs.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {stepIngs.map((ing, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-zinc-800/60 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full"
                              title={ingredientLabel(ing)}
                            >
                              {ingredientName(ing)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
          <RecipeComments recipeId={recipe.recipeId} />
        </section>

        {isAuthor && (
          <section className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold uppercase tracking-wider py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
            >
              Edit recipe
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
      </main>
    </div>
  );
}

function DifficultyDots({ value }: { value: number }) {
  const v = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Difficulty ${v} of 5`}
      title={`Difficulty ${v}/5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${n <= v ? 'bg-coral-400' : 'bg-zinc-700'}`}
        />
      ))}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-center">
      <div className="font-display text-2xl font-black text-coral-300 tracking-tight">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">{label}</div>
      {hint && <div className="text-[10px] text-zinc-600 mt-0.5">{hint}</div>}
    </div>
  );
}

function FullPageMessage({
  emoji,
  caption,
  backHref,
}: {
  emoji: string;
  caption: string;
  backHref?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-coral-400 text-3xl" aria-hidden="true">
          {emoji}
        </div>
        <div className="text-zinc-400 text-sm mt-3">{caption}</div>
        {backHref && (
          <Link
            href={backHref}
            className="mt-5 inline-block bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Back
          </Link>
        )}
      </div>
    </div>
  );
}

