'use client';
import { useEffect, useMemo, useState } from 'react';
import { Ingredient } from '@/types';
import { ingredientSuggestions } from '@/lib/common-ingredients';

interface Props {
  open: boolean;
  /** Already-added ingredient names — these get a checkmark and a leading spot. */
  current: Ingredient[];
  onClose: () => void;
  /** Called when the user taps a suggestion. Parent appends to its list. */
  onAdd: (name: string) => void;
}

/**
 * Search-driven ingredient picker. Tap a suggestion to drop a name into the
 * current ingredient list (parent fills in amount/unit later). Stays open so
 * you can rapid-fire several picks before tapping Done.
 *
 * Suggestions come from:
 *   1. The user's localStorage history (most-recent first)
 *   2. The curated COMMON_INGREDIENTS staple list
 *   3. A "Add custom" option when the query doesn't match anything
 */
export default function IngredientPickerModal({ open, current, onClose, onAdd }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  // Recompute on every open so the localStorage history stays fresh.
  const suggestions = useMemo(() => (open ? ingredientSuggestions() : []), [open]);

  const currentNames = useMemo(
    () => new Set(current.map((i) => (i.name || '').trim().toLowerCase())),
    [current],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 80);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 80);
  }, [suggestions, query]);

  const customQuery = query.trim();
  const exact = filtered.some((s) => s.toLowerCase() === customQuery.toLowerCase());
  const showCustom = customQuery.length > 0 && !exact;

  if (!open) return null;

  const tap = (name: string) => {
    onAdd(name);
    setQuery('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add ingredient"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 -z-10"
      />
      <div className="bg-zinc-950 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <header className="flex items-center justify-between gap-3 p-4 border-b border-zinc-800">
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-wide">
              Add ingredient
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {current.length} added
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 grid place-items-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6.4 4.99 12 10.6l5.6-5.61 1.41 1.41L13.41 12l5.6 5.6-1.41 1.41L12 13.41l-5.6 5.6-1.41-1.41L10.59 12l-5.6-5.6L6.4 4.99z"
              />
            </svg>
          </button>
        </header>

        <div className="p-3 border-b border-zinc-800">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search staples or type your own…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customQuery.length > 0) {
                e.preventDefault();
                tap(customQuery);
              }
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {showCustom && (
            <button
              type="button"
              onClick={() => tap(customQuery)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-dashed border-coral-500/40 text-coral-200 bg-coral-500/5 hover:bg-coral-500/10 transition mb-2"
            >
              <span className="font-semibold">+ Add &quot;{customQuery}&quot;</span>
              <span className="text-[11px] text-coral-300/70">custom</span>
            </button>
          )}

          {filtered.length === 0 && !showCustom && (
            <p className="text-sm text-zinc-500 italic text-center py-8">
              No matching ingredients.
            </p>
          )}

          <ul className="space-y-1">
            {filtered.map((s) => {
              const already = currentNames.has(s.toLowerCase());
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => tap(s)}
                    className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition ${
                      already
                        ? 'bg-coral-500/10 text-coral-200 hover:bg-coral-500/15'
                        : 'bg-zinc-900/50 hover:bg-zinc-900 text-zinc-200'
                    }`}
                  >
                    <span className="font-medium">{s}</span>
                    {already && (
                      <span className="text-coral-400 text-base leading-none" aria-label="Already added">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className="border-t border-zinc-800 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
