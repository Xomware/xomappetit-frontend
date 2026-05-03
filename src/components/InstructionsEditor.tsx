'use client';

interface Props {
  steps: string[];
  onChange: (steps: string[]) => void;
}

const inputCls =
  'flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';

export default function InstructionsEditor({ steps, onChange }: Props) {
  const update = (i: number, val: string) => {
    const next = steps.slice();
    next[i] = val;
    onChange(next);
  };
  const add = () => onChange([...steps, '']);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {steps.length === 0 && (
        <div className="text-xs text-zinc-500 italic">
          No steps yet. Add your first instruction ↓
        </div>
      )}
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 w-6 h-6 rounded-full bg-coral-500/20 text-coral-400 text-xs grid place-items-center font-bold flex-shrink-0">
            {i + 1}
          </span>
          <textarea
            rows={1}
            placeholder={`Step ${i + 1}`}
            className={inputCls + ' resize-y min-h-[36px]'}
            value={step}
            onChange={(e) => update(i, e.target.value)}
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
      ))}
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
