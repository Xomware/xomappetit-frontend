'use client';
import { useState, useMemo } from 'react';
import { useMeals } from '@/lib/hooks';
import { Filters, Meal, ViewMode } from '@/types';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import MealTable from '@/components/MealTable';
import MealCard from '@/components/MealCard';
import AddMealModal from '@/components/AddMealModal';
import EditMealModal from '@/components/EditMealModal';
import RateMealModal from '@/components/RateMealModal';
import MealDetailModal from '@/components/MealDetailModal';
import { MASCOTS, mascotFor } from '@/components/Mascot';

const defaultFilters: Filters = {
  proteinSource: '',
  difficulty: '',
  cookedStatus: 'all',
  timeMin: 0,
  timeMax: 999,
};

export default function Home() {
  const {
    meals,
    isLoading,
    addMeal,
    editMeal,
    toggleCooked,
    rateMeal,
    deleteMeal,
  } = useMeals();
  const [view, setView] = useState<ViewMode>('card');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [addOpen, setAddOpen] = useState(false);
  const [detailMeal, setDetailMeal] = useState<Meal | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [ratingMeal, setRatingMeal] = useState<Meal | null>(null);

  const filtered = useMemo(() => {
    return meals.filter((m) => {
      if (filters.proteinSource && m.proteinSource !== filters.proteinSource) return false;
      if (filters.difficulty && m.difficulty !== filters.difficulty) return false;
      if (filters.cookedStatus === 'cooked' && !m.cooked) return false;
      if (filters.cookedStatus === 'uncooked' && m.cooked) return false;
      if (m.timeMinutes < filters.timeMin) return false;
      if (filters.timeMax > 0 && m.timeMinutes > filters.timeMax) return false;
      return true;
    });
  }, [meals, filters]);

  const cookedCount = useMemo(() => meals.filter((m) => m.cooked).length, [meals]);

  // Keep the detail modal in sync if the meal underneath is updated/deleted
  const detail = detailMeal
    ? meals.find((m) => m.id === detailMeal.id) ?? null
    : null;
  const editing = editingMeal
    ? meals.find((m) => m.id === editingMeal.id) ?? null
    : null;
  const rating = ratingMeal
    ? meals.find((m) => m.id === ratingMeal.id) ?? null
    : null;

  return (
    <div>
      <Header
        mealCount={meals.length}
        cookedCount={cookedCount}
        view={view}
        onViewChange={setView}
        onAdd={() => setAddOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <FilterBar filters={filters} onChange={setFilters} meals={meals} />

        {isLoading ? (
          <LoadingState />
        ) : meals.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : view === 'table' ? (
          <MealTable
            meals={filtered}
            onOpen={setDetailMeal}
            onToggleCooked={toggleCooked}
            onRate={setRatingMeal}
            onDelete={deleteMeal}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onOpen={setDetailMeal}
                onToggleCooked={toggleCooked}
                onRate={setRatingMeal}
                onDelete={deleteMeal}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 py-12 italic">
                No meals match. Loosen the filters or log a new one.
              </div>
            )}
          </div>
        )}
      </main>

      <AddMealModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addMeal}
      />
      <MealDetailModal
        open={!!detail}
        meal={detail}
        onClose={() => setDetailMeal(null)}
        onEdit={(m) => {
          setDetailMeal(null);
          setEditingMeal(m);
        }}
        onRate={(m) => {
          setDetailMeal(null);
          setRatingMeal(m);
        }}
        onToggleCooked={toggleCooked}
      />
      <EditMealModal
        open={!!editing}
        meal={editing}
        onClose={() => setEditingMeal(null)}
        onEdit={editMeal}
      />
      <RateMealModal
        open={!!rating}
        meal={rating}
        onClose={() => setRatingMeal(null)}
        onRate={rateMeal}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="text-coral-400 text-3xl animate-pulse">🔥</div>
      <div className="text-zinc-500 text-sm mt-2 italic">heating up the kitchen…</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const mascot = MASCOTS[mascotFor('empty-state')];
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
      <div className="text-5xl mb-3">{mascot.emoji}</div>
      <h2 className="font-display text-2xl font-black uppercase tracking-wide">
        {mascot.caption}
      </h2>
      <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
        Nothing logged yet. Add your first meal — {mascot.name} will judge you accordingly.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition shadow-lg shadow-coral-500/20"
      >
        Log your first meal
      </button>
    </div>
  );
}
