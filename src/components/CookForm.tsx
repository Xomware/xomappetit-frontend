'use client';
import { useMemo, useState } from 'react';
import { IconRating, RATING_AXES, RatingAxisKey } from './IconRating';
import PeoplePickerModal from './PeoplePickerModal';
import { useUsersById } from '@/lib/use-users-by-id';
import { useAuth } from '@/lib/auth-context';
import { PublicUserProfile } from '@/lib/users';

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent';
const labelCls =
  'block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5';

export interface CookFormValues {
  cookedAt: string;
  chefs: string[];
  diners: string[];
  notes: string;
  photoUrl: string | null;
  rating: number | null;
  spiciness: number | null;
  sweetness: number | null;
  saltiness: number | null;
  richness: number | null;
}

interface Props {
  initial?: Partial<CookFormValues>;
  submitLabel: string;
  showCookedAt: boolean;
  cookedAtImmutable?: boolean;
  /** When true, hides the chefs/diners pickers (used by /cooks/view edit). */
  participantsImmutable?: boolean;
  onSubmit: (values: CookFormValues) => Promise<void>;
}

const STEP_ORDER = ['who', 'details', 'rating'] as const;
type StepId = (typeof STEP_ORDER)[number];
const STEP_LABELS: Record<StepId, string> = {
  who: 'When & who',
  details: 'Photo & notes',
  rating: 'Rating',
};

function nowLocalIso(): string {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function CookForm({
  initial,
  submitLabel,
  showCookedAt,
  cookedAtImmutable,
  participantsImmutable,
  onSubmit,
}: Props) {
  const { user } = useAuth();
  const callerId = user?.sub ?? '';

  const [cookedAt, setCookedAt] = useState(
    initial?.cookedAt ? initial.cookedAt.slice(0, 16) : nowLocalIso(),
  );
  // Caller is always a chef by default — backend enforces this anyway, but
  // showing them here makes the UX legible.
  const [chefs, setChefs] = useState<string[]>(() => {
    const seed = initial?.chefs ?? [];
    if (callerId && !seed.includes(callerId)) return [callerId, ...seed];
    return seed;
  });
  // For new cooks (no `initial.diners` provided), seed the caller as a
  // diner too — most cooks are 'I cooked it AND ate some'. The picker
  // can drop them if it was a cook-for-someone-else session. For edit
  // mode (initial.diners provided, even if []), leave it as-is.
  const [diners, setDiners] = useState<string[]>(() => {
    if (initial?.diners !== undefined) return initial.diners;
    return callerId ? [callerId] : [];
  });
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? '');
  const [ratings, setRatings] = useState<Record<RatingAxisKey, number>>({
    overall: initial?.rating ?? 0,
    spiciness: initial?.spiciness ?? 0,
    sweetness: initial?.sweetness ?? 0,
    saltiness: initial?.saltiness ?? 0,
    richness: initial?.richness ?? 0,
  });
  const setRating = (axis: RatingAxisKey, n: number) =>
    setRatings((prev) => ({ ...prev, [axis]: n }));

  const [stepId, setStepId] = useState<StepId>(participantsImmutable ? 'details' : 'who');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chefsModalOpen, setChefsModalOpen] = useState(false);
  const [dinersModalOpen, setDinersModalOpen] = useState(false);

  const stepIdx = STEP_ORDER.indexOf(stepId);
  const isLastStep = stepIdx === STEP_ORDER.length - 1;

  const goNext = () => {
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
    setSubmitting(true);
    setError(null);
    try {
      const r = (n: number) => (n > 0 ? n : null);
      await onSubmit({
        cookedAt: new Date(cookedAt).toISOString(),
        chefs,
        diners,
        notes: notes.trim(),
        photoUrl: photoUrl.trim() || null,
        rating: r(ratings.overall),
        spiciness: r(ratings.spiciness),
        sweetness: r(ratings.sweetness),
        saltiness: r(ratings.saltiness),
        richness: r(ratings.richness),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        current={stepIdx}
        total={STEP_ORDER.length}
        label={STEP_LABELS[stepId]}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          goNext();
        }}
        className="space-y-5"
      >
        {stepId === 'who' && (
          <WhoStep
            showCookedAt={showCookedAt}
            cookedAt={cookedAt}
            setCookedAt={setCookedAt}
            cookedAtImmutable={cookedAtImmutable}
            chefs={chefs}
            diners={diners}
            callerId={callerId}
            removeChef={(id) =>
              setChefs((prev) => (id === callerId ? prev : prev.filter((x) => x !== id)))
            }
            removeDiner={(id) => setDiners((prev) => prev.filter((x) => x !== id))}
            openChefs={() => setChefsModalOpen(true)}
            openDiners={() => setDinersModalOpen(true)}
          />
        )}

        {stepId === 'details' && (
          <DetailsStep
            notes={notes}
            setNotes={setNotes}
            photoUrl={photoUrl}
            setPhotoUrl={setPhotoUrl}
          />
        )}

        {stepId === 'rating' && (
          <RatingStep ratings={ratings} setRating={setRating} />
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
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            {submitting ? 'Saving…' : isLastStep ? submitLabel : 'Continue'}
          </button>
        </div>
      </form>

      <PeoplePickerModal
        open={chefsModalOpen}
        title="Who cooked"
        selected={chefs}
        excludeUserIds={diners}
        onClose={() => setChefsModalOpen(false)}
        onChange={(next) => {
          // Caller stays in chefs by default. Allow other people to come and go.
          if (callerId && !next.includes(callerId)) {
            setChefs([callerId, ...next.filter((x) => x !== callerId)]);
          } else {
            setChefs(next);
          }
        }}
      />
      <PeoplePickerModal
        open={dinersModalOpen}
        title="Who ate"
        selected={diners}
        excludeUserIds={chefs}
        onClose={() => setDinersModalOpen(false)}
        onChange={setDiners}
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
        <h3 className="font-display text-base font-black uppercase tracking-wide">{label}</h3>
        <span className="text-[11px] text-zinc-500">
          Step {current + 1} of {total}
        </span>
      </div>
    </div>
  );
}

// ---------- Step 1: Who & when ----------

function WhoStep({
  showCookedAt,
  cookedAt,
  setCookedAt,
  cookedAtImmutable,
  chefs,
  diners,
  callerId,
  removeChef,
  removeDiner,
  openChefs,
  openDiners,
}: {
  showCookedAt: boolean;
  cookedAt: string;
  setCookedAt: (v: string) => void;
  cookedAtImmutable?: boolean;
  chefs: string[];
  diners: string[];
  callerId: string;
  removeChef: (id: string) => void;
  removeDiner: (id: string) => void;
  openChefs: () => void;
  openDiners: () => void;
}) {
  // Resolve names for the chip rows.
  const ids = useMemo(
    () => Array.from(new Set([...chefs, ...diners])),
    [chefs, diners],
  );
  const { map: profiles } = useUsersById(ids);

  return (
    <div className="space-y-5">
      {showCookedAt && (
        <div>
          <label className={labelCls}>Cooked at</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={cookedAt}
            onChange={(e) => setCookedAt(e.target.value)}
            disabled={cookedAtImmutable}
          />
          {cookedAtImmutable && (
            <p className="mt-1 text-[11px] text-zinc-500">
              cookedAt is immutable. Delete and re-log to change.
            </p>
          )}
        </div>
      )}

      <PeopleSection
        label="Who cooked"
        userIds={chefs}
        callerId={callerId}
        profiles={profiles}
        lockSelf
        onPick={openChefs}
        onRemove={removeChef}
        emptyHint="You'll be added automatically — pick others if it was a team effort."
      />
      <PeopleSection
        label="Who ate"
        userIds={diners}
        callerId={callerId}
        profiles={profiles}
        onPick={openDiners}
        onRemove={removeDiner}
        emptyHint="Pick the people you served."
      />
    </div>
  );
}

function PeopleSection({
  label,
  userIds,
  callerId,
  profiles,
  lockSelf,
  onPick,
  onRemove,
  emptyHint,
}: {
  label: string;
  userIds: string[];
  callerId: string;
  profiles: Map<string, PublicUserProfile>;
  /** When true, the caller's chip can't be removed (chefs section). */
  lockSelf?: boolean;
  onPick: () => void;
  onRemove: (id: string) => void;
  emptyHint: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={labelCls + ' mb-0'}>{label}</span>
        <button
          type="button"
          onClick={onPick}
          className="text-xs font-semibold uppercase tracking-wider text-coral-400 hover:text-coral-300"
        >
          + Pick
        </button>
      </div>
      {userIds.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {userIds.map((id) => {
            const p = profiles.get(id);
            const handle = p?.preferredUsername;
            const name = p?.displayName?.trim();
            const isMe = id === callerId;
            const display = isMe
              ? 'You'
              : name || (handle ? `@${handle}` : `${id.slice(0, 6)}…`);
            return (
              <span
                key={id}
                className={`inline-flex items-center text-xs rounded-full border ${
                  isMe
                    ? 'bg-coral-500/30 border-coral-500/60 text-coral-100'
                    : 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                }`}
              >
                <span className="px-2.5 py-1.5">{display}</span>
                {!(isMe && lockSelf) && (
                  <button
                    type="button"
                    onClick={() => onRemove(id)}
                    aria-label={`Remove ${display}`}
                    className="h-7 w-7 grid place-items-center text-base text-coral-200 hover:bg-coral-500/30 rounded-r-full transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Step 2: Photo & notes ----------

function DetailsStep({
  notes,
  setNotes,
  photoUrl,
  setPhotoUrl,
}: {
  notes: string;
  setNotes: (v: string) => void;
  photoUrl: string;
  setPhotoUrl: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          className={inputCls + ' min-h-[100px] resize-y'}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What worked? What flopped? Subs you made?"
        />
      </div>
      <div>
        <label className={labelCls}>Photo URL</label>
        <input
          type="url"
          inputMode="url"
          className={inputCls}
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://…"
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          Optional — paste any image URL. Inline upload is coming.
        </p>
      </div>
    </div>
  );
}

// ---------- Step 3: Rating ----------

function RatingStep({
  ratings,
  setRating,
}: {
  ratings: Record<RatingAxisKey, number>;
  setRating: (axis: RatingAxisKey, n: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Rate how this cook turned out. All optional — skip whatever doesn't apply.
      </p>
      {RATING_AXES.map((axis) => {
        const v = ratings[axis.key];
        return (
          <div key={axis.key} className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                {axis.label}
              </div>
              <div className="text-[11px] text-zinc-500">
                {v > 0 ? `${v}/5` : 'not rated'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconRating
                value={v}
                onChange={(n) => setRating(axis.key, n)}
                icon={axis.icon}
                size="md"
                label={`Rate ${axis.label.toLowerCase()}`}
              />
              {v > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(axis.key, 0)}
                  aria-label={`Clear ${axis.label.toLowerCase()} rating`}
                  className="text-xs text-zinc-500 hover:text-coral-300 transition px-1"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-zinc-500 italic">
        These ratings roll up into the recipe's overall numbers — you can only rate a recipe if you've cooked it.
      </p>
    </div>
  );
}
