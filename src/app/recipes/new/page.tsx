'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/auth-context';
import { useRecipes } from '@/lib/hooks';
import { RecipeForm, RecipeFormValues } from '@/components/RecipeForm';

export default function NewRecipePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { createRecipe } = useRecipes();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-coral-400 text-3xl animate-pulse" aria-hidden="true">
            🔥
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (values: RecipeFormValues) => {
    const created = await createRecipe(values);
    router.push(`/recipes/view?id=${encodeURIComponent(created.recipeId)}`);
  };

  return (
    <div>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black uppercase tracking-wide">
            New recipe
          </h2>
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-coral-300 transition uppercase tracking-wider font-semibold"
          >
            ← Back
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 brand-stamp">
          <RecipeForm submitLabel="Create recipe" onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}
