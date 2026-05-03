'use client';
import { useState } from 'react';
import { Ingredient, Meal } from '@/types';
import IngredientsEditor from './IngredientsEditor';
import InstructionsEditor from './InstructionsEditor';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export interface MealFormValues {
  name: string;
  timeMinutes: number;
  difficulty: Difficulty;
  proteinSource: string;
  ingredients: Ingredient[];
  instructions: string[];
  macros: { calories: number; protein: number; carbs: number; fat: number };
}

interface Props {
  initial?: Partial<MealFormValues> | Meal;
  submitLabel: string;
  onSubmit: (values: MealFormValues) => Promise<void>;
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5';

function normalizeIngredient(i: string | Ingredient): Ingredient {
  if (typeof i === 'string') return { name: i, quantity: null, unit: null };
  return i;
}

export default function MealForm({ initial, submitLabel, onSubmit }: Props) {
  const seed = initial ?? {};
  const [name, setName] = useState(seed.name ?? '');
  const [timeMinutes, setTimeMinutes] = useState(seed.timeMinutes ?? 30);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (seed.difficulty as Difficulty) ?? 'Medium'
  );
  const [proteinSource, setProteinSource] = useState(seed.proteinSource ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    (seed.ingredients ?? []).map(normalizeIngredient)
  );
  const [instructions, setInstructions] = useState<string[]>(seed.instructions ?? []);
  const [calories, setCalories] = useState(seed.macros?.calories ?? 0);
  const [protein, setProtein] = useState(seed.macros?.protein ?? 0);
  const [carbs, setCarbs] = useState(seed.macros?.carbs ?? 0);
  const [fat, setFat] = useState(seed.macros?.fat ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        timeMinutes,
        difficulty,
        proteinSource,
        ingredients: ingredients.filter((i) => i.name.trim()),
        instructions: instructions.filter((s) => s.trim()),
        macros: { calories, protein, carbs, fat },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>Name *</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chicken Stir Fry"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Time (min)</label>
          <input
            type="number"
            className={inputCls}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(+e.target.value)}
            min={1}
          />
        </div>
        <div>
          <label className={labelCls}>Difficulty</label>
          <select
            className={inputCls}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Protein source</label>
        <input
          className={inputCls}
          value={proteinSource}
          onChange={(e) => setProteinSource(e.target.value)}
          placeholder="Chicken, Tofu, Beef…"
        />
      </div>

      <div>
        <label className={labelCls}>Ingredients</label>
        <IngredientsEditor ingredients={ingredients} onChange={setIngredients} />
      </div>

      <div>
        <label className={labelCls}>Instructions</label>
        <InstructionsEditor steps={instructions} onChange={setInstructions} />
      </div>

      <div>
        <label className={labelCls}>Macros</label>
        <div className="grid grid-cols-4 gap-2">
          {([
            ['Cal', calories, setCalories],
            ['Protein', protein, setProtein],
            ['Carbs', carbs, setCarbs],
            ['Fat', fat, setFat],
          ] as const).map(([label, val, setter]) => (
            <div key={label}>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                {label}
              </span>
              <input
                type="number"
                className={inputCls}
                value={val}
                onChange={(e) => setter(+e.target.value)}
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-coral-300 bg-coral-900/30 border border-coral-800 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition shadow-lg shadow-coral-500/20"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
