'use client';
import { Instruction, Ingredient, ingredientName } from '@/types';

interface Props {
  steps: Instruction[];
  /** Recipe ingredient list — drives the per-step ingredient chip picker. */
  ingredients: Ingredient[];
  onChange: (steps: Instruction[]) => void;
}

const inputCls =
  'flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';

export default function InstructionsEditor({ steps, ingredients, onChange }: Props) {
  const update = (i: number, patch: Partial<Instruction>) => {
    const next = steps.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () =>
    onChange([...steps, { text: '', ingredientIndexes: [] }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const toggleIndex = (i: number, idx: number) => {
    const have = new Set(steps[i].ingredientIndexes);
    if (have.has(idx)) have.delete(idx);
    else have.add(idx);
    update(i, { ingredientIndexes: Array.from(have).sort((a, b) => a - b) });
  };

  return (
    <div className="space-y-3">
      {steps.length === 0 && (
        <div className="text-xs text-zinc-500 italic">
          No steps yet. Add your first instruction ↓
        </div>
      )}
      {steps.map((step, i) => {
        const selected = new Set(step.ingredientIndexes);
        return (
          <div
            key={i}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 space-y-2"
          >
            <div className="flex items-start gap-2">
              <span className="mt-2 w-6 h-6 rounded-full bg-coral-500/20 text-coral-400 text-xs grid place-items-center font-bold flex-shrink-0">
                {i + 1}
              </span>
              <textarea
                rows={1}
                placeholder={`Step ${i + 1}`}
                className={inputCls + ' resize-y min-h-[36px]'}
                value={step.text}
                onChange={(e) => update(i, { text: e.target.value })}
              />
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs w-6 h-4 leading-none"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === steps.length - 1}
                  className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs w-6 h-4 leading-none"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-zinc-500 hover:text-coral-400 text-lg leading-none w-7 h-7 grid place-items-center mt-0.5"
                aria-label="Remove step"
              >
                ×
              </button>
            </div>

            {ingredients.length > 0 && (
              <div className="pl-8">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Ingredients used in this step
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, idx) => {
                    const label = ingredientName(ing).trim();
                    if (!label) return null;
                    const on = selected.has(idx);
                    return (
                      <button
                        key={`${idx}-${label}`}
                        type="button"
                        onClick={() => toggleIndex(i, idx)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                          on
                            ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="text-xs font-semibold uppercase tracking-wider text-coral-400 hover:text-coral-300 mt-1"
      >
        + Add step
      </button>
    </div>
  );
}
