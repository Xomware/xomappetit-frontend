'use client';
import { ViewMode } from '@/types';

interface Props {
  mealCount: number;
  cookedCount: number;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onAdd: () => void;
}

export default function Header({ mealCount, cookedCount, view, onViewChange, onAdd }: Props) {
  return (
    <header className="border-b border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight brand-bar">
            <span className="chef-stamp">Xom Appétit</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            <span className="text-coral-400 font-semibold">{mealCount}</span> meals logged
            {mealCount > 0 && (
              <>
                <span className="mx-1.5 text-zinc-600">·</span>
                <span className="text-emerald-400 font-semibold">{cookedCount}</span> cooked
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={() => onViewChange('table')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                view === 'table'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => onViewChange('card')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                view === 'card'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Cards
            </button>
          </div>
          <button
            onClick={onAdd}
            className="bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition shadow-lg shadow-coral-500/20"
          >
            + Log a meal
          </button>
        </div>
      </div>
    </header>
  );
}
