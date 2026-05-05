'use client';
import { useEffect, useMemo, useState } from 'react';

export interface ChipOption {
  value: string;
  label: string;
  /** Optional group label — items with the same group render together. */
  group?: string;
}

interface Props {
  open: boolean;
  title: string;
  options: ChipOption[];
  selected: string[];
  onClose: () => void;
  onChange: (next: string[]) => void;
  /** Empty-state message when the search query has no hits. */
  noMatchMessage?: string;
  /** Whether to allow free-form custom values (added to selected as-is). */
  allowCustom?: boolean;
  customLabel?: (q: string) => string;
}

/**
 * Bottom-sheet on mobile, centered card on desktop. Search-filterable list of
 * chips for tags / proteins / anything else with a fixed enum.
 *
 * Selection happens in-place (parent receives the next array on every toggle).
 * "Done" closes the modal without an additional commit step — feels snappier
 * than a confirm dialog.
 */
export default function ChipPickerModal({
  open,
  title,
  options,
  selected,
  onClose,
  onChange,
  noMatchMessage = 'No matches.',
  allowCustom = false,
  customLabel = (q) => `Add "${q}"`,
}: Props) {
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

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const groups = useMemo(() => {
    if (filtered.length === 0) return [] as { group: string | undefined; items: ChipOption[] }[];
    const out: { group: string | undefined; items: ChipOption[] }[] = [];
    const map = new Map<string | undefined, ChipOption[]>();
    for (const o of filtered) {
      const k = o.group;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    }
    for (const [g, items] of map.entries()) out.push({ group: g, items });
    return out;
  }, [filtered]);

  if (!open) return null;

  const toggle = (v: string) => {
    if (selectedSet.has(v)) {
      onChange(selected.filter((x) => x !== v));
    } else {
      onChange([...selected, v]);
    }
  };

  const customQuery = query.trim();
  const exactMatchExists =
    customQuery && options.some((o) => o.label.toLowerCase() === customQuery.toLowerCase());
  const showCustomChip = allowCustom && customQuery.length > 0 && !exactMatchExists;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
          <div className="min-w-0">
            <h2 className="font-display text-lg font-black uppercase tracking-wide truncate">
              {title}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {selected.length} selected
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
            placeholder="Search…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {showCustomChip && (
            <button
              type="button"
              onClick={() => {
                if (!selectedSet.has(customQuery)) onChange([...selected, customQuery]);
                setQuery('');
              }}
              className="w-full text-left text-xs px-3 py-2 rounded-lg border border-dashed border-coral-500/40 text-coral-200 bg-coral-500/5 hover:bg-coral-500/10 transition"
            >
              + {customLabel(customQuery)}
            </button>
          )}

          {filtered.length === 0 && !showCustomChip && (
            <p className="text-sm text-zinc-500 italic text-center py-8">{noMatchMessage}</p>
          )}

          {groups.map(({ group, items }) => (
            <div key={group ?? '_'}>
              {group && (
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                  {group}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {items.map((opt) => {
                  const on = selectedSet.has(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggle(opt.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                        on
                          ? 'bg-coral-500/20 border-coral-500/50 text-coral-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <footer className="border-t border-zinc-800 p-3 flex gap-2">
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
