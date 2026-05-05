'use client';
import { useId, useMemo } from 'react';
import {
  Ingredient,
  Unit,
  UNITS,
  UNIT_LABELS,
  UNIT_DEFAULT_AMOUNTS,
  UNITLESS_UNITS,
} from '@/types';
import { ingredientSuggestions } from '@/lib/common-ingredients';
import NumberInput from './NumberInput';

interface Props {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

const inputCls =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';

export default function IngredientsEditor({ ingredients, onChange }: Props) {
  const datalistId = useId();

  // Suggestion list is per-render (cheap; reads from localStorage). Memoize
  // so the <datalist> isn't re-rendered on every keystroke.
  const suggestions = useMemo(() => ingredientSuggestions(), []);

  const update = (i: number, patch: Partial<Ingredient>) => {
    const next = ingredients.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleUnitChange = (i: number, value: string) => {
    const next = ingredients.slice();
    const unit = value === '' ? null : (value as Unit);
    const current = next[i];
    let amount = current.amount;
    // Unitless unit (to-taste/pinch/dash): drop the amount.
    if (unit && UNITLESS_UNITS.has(unit)) amount = null;
    // Switching from unset to a unit with a sensible default: prefill.
    else if (unit && current.amount == null && UNIT_DEFAULT_AMOUNTS[unit] != null) {
      amount = UNIT_DEFAULT_AMOUNTS[unit] ?? null;
    }
    next[i] = { ...current, unit, amount };
    onChange(next);
  };

  const add = () => onChange([...ingredients, { name: '', amount: null, unit: null }]);
  const remove = (i: number) => onChange(ingredients.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <datalist id={datalistId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {ingredients.length === 0 && (
        <div className="text-xs text-zinc-500 italic">
          No ingredients yet. Add your first one ↓
        </div>
      )}

      {ingredients.map((ing, i) => {
        const unitless = ing.unit ? UNITLESS_UNITS.has(ing.unit) : false;
        return (
          <div
            key={i}
            className="grid grid-cols-[70px_90px_1fr_auto] sm:grid-cols-[80px_100px_1fr_auto] gap-2 items-center"
          >
            <NumberInput
              decimal
              min={0}
              placeholder="qty"
              disabled={unitless}
              className={inputCls + (unitless ? ' opacity-40' : '')}
              value={ing.amount}
              onChange={(amount) => update(i, { amount })}
            />
            <select
              className={inputCls}
              value={ing.unit ?? ''}
              onChange={(e) => handleUnitChange(i, e.target.value)}
              aria-label="Unit"
            >
              <option value="">—</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="ingredient (e.g. chicken breast)"
              list={datalistId}
              autoComplete="off"
              spellCheck
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
        );
      })}

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
