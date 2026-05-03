'use client';
import { Ingredient } from '@/types';

interface Props {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

const inputCls =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';

export default function IngredientsEditor({ ingredients, onChange }: Props) {
  const update = (i: number, patch: Partial<Ingredient>) => {
    const next = ingredients.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () => onChange([...ingredients, { name: '', quantity: null, unit: null }]);
  const remove = (i: number) => onChange(ingredients.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {ingredients.length === 0 && (
        <div className="text-xs text-zinc-500 italic">
          No ingredients yet. Add your first one ↓
        </div>
      )}
      {ingredients.map((ing, i) => (
        <div key={i} className="grid grid-cols-[80px_80px_1fr_auto] gap-2 items-center">
          <input
            type="number"
            min={0}
            step="0.25"
            placeholder="qty"
            className={inputCls}
            value={ing.quantity ?? ''}
            onChange={(e) =>
              update(i, {
                quantity: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
          <input
            type="text"
            placeholder="unit"
            className={inputCls}
            value={ing.unit ?? ''}
            onChange={(e) =>
              update(i, { unit: e.target.value || null })
            }
          />
          <input
            type="text"
            placeholder="name (e.g. chicken breast)"
            className={inputCls}
            value={ing.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-zinc-500 hover:text-coral-400 text-lg leading-none w-7 h-7 grid place-items-center"
            aria-label="Remove ingredient"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-semibold uppercase tracking-wider text-coral-400 hover:text-coral-300 mt-1"
      >
        + Add ingredient
      </button>
    </div>
  );
}
