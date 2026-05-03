'use client';
import Modal from './Modal';
import CommentsSection from './CommentsSection';
import { Ingredient, Meal } from '@/types';
import { ingredientLabel } from '@/types';
import { mascotFor, MASCOTS } from './Mascot';

interface Props {
  open: boolean;
  meal: Meal | null;
  onClose: () => void;
  onEdit: (meal: Meal) => void;
  onRate: (meal: Meal) => void;
  onToggleCooked: (id: string) => void;
}

function diffColor(d: string) {
  return d === 'Easy'
    ? 'text-emerald-400'
    : d === 'Medium'
    ? 'text-amber-400'
    : 'text-coral-400';
}

function avgRating(meal: Meal) {
  if (!meal.rating) return null;
  const { taste, ease, speed, healthiness } = meal.rating;
  return ((taste + ease + speed + healthiness) / 4).toFixed(1);
}

export default function MealDetailModal({
  open,
  meal,
  onClose,
  onEdit,
  onRate,
  onToggleCooked,
}: Props) {
  if (!meal) return null;

  const mascot = MASCOTS[mascotFor(meal.id)];
  const ingredients = (meal.ingredients ?? []) as (string | Ingredient)[];
  const instructions = meal.instructions ?? [];

  return (
    <Modal open={open} onClose={onClose} title={meal.name}>
      <div className="space-y-5">
        {/* Top facts strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`font-semibold ${diffColor(meal.difficulty)}`}>
            {meal.difficulty}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-300">{meal.timeMinutes} min</span>
          {meal.proteinSource && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="bg-coral-500/15 text-coral-300 px-2 py-0.5 rounded-full">
                {meal.proteinSource}
              </span>
            </>
          )}
          <span className="text-zinc-600">·</span>
          <button
            onClick={() => onToggleCooked(meal.id)}
            className={`px-2 py-0.5 rounded-full font-semibold transition ${
              meal.cooked
                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {meal.cooked ? '✓ Cooked' : '○ Not yet'}
          </button>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
          {[
            ['Cal', meal.macros.calories],
            ['Protein', `${meal.macros.protein}g`],
            ['Carbs', `${meal.macros.carbs}g`],
            ['Fat', `${meal.macros.fat}g`],
          ].map(([label, val]) => (
            <div key={label as string} className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                {label}
              </div>
              <div className="font-bold text-base mt-0.5">{val}</div>
            </div>
          ))}
        </div>

        {/* Rating */}
        {meal.rating ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                {mascot.name} says
              </span>
              <span className="chef-stamp text-lg">{avgRating(meal)} / 5</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                ['Taste', meal.rating.taste],
                ['Ease', meal.rating.ease],
                ['Speed', meal.rating.speed],
                ['Health', meal.rating.healthiness],
              ].map(([k, v]) => (
                <div key={k as string} className="text-center">
                  <div className="text-zinc-500">{k}</div>
                  <div className="font-bold">{v}</div>
                </div>
              ))}
            </div>
            {meal.rating.notes && (
              <div className="mt-2 text-sm text-zinc-300 italic">
                "{meal.rating.notes}"
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-lg p-3 text-sm text-zinc-500 italic">
            Not rated yet. {mascot.caption}
          </div>
        )}

        {/* Ingredients */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Ingredients
          </h3>
          {ingredients.length === 0 ? (
            <div className="text-sm text-zinc-500 italic">No ingredients listed.</div>
          ) : (
            <ul className="space-y-1">
              {ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-zinc-200 flex items-baseline gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-400 flex-shrink-0 mt-1.5" />
                  {ingredientLabel(ing)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            How to cook
          </h3>
          {instructions.length === 0 ? (
            <div className="text-sm text-zinc-500 italic">No instructions yet.</div>
          ) : (
            <ol className="space-y-2">
              {instructions.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-coral-500/20 text-coral-400 text-xs grid place-items-center font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-zinc-200 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Comments */}
        <div className="pt-2 border-t border-zinc-800">
          <CommentsSection mealId={meal.id} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={() => onEdit(meal)}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold uppercase tracking-wider py-2 rounded-lg transition"
          >
            Edit
          </button>
          <button
            onClick={() => onRate(meal)}
            className="flex-1 bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white text-sm font-bold uppercase tracking-wider py-2 rounded-lg transition shadow-lg shadow-coral-500/20"
          >
            {meal.rating ? 'Re-rate' : 'Rate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
