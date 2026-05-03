import useSWR, { mutate } from 'swr';
import { mealsApi, commentsApi } from './storage';
import { Meal, MealRating } from '@/types';

const MEALS_KEY = 'meals';
const commentsKey = (mealId: string) => ['comments', mealId] as const;

type EditableMealFields = Parameters<typeof mealsApi.edit>[1];

export function useMeals() {
  const { data, error, isLoading } = useSWR(MEALS_KEY, mealsApi.getAll);

  return {
    meals: data ?? [],
    isLoading,
    error,
    addMeal: async (meal: Omit<Meal, 'id' | 'createdAt' | 'cooked'>) => {
      await mealsApi.add(meal);
      mutate(MEALS_KEY);
    },
    editMeal: async (id: string, fields: EditableMealFields) => {
      await mealsApi.edit(id, fields);
      mutate(MEALS_KEY);
    },
    toggleCooked: async (id: string) => {
      await mealsApi.toggleCooked(id);
      mutate(MEALS_KEY);
    },
    rateMeal: async (id: string, rating: MealRating) => {
      await mealsApi.rate(id, rating);
      mutate(MEALS_KEY);
    },
    deleteMeal: async (id: string) => {
      await mealsApi.delete(id);
      mutate(MEALS_KEY);
    },
  };
}

export function useMealComments(mealId: string | null) {
  const key = mealId ? commentsKey(mealId) : null;
  const { data, error, isLoading } = useSWR(key, () =>
    mealId ? commentsApi.list(mealId) : Promise.resolve([])
  );

  return {
    comments: data ?? [],
    isLoading,
    error,
    addComment: async (body: string) => {
      if (!mealId) return;
      await commentsApi.add(mealId, body);
      mutate(commentsKey(mealId));
    },
    deleteComment: async (commentId: string) => {
      if (!mealId) return;
      await commentsApi.delete(mealId, commentId);
      mutate(commentsKey(mealId));
    },
  };
}
