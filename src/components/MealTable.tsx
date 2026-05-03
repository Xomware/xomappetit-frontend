'use client';
import { Meal } from '@/types';

interface Props {
  meals: Meal[];
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

export default function MealTable({
  meals,
  onOpen,
  onToggleCooked,
  onRate,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/60">
          <tr className="text-zinc-500 text-xs uppercase tracking-wider text-left">
            <th className="py-3 px-3 w-10">✓</th>
            <th className="py-3 px-3">Name</th>
            <th className="py-3 px-3">Protein</th>
            <th className="py-3 px-3">Diff.</th>
            <th className="py-3 px-3">Time</th>
            <th className="py-3 px-3">Cal</th>
            <th className="py-3 px-3">Rating</th>
            <th className="py-3 px-3 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => (
            <tr
              key={meal.id}
              onClick={() => onOpen(meal)}
              className="border-t border-zinc-800 hover:bg-zinc-900/60 cursor-pointer transition"
            >
              <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={meal.cooked}
                  onChange={() => onToggleCooked(meal.id)}
                  className="accent-coral-400 w-4 h-4 cursor-pointer"
                />
              </td>
              <td className="py-3 px-3 font-semibold">{meal.name}</td>
              <td className="py-3 px-3 text-zinc-400">{meal.proteinSource || '—'}</td>
              <td className={`py-3 px-3 font-semibold ${diffColor(meal.difficulty)}`}>
                {meal.difficulty}
              </td>
              <td className="py-3 px-3 text-zinc-400">{meal.timeMinutes}m</td>
              <td className="py-3 px-3 text-zinc-400">{meal.macros.calories}</td>
              <td className="py-3 px-3">
                {meal.rating ? (
                  <span className="chef-stamp font-bold">
                    {(
                      (meal.rating.taste +
                        meal.rating.ease +
                        meal.rating.speed +
                        meal.rating.healthiness) /
                      4
                    ).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-zinc-700">—</span>
                )}
              </td>
              <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onRate(meal)}
                    className="text-coral-300 hover:text-coral-200 text-xs font-semibold uppercase tracking-wider"
                  >
                    {meal.rating ? 'Re-rate' : 'Rate'}
                  </button>
                  <button
                    onClick={() => onDelete(meal.id)}
                    className="text-zinc-600 hover:text-coral-400 text-xs"
                  >
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {meals.length === 0 && (
        <div className="text-center text-zinc-500 py-12 italic">
          No meals match. Loosen the filters or log a new one.
        </div>
      )}
    </div>
  );
}
