export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Privacy = 'public' | 'friends' | 'private';

export interface Recipe {
  recipeId: string;
  authorUserId: string;
  /** Denormalized handle (lowercase) of the author at create time. May be null for older rows or federated users without a handle yet. */
  authorHandle: string | null;
  name: string;
  description: string;
  timeMinutes: number;
  difficulty: Difficulty;
  proteinSource: string;
  ingredients: (string | Ingredient)[];
  instructions: string[];
  macros: Macros;
  privacy: Privacy;
  cookCount: number;
  /** Total likes across all users. Denormalized — updated by recipes-like. */
  likeCount?: number;
  /** Did the caller like this recipe? Only present on recipes-get / feed responses. */
  likedByMe?: boolean;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cook {
  cookId: string;
  recipeId: string;
  cookedAt: string;
  chefs: string[];
  diners: string[];
  notes: string;
  photoUrl: string | null;
  rating: number | null;
  loggedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeComment {
  recipeId: string;
  commentId: string;
  userId: string;
  text: string;
  createdAt: string;
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

export const normalizeIngredient = (i: string | Ingredient): Ingredient => {
  if (typeof i === 'string') return { name: i, quantity: null, unit: null };
  return i;
};
