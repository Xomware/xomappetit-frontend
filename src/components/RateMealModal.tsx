'use client';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Meal, MealRating } from '@/types';
import { mascotFor, MASCOTS } from './Mascot';

interface Props {
  open: boolean;
  meal: Meal | null;
  onClose: () => void;
  onRate: (id: string, rating: MealRating) => Promise<void>;
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span className="chef-stamp text-base">{value}/5</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-md text-base font-bold transition ${
              n <= value
                ? 'bg-gradient-to-br from-coral-500 to-coral-400 text-white shadow-md shadow-coral-500/30'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600'
            }`}
            aria-label={`${label} ${n} of 5`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RateMealModal({ open, meal, onClose, onRate }: Props) {
  const [taste, setTaste] = useState(3);
  const [ease, setEase] = useState(3);
  const [speed, setSpeed] = useState(3);
  const [healthiness, setHealthiness] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset state to current meal's rating when modal opens
  useEffect(() => {
    if (!open || !meal) return;
    setTaste(meal.rating?.taste ?? 3);
    setEase(meal.rating?.ease ?? 3);
    setSpeed(meal.rating?.speed ?? 3);
    setHealthiness(meal.rating?.healthiness ?? 3);
    setNotes(meal.rating?.notes ?? '');
  }, [open, meal]);

  if (!meal) return null;

  const mascot = MASCOTS[mascotFor(meal.id)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRate(meal.id, { taste, ease, speed, healthiness, notes });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Rate: ${meal.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
          <span
            className="h-9 w-9 rounded-full grid place-items-center text-xl flex-shrink-0"
            style={{
              background: `${mascot.accent}22`,
              border: `1px solid ${mascot.accent}66`,
            }}
            aria-hidden="true"
          >
            {mascot.emoji}
          </span>
          <div className="text-sm">
            <div className="font-semibold text-zinc-200">{mascot.name} is judging.</div>
            <div className="text-zinc-500 text-xs italic">"{mascot.caption}"</div>
          </div>
        </div>

        <StarPicker label="Taste" value={taste} onChange={setTaste} />
        <StarPicker label="Ease" value={ease} onChange={setEase} />
        <StarPicker label="Speed" value={speed} onChange={setSpeed} />
        <StarPicker label="Healthiness" value={healthiness} onChange={setHealthiness} />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Notes
          </label>
          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What worked? What flopped?"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 disabled:opacity-40 text-white font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition shadow-lg shadow-coral-500/20"
        >
          {submitting ? 'Saving…' : 'Save rating'}
        </button>
      </form>
    </Modal>
  );
}
