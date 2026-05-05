'use client';
import { useState } from 'react';
import {
  Difficulty,
  Ingredient,
  Instruction,
  Macros,
  MacrosScope,
  Privacy,
  ProteinType,
  PROTEIN_TYPES,
  PROTEIN_LABELS,
  Recipe,
  Tag,
  TAG_GROUPS,
  TAG_LABELS,
  normalizeIngredient,
  normalizeInstruction,
} from '@/types';
import IngredientsEditor from './IngredientsEditor';
import InstructionsEditor from './InstructionsEditor';
import { rememberIngredient } from '@/lib/common-ingredients';

const PRIVACIES: { value: Privacy; label: string; hint: string }[] = [
  { value: 'private', label: 'Private', hint: 'Only you can see it.' },
  { value: 'friends', label: 'Friends', hint: 'Visible to your accepted friends.' },
  { value: 'public', label: 'Public', hint: 'Anyone can find and view it.' },
];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Expert',
};

export interface RecipeFormValues {
  name: string;
  description: string;
  timeMinutes: number;
  servings: number;
  difficulty: Difficulty;
  proteinSource: string;
  proteinTypes: ProteinType[];
  tags: Tag[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  macros: Macros;
  macrosScope: MacrosScope;
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
  const [servings, setServings] = useState(initial?.servings ?? 1);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (initial?.difficulty as Difficulty) ?? 3,
  );
  const [proteinSource, setProteinSource] = useState(initial?.proteinSource ?? '');
  const [proteinTypes, setProteinTypes] = useState<ProteinType[]>(
    initial?.proteinTypes ?? [],
  );
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    (initial?.ingredients ?? []).map(normalizeIngredient),
  );
  const [instructions, setInstructions] = useState<Instruction[]>(
    (initial?.instructions ?? []).map(normalizeInstruction),
  );
  const [calories, setCalories] = useState(initial?.macros?.calories ?? 0);
  const [protein, setProtein] = useState(initial?.macros?.protein ?? 0);
  const [carbs, setCarbs] = useState(initial?.macros?.carbs ?? 0);
  const [fat, setFat] = useState(initial?.macros?.fat ?? 0);
  const [macrosScope, setMacrosScope] = useState<MacrosScope>(
    initial?.macrosScope ?? 'per-recipe',
  );
  const [privacy, setPrivacy] = useState<Privacy>(initial?.privacy ?? 'private');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleProtein = (p: ProteinType) =>
    setProteinTypes((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  const toggleTag = (t: Tag) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const cleanedIngredients = ingredients.filter((i) => i.name.trim());
      // Remember unique ingredient names for future autocomplete.
      cleanedIngredients.forEach((i) => rememberIngredient(i.name));
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        timeMinutes,
        servings,
        difficulty,
        proteinSource: proteinSource.trim(),
        proteinTypes,
        tags,
        ingredients: cleanedIngredients,
        instructions: instructions.filter((s) => s.text.trim()),
        macros: { calories, protein, carbs, fat },
        macrosScope,
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Time (min)</label>
          <input
            type="number"
            inputMode="numeric"
            className={inputCls}
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(+e.target.value)}
            min={0}
          />
        </div>
        <div>
          <label className={labelCls}>Servings</label>
          <input
            type="number"
            inputMode="numeric"
            className={inputCls}
            value={servings}
            onChange={(e) => setServings(Math.max(1, +e.target.value || 1))}
            min={1}
            max={50}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Difficulty: {DIFFICULTY_LABELS[difficulty]}</label>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Protein</label>
        <div className="flex flex-wrap gap-1.5">
          {PROTEIN_TYPES.map((p) => {
            const on = proteinTypes.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggleProtein(p)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  on
                    ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {PROTEIN_LABELS[p]}
              </button>
            );
          })}
        </div>
        <input
          className={inputCls + ' mt-2'}
          value={proteinSource}
          onChange={(e) => setProteinSource(e.target.value)}
          placeholder="Optional free-text label (e.g. Bone-in chicken thigh)"
        />
      </div>

      <div>
        <label className={labelCls}>Tags</label>
        <div className="space-y-2">
          {TAG_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        on
                          ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {TAG_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Ingredients</label>
        <IngredientsEditor ingredients={ingredients} onChange={setIngredients} />
      </div>

      <div>
        <label className={labelCls}>Instructions</label>
        <InstructionsEditor
          steps={instructions}
          ingredients={ingredients}
          onChange={setInstructions}
        />
      </div>

      <div>
        <div className="flex items-end justify-between gap-3 mb-2">
          <label className={labelCls + ' mb-0'}>Macros</label>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-semibold">
            {(['per-recipe', 'per-serving'] as MacrosScope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMacrosScope(s)}
                className={`px-2.5 py-1 rounded-md transition ${
                  macrosScope === s
                    ? 'bg-zinc-800 text-coral-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s === 'per-serving' ? 'per serving' : 'per recipe'}
              </button>
            ))}
          </div>
        </div>
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
                inputMode="numeric"
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

function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (v: Difficulty) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Difficulty">
      {([1, 2, 3, 4, 5] as Difficulty[]).map((n) => {
        const on = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`flex-1 min-w-0 h-9 rounded-md border transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${
              on
                ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            <span className="text-sm font-bold">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
