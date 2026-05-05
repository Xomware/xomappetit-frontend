'use client';
import { useState } from 'react';
import { Difficulty, Ingredient, Macros, Privacy, Recipe, normalizeIngredient } from '@/types';
import IngredientsEditor from './IngredientsEditor';
import InstructionsEditor from './InstructionsEditor';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const PRIVACIES: { value: Privacy; label: string; hint: string }[] = [
  { value: 'private', label: 'Private', hint: 'Only you can see it.' },
  { value: 'friends', label: 'Friends', hint: 'Visible to your accepted friends.' },
  { value: 'public', label: 'Public', hint: 'Anyone can find and view it.' },
];

export interface RecipeFormValues {
  name: string;
  description: string;
  timeMinutes: number;
  difficulty: Difficulty;
  proteinSource: string;
  ingredients: Ingredient[];
  instructions: string[];
  macros: Macros;
  privacy: Privacy;
}

interface Props {
  initial?: Recipe;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5';

export function RecipeForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [timeMinutes, setTimeMinutes] = useState(initial?.timeMinutes ?? 30);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'Medium');
  const [proteinSource, setProteinSource] = useState(initial?.proteinSource ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    (initial?.ingredients ?? []).map(normalizeIngredient),
  );
  const [instructions, setInstructions] = useState<string[]>(initial?.instructions ?? []);
  const [calories, setCalories] = useState(initial?.macros?.calories ?? 0);
  const [protein, setProtein] = useState(initial?.macros?.protein ?? 0);
  const [carbs, setCarbs] = useState(initial?.macros?.carbs ?? 0);
  const [fat, setFat] = useState(initial?.macros?.fat ?? 0);
  const [privacy, setPrivacy] = useState<Privacy>(initial?.privacy ?? 'private');
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
        description: description.trim(),
        timeMinutes,
        difficulty,
        proteinSource: proteinSource.trim(),
        ingredients: ingredients.filter((i) => i.name.trim()),
        instructions: instructions.filter((s) => s.trim()),
        macros: { calories, protein, carbs, fat },
        privacy,
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

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls + ' min-h-[60px] resize-y'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is it? Why do you love it?"
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
            min={0}
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
          {(
            [
              ['Cal', calories, setCalories],
              ['Protein', protein, setProtein],
              ['Carbs', carbs, setCarbs],
              ['Fat', fat, setFat],
            ] as const
          ).map(([label, val, setter]) => (
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

      <fieldset>
        <legend className={labelCls}>Privacy</legend>
        <div className="space-y-2">
          {PRIVACIES.map((p) => (
            <label
              key={p.value}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                privacy === p.value
                  ? 'border-coral-500/60 bg-coral-500/5'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="privacy"
                value={p.value}
                checked={privacy === p.value}
                onChange={() => setPrivacy(p.value)}
                className="accent-coral-400 mt-0.5"
              />
              <div className="text-sm">
                <div className="font-semibold text-zinc-200">{p.label}</div>
                <div className="text-xs text-zinc-500">{p.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="text-xs text-coral-300 bg-coral-900/30 border border-coral-800 rounded-md px-3 py-2"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
