import { Meal, MealRating, MealComment } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.xomappetit.xomware.com';
const AUTH_HASH = process.env.NEXT_PUBLIC_AUTH_HASH || '';

async function apiPost<T>(verb: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/meals/${verb}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Hash': AUTH_HASH,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function apiGet<T>(verb: string): Promise<T> {
  const res = await fetch(`${API_BASE}/meals/${verb}`, {
    method: 'GET',
    headers: {
      'X-Auth-Hash': AUTH_HASH,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

type EditableMealFields = Partial<
  Pick<
    Meal,
    'name' | 'timeMinutes' | 'difficulty' | 'proteinSource' | 'ingredients' | 'instructions' | 'macros'
  >
>;

export const mealsApi = {
  getAll: async (): Promise<Meal[]> => apiGet<Meal[]>('list'),

  add: async (meal: Omit<Meal, 'id' | 'createdAt' | 'cooked'>): Promise<Meal> =>
    apiPost<Meal>('create', meal),

  get: async (id: string): Promise<Meal> => apiPost<Meal>('get', { id }),

  edit: async (id: string, fields: EditableMealFields): Promise<Meal> =>
    apiPost<Meal>('edit', { id, ...fields }),

  toggleCooked: async (id: string): Promise<Meal> =>
    apiPost<Meal>('update', { id }),

  rate: async (id: string, rating: MealRating): Promise<Meal> =>
    apiPost<Meal>('rate', { id, ...rating }),

  delete: async (id: string): Promise<void> =>
    apiPost<void>('delete', { id }),
};

export const commentsApi = {
  list: async (mealId: string): Promise<MealComment[]> =>
    apiPost<MealComment[]>('comments-list', { mealId }),

  add: async (mealId: string, body: string): Promise<MealComment> =>
    apiPost<MealComment>('comment-add', { mealId, body }),

  delete: async (mealId: string, commentId: string): Promise<void> =>
    apiPost<void>('comment-delete', { mealId, commentId }),
};
