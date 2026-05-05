'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { useRecipe, logCook } from '@/lib/hooks';
import { CookForm, CookFormValues } from '@/components/CookForm';
import Loader from '@/components/Loader';

export default function NewCookPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <NewCookInner />
    </Suspense>
  );
}

function NewCookInner() {
  const router = useRouter();
  const params = useSearchParams();
  const recipeId = params.get('recipeId');
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { recipe, isLoading } = useRecipe(recipeId);

  if (authLoading || !isAuthenticated) {
    return <Fallback />;
  }

  if (!recipeId) {
    return (
      <FullPageMessage caption="Missing recipeId in the URL." backHref="/" />
    );
  }

  const handleSubmit = async (values: CookFormValues) => {
    const cook = await logCook({
      recipeId,
      cookedAt: values.cookedAt,
      chefs: values.chefs,
      diners: values.diners,
      notes: values.notes || undefined,
      photoUrl: values.photoUrl,
      rating: values.rating,
      spiciness: values.spiciness,
      sweetness: values.sweetness,
      saltiness: values.saltiness,
      richness: values.richness,
    });
    router.push(`/cooks/view?id=${encodeURIComponent(cook.cookId)}`);
  };

  return (
    <div>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">
            Log a cook
          </h2>
          <Link
            href={`/recipes/view?id=${encodeURIComponent(recipeId)}`}
            className="text-xs text-zinc-400 hover:text-coral-300 transition uppercase tracking-wider font-semibold"
          >
            ← Cancel
          </Link>
        </div>

        <div className="rounded-xl border border-coral-500/30 bg-coral-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-coral-300 font-semibold mb-1">
            For recipe
          </div>
          <div className="font-bold text-zinc-100">
            {isLoading ? 'loading…' : recipe?.name ?? recipeId}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            You&apos;ll be added as a chef automatically.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
          <CookForm submitLabel="Log cook" showCookedAt onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}

function Fallback() {
  return <Loader fullscreen />;
}

function FullPageMessage({ caption, backHref }: { caption: string; backHref: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-coral-400 text-3xl" aria-hidden="true">
          🍳
        </div>
        <div className="text-zinc-400 text-sm mt-3">{caption}</div>
        <Link
          href={backHref}
          className="mt-5 inline-block bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-coral-500/50 text-zinc-100 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
