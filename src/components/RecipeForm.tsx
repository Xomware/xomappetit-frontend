'use client';
import { useMemo, useState } from 'react';
import {
  Difficulty,
  Ingredient,
  Instruction,
  Macros,
  MacrosScope,
  Privacy,
  ProteinType,
  Recipe,
  Tag,
  TAGS,
  TAG_GROUPS,
  TAG_LABELS,
  normalizeIngredient,
  normalizeInstruction,
} from '@/types';
import IngredientsEditor from './IngredientsEditor';
import InstructionsEditor from './InstructionsEditor';
import ChipPickerModal, { ChipOption } from './ChipPickerModal';
import IngredientPickerModal from './IngredientPickerModal';
import NumberInput from './NumberInput';
import { rememberIngredient } from '@/lib/common-ingredients';
import { recipesApi, ComputeMacrosResult } from '@/lib/api';

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

const STEP_ORDER = ['basics', 'ingredients', 'steps', 'tags', 'finish'] as const;
type StepId = (typeof STEP_ORDER)[number];
const STEP_LABELS: Record<StepId, string> = {
  basics: 'Basics',
  ingredients: 'Ingredients',
  steps: 'Steps',
  tags: 'Tags',
  finish: 'Finish',
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
  /** Partial because import drafts and edit-existing both feed this. */
  initial?: Partial<Recipe>;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5';

export function RecipeForm({ initial, submitLabel, onSubmit }: Props) {
  // Form state
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [timeMinutes, setTimeMinutes] = useState(initial?.timeMinutes ?? 30);
  const [servings, setServings] = useState(initial?.servings ?? 1);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (initial?.difficulty as Difficulty) ?? 3,
  );
  // proteinTypes is auto-derived server-side from the ingredient list, so the
  // wizard doesn't ask. We round-trip whatever was on the recipe (so edits
  // don't accidentally clear the chips when ingredients haven't changed).
  const proteinTypes: ProteinType[] = initial?.proteinTypes ?? [];
  const proteinSource: string = initial?.proteinSource ?? '';
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

  // Wizard state
  const [stepId, setStepId] = useState<StepId>('basics');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  // Auto-macros state
  const [macrosCalc, setMacrosCalc] = useState<ComputeMacrosResult | null>(null);
  const [macrosBusy, setMacrosBusy] = useState(false);
  const [macrosError, setMacrosError] = useState<string | null>(null);

  const stepIdx = STEP_ORDER.indexOf(stepId);
  const isLastStep = stepIdx === STEP_ORDER.length - 1;

  const stepValid = (id: StepId): boolean => {
    if (id === 'basics') return name.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (!stepValid(stepId)) return;
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    setStepId(STEP_ORDER[stepIdx + 1]);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (stepIdx === 0) return;
    setStepId(STEP_ORDER[stepIdx - 1]);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setStepId('basics');
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const cleanedIngredients = ingredients.filter((i) => i.name.trim());
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

  const tagOptions: ChipOption[] = useMemo(
    () =>
      TAG_GROUPS.flatMap((g) =>
        g.tags.map((t) => ({ value: t, label: TAG_LABELS[t] ?? t, group: g.label })),
      ),
    [],
  );

  const runComputeMacros = async () => {
    setMacrosBusy(true);
    setMacrosError(null);
    try {
      const result = await recipesApi.computeMacros(
        ingredients.filter((i) => i.name.trim()),
        { servings, macrosScope },
      );
      setMacrosCalc(result);
      setCalories(result.macros.calories);
      setProtein(result.macros.protein);
      setCarbs(result.macros.carbs);
      setFat(result.macros.fat);
    } catch (err) {
      setMacrosError(err instanceof Error ? err.message : 'Could not compute');
    } finally {
      setMacrosBusy(false);
    }
  };

  const addIngredientByName = (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    setIngredients((prev) => {
      const exists = prev.some((i) => i.name.trim().toLowerCase() === name.toLowerCase());
      if (exists) return prev;
      return [...prev, { name, amount: null, unit: null }];
    });
  };

  return (
    <div className="space-y-6">
      <ProgressBar current={stepIdx} total={STEP_ORDER.length} label={STEP_LABELS[stepId]} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          goNext();
        }}
        className="space-y-5"
      >
        {stepId === 'basics' && (
          <BasicsStep
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            timeMinutes={timeMinutes}
            setTimeMinutes={setTimeMinutes}
            servings={servings}
            setServings={setServings}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
          />
        )}

        {stepId === 'ingredients' && (
          <IngredientsStep
            ingredients={ingredients}
            setIngredients={setIngredients}
            openPicker={() => setIngredientModalOpen(true)}
          />
        )}

        {stepId === 'steps' && (
          <StepsStep
            instructions={instructions}
            setInstructions={setInstructions}
            ingredients={ingredients}
          />
        )}

        {stepId === 'tags' && (
          <TagsStep
            tags={tags}
            removeTag={(t) => setTags(tags.filter((x) => x !== t))}
            openTagPicker={() => setTagModalOpen(true)}
          />
        )}

        {stepId === 'finish' && (
          <FinishStep
            calories={calories}
            setCalories={setCalories}
            protein={protein}
            setProtein={setProtein}
            carbs={carbs}
            setCarbs={setCarbs}
            fat={fat}
            setFat={setFat}
            macrosScope={macrosScope}
            setMacrosScope={setMacrosScope}
            privacy={privacy}
            setPrivacy={setPrivacy}
            macrosCalc={macrosCalc}
            macrosBusy={macrosBusy}
            macrosError={macrosError}
            onAutoCalc={() => void runComputeMacros()}
            canAutoCalc={ingredients.some((i) => i.name.trim())}
          />
        )}

        {error && (
          <div
            role="alert"
            className="text-xs text-coral-300 bg-coral-900/30 border border-coral-800 rounded-md px-3 py-2"
          >
            {error}
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIdx === 0 || submitting}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!stepValid(stepId) || submitting}
            className="flex-1 bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            {submitting ? 'Saving…' : isLastStep ? submitLabel : 'Continue'}
          </button>
        </div>
      </form>

      <IngredientPickerModal
        open={ingredientModalOpen}
        current={ingredients}
        onClose={() => setIngredientModalOpen(false)}
        onAdd={addIngredientByName}
      />
      <ChipPickerModal
        open={tagModalOpen}
        title="Pick tags"
        options={tagOptions}
        selected={tags}
        onClose={() => setTagModalOpen(false)}
        onChange={(next) => setTags(next.filter((v) => (TAGS as readonly string[]).includes(v)) as Tag[])}
        noMatchMessage="No matching tag."
      />
    </div>
  );
}

// ---------- Wizard chrome ----------

function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= current ? 'bg-coral-400' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="font-display text-base font-black uppercase tracking-wide">
          {label}
        </h3>
        <span className="text-[11px] text-zinc-500">
          Step {current + 1} of {total}
        </span>
      </div>
    </div>
  );
}

// ---------- Step 1: Basics ----------

function BasicsStep({
  name, setName,
  description, setDescription,
  timeMinutes, setTimeMinutes,
  servings, setServings,
  difficulty, setDifficulty,
}: {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  timeMinutes: number; setTimeMinutes: (v: number) => void;
  servings: number; setServings: (v: number) => void;
  difficulty: Difficulty; setDifficulty: (v: Difficulty) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Name *</label>
        <input
          autoFocus
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
          className={inputCls + ' min-h-[80px] resize-y'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is it? Why do you love it?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Time (min)</label>
          <NumberInput
            className={inputCls}
            value={timeMinutes}
            onChange={(n) => setTimeMinutes(n ?? 0)}
            min={0}
          />
        </div>
        <div>
          <label className={labelCls}>Servings</label>
          <NumberInput
            className={inputCls}
            value={servings}
            onChange={(n) => setServings(n == null || n < 1 ? 1 : n)}
            min={1}
            max={50}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>
          Difficulty: {DIFFICULTY_LABELS[difficulty]}
        </label>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>
    </div>
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
            className={`flex-1 min-w-0 h-10 rounded-md border transition focus:outline-none focus:ring-2 focus:ring-coral-400/50 ${
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

// ---------- Step 2: Ingredients ----------

function IngredientsStep({
  ingredients,
  setIngredients,
  openPicker,
}: {
  ingredients: Ingredient[];
  setIngredients: (v: Ingredient[]) => void;
  openPicker: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        What goes in? Add ingredients with their quantities.
      </p>
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 rounded-lg py-2.5 text-sm font-semibold text-zinc-200 transition focus:outline-none focus:ring-2 focus:ring-coral-400/40"
      >
        <span>🔍 Search ingredients</span>
      </button>
      <IngredientsEditor ingredients={ingredients} onChange={setIngredients} />
    </div>
  );
}

// ---------- Step 3: Steps ----------

function StepsStep({
  instructions,
  setInstructions,
  ingredients,
}: {
  instructions: Instruction[];
  setInstructions: (v: Instruction[]) => void;
  ingredients: Ingredient[];
}) {
  // Find ingredients that have a name but aren't tagged in any step yet.
  // Hides until the user has at least one step + one ingredient — the
  // warning is irrelevant before then.
  const usedIdx = new Set<number>();
  for (const step of instructions) {
    for (const idx of step.ingredientIndexes ?? []) usedIdx.add(idx);
  }
  const unused = ingredients
    .map((ing, idx) => ({ ing, idx }))
    .filter(({ ing }) => ing.name.trim().length > 0)
    .filter(({ idx }) => !usedIdx.has(idx))
    .map(({ ing }) => ing.name.trim());

  const showWarning = instructions.some((s) => s.text.trim()) && unused.length > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Write each step and tag which ingredients it uses.
      </p>
      {showWarning && (
        <div
          role="status"
          className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg px-3 py-2 flex items-start gap-2"
        >
          <span aria-hidden="true">⚠</span>
          <p className="flex-1">
            <span className="font-semibold">
              {unused.length} {unused.length === 1 ? 'ingredient isn’t' : 'ingredients aren’t'} used in any step:
            </span>{' '}
            <span className="text-amber-100">{unused.join(', ')}</span>
          </p>
        </div>
      )}
      <InstructionsEditor
        steps={instructions}
        ingredients={ingredients}
        onChange={setInstructions}
      />
    </div>
  );
}

// ---------- Step 4: Tags ----------

function TagsStep({
  tags,
  removeTag,
  openTagPicker,
}: {
  tags: Tag[];
  removeTag: (t: Tag) => void;
  openTagPicker: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Tag the recipe so people can filter by diet, vibe, and meal type.
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className={labelCls + ' mb-0'}>Tags</label>
          <button
            type="button"
            onClick={openTagPicker}
            className="text-xs font-semibold uppercase tracking-wider text-coral-400 hover:text-coral-300"
          >
            + Pick
          </button>
        </div>
        {tags.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No tags yet — tap "Pick" to choose.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => removeTag(t)}
                className="text-xs px-2.5 py-1 rounded-full border bg-coral-500/20 border-coral-500/50 text-coral-200 hover:bg-coral-500/30 transition"
                aria-label={`Remove ${TAG_LABELS[t] ?? t}`}
              >
                {TAG_LABELS[t] ?? t} <span className="ml-1 text-coral-300/70">×</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-zinc-500 italic">
        Proteins are detected automatically from your ingredient list — no need to pick.
      </p>
    </div>
  );
}

// ---------- Step 5: Finish (macros + privacy) ----------

function FinishStep({
  calories, setCalories,
  protein, setProtein,
  carbs, setCarbs,
  fat, setFat,
  macrosScope, setMacrosScope,
  privacy, setPrivacy,
  macrosCalc, macrosBusy, macrosError,
  onAutoCalc, canAutoCalc,
}: {
  calories: number; setCalories: (v: number) => void;
  protein: number; setProtein: (v: number) => void;
  carbs: number; setCarbs: (v: number) => void;
  fat: number; setFat: (v: number) => void;
  macrosScope: MacrosScope; setMacrosScope: (v: MacrosScope) => void;
  privacy: Privacy; setPrivacy: (v: Privacy) => void;
  macrosCalc: ComputeMacrosResult | null;
  macrosBusy: boolean;
  macrosError: string | null;
  onAutoCalc: () => void;
  canAutoCalc: boolean;
}) {
  return (
    <div className="space-y-6">
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

        <button
          type="button"
          onClick={onAutoCalc}
          disabled={!canAutoCalc || macrosBusy}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2 text-sm font-semibold text-zinc-200 transition mb-2 focus:outline-none focus:ring-2 focus:ring-coral-400/40"
        >
          <span>{macrosBusy ? 'Calculating…' : '✨ Calculate from ingredients'}</span>
        </button>

        {macrosCalc && (
          <div className="text-[11px] text-zinc-500 mb-2 flex items-center gap-2 flex-wrap">
            <span>
              Matched <span className="text-coral-300 font-semibold">{macrosCalc.coverage.matched}</span>{' '}
              of <span className="font-semibold">{macrosCalc.coverage.total}</span>
            </span>
            {macrosCalc.coverage.unmatched.length > 0 && (
              <span title={macrosCalc.coverage.unmatched.join(', ')} className="italic">
                · skipped {macrosCalc.coverage.unmatched.length}
              </span>
            )}
            <span>· tweak any value below.</span>
          </div>
        )}

        {macrosError && (
          <div role="alert" className="text-xs text-coral-300 mb-2">{macrosError}</div>
        )}

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
              <NumberInput
                className={inputCls}
                value={val}
                onChange={(n) => setter(n ?? 0)}
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
    </div>
  );
}
