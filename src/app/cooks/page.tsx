'use client';
import Link from 'next/link';
import { useRequireAuth, useAuth } from '@/lib/auth-context';
import { useMyCooks, useRecipes } from '@/lib/hooks';
import { Cook, Recipe } from '@/types';

export default function CooksPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const { cooks, isLoading } = useMyCooks();
  const { recipes } = useRecipes();

  const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.recipeId, r]));
  const dataReady = isAuthenticated && !isLoading;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-wide">Cooks</h2>
        <p className="text-sm text-zinc-400 mt-1">
          <span className="text-coral-400 font-semibold">{cooks.length}</span>{' '}
          {cooks.length === 1 ? 'cook session' : 'cook sessions'}
        </p>
      </div>

      {!dataReady || authLoading ? (
        <div className="text-center py-16">
          <div className="text-coral-400 text-3xl animate-pulse" aria-hidden="true">🔥</div>
          <div className="text-zinc-500 text-sm mt-2 italic">heating up the kitchen…</div>
        </div>
      ) : cooks.length === 0 ? (
        <EmptyCooks />
      ) : (
        <ul className="space-y-3">
          {cooks.map((c) => (
            <CookRow
              key={c.cookId}
              cook={c}
              recipeName={recipeMap.get(c.recipeId)?.name ?? 'Unknown recipe'}
              userId={user?.sub ?? null}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function CookRow({
  cook,
  recipeName,
  userId,
}: {
  cook: Cook;
  recipeName: string;
  userId: string | null;
}) {
  const isChef = userId ? cook.chefs.includes(userId) : false;
  const role = isChef ? 'Chef' : 'Diner';
  return (
    <li>
      <Link
        href={`/cooks/view?id=${encodeURIComponent(cook.cookId)}`}
        className="block bg-zinc-900/60 border border-zinc-800 hover:border-coral-500/50 rounded-xl p-4 transition focus:outline-none focus:ring-2 focus:ring-coral-400/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold truncate">{recipeName}</h3>
              <RoleBadge role={role} />
            </div>
            <div className="text-xs text-zinc-500 mt-1">{formatDate(cook.cookedAt)}</div>
            {cook.notes && (
              <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{cook.notes}</p>
            )}
          </div>
          {cook.rating != null && (
            <div className="text-right shrink-0">
              <div className="chef-stamp text-base">{cook.rating}/5</div>
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function RoleBadge({ role }: { role: 'Chef' | 'Diner' }) {
  const cls =
    role === 'Chef'
      ? 'bg-coral-500/15 text-coral-300 border-coral-500/30'
      : 'bg-zinc-800 text-zinc-300 border-zinc-700';
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cls}`}
    >
      {role}
    </span>
  );
}

function EmptyCooks() {
  return (
    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
      <div className="text-5xl mb-3">🍳</div>
      <h3 className="font-display text-2xl font-black uppercase tracking-wide">
        No cooks logged yet
      </h3>
      <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
        When you cook a recipe, log it here to track who cooked it, who ate it, and how it
        turned out.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-400 hover:to-coral-300 text-white font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition shadow-lg shadow-coral-500/20 focus:outline-none focus:ring-2 focus:ring-coral-400/50"
      >
        Browse recipes
      </Link>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
