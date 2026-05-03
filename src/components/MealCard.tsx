'use client';
import { Meal } from '@/types';

interface Props {
  meal: Meal;
  onOpen: (meal: Meal) => void;
  onToggleCooked: (id: string) => void;
  onRate: (meal: Meal) => void;
  onDelete: (id: string) => void;
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

export default function MealCard({
  meal,
  onOpen,
  onToggleCooked,
  onRate,
  onDelete,
}: Props) {
  return (
    <div
      onClick={() => onOpen(meal)}
      className="group bg-zinc-900/60 border border-zinc-800 hover:border-coral-500/50 rounded-xl p-4 space-y-3 cursor-pointer transition hover:shadow-lg hover:shadow-coral-500/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-base truncate group-hover:text-coral-300 transition">
            {meal.name}
          </h3>
          <div className="text-xs flex items-center gap-1.5 mt-0.5">
            <span className={`font-semibold ${diffColor(meal.difficulty)}`}>
              {meal.difficulty}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">{meal.timeMinutes}m</span>
          </div>
        </div>
        <label
          className="flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={meal.cooked}
            onChange={() => onToggleCooked(meal.id)}
            className="accent-coral-400 w-4 h-4"
          />
          <span className="text-xs text-zinc-500">Cooked</span>
        </label>
      </div>

      {meal.proteinSource && (
        <span className="inline-block bg-coral-500/15 text-coral-300 text-xs px-2 py-0.5 rounded-full">
          {meal.proteinSource}
        </span>
      )}

      <div className="text-xs text-zinc-500 grid grid-cols-4 gap-1">
        <span>{meal.macros.calories} cal</span>
        <span>{meal.macros.protein}g P</span>
        <span>{meal.macros.carbs}g C</span>
        <span>{meal.macros.fat}g F</span>
      </div>

      {meal.rating && (
        <div className="text-xs flex items-center gap-2">
          <span className="chef-stamp text-base">{avgRating(meal)}/5</span>
          {meal.rating.notes && (
            <span className="text-zinc-500 italic truncate flex-1">
              "{meal.rating.notes}"
            </span>
          )}
        </div>
      )}

      <div
        className="flex gap-2 pt-1 border-t border-zinc-800/60"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onRate(meal)}
          className="text-xs font-semibold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-md transition"
        >
          {meal.rating ? 'Re-rate' : 'Rate'}
        </button>
        <button
          onClick={() => onDelete(meal.id)}
          className="text-xs text-zinc-600 hover:text-coral-400 px-2 py-1 rounded-md transition ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
