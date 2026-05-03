export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface Meal {
  id: string;
  name: string;
  timeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  proteinSource: string;
  ingredients: (string | Ingredient)[];
  instructions?: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  cooked: boolean;
  rating?: MealRating;
  createdAt: string;
}

export interface MealRating {
  taste: number;
  ease: number;
  speed: number;
  healthiness: number;
  notes: string;
}

export interface MealComment {
  mealId: string;
  commentId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export type ViewMode = 'table' | 'card';

export interface Filters {
  proteinSource: string;
  difficulty: string;
  cookedStatus: string;
  timeMin: number;
  timeMax: number;
}

export const ingredientName = (i: string | Ingredient): string =>
  typeof i === 'string' ? i : i.name;

export const ingredientLabel = (i: string | Ingredient): string => {
  if (typeof i === 'string') return i;
  const parts: string[] = [];
  if (i.quantity != null) parts.push(String(i.quantity));
  if (i.unit) parts.push(i.unit);
  parts.push(i.name);
  return parts.join(' ');
};
