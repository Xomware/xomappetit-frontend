import useSWR, { mutate } from 'swr';
import {
  CreateRecipeInput,
  EditCookInput,
  EditRecipeInput,
  LogCookInput,
  commentsApi,
  cooksApi,
  friendsApi,
  recipesApi,
} from './api';
import { useAuth } from './auth-context';

const FRIENDS_KEY = 'friends';
const FEED_KEY = 'friends:feed';

const RECIPES_KEY = 'recipes';
const recipeKey = (id: string) => ['recipe', id] as const;
const commentsKey = (id: string) => ['recipe-comments', id] as const;
const COOKS_MINE_KEY = 'cooks:mine';
const cooksForRecipeKey = (id: string) => ['cooks:recipe', id] as const;
const cookKey = (id: string) => ['cook', id] as const;

export function useRecipes() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading } = useSWR(
    isAuthenticated ? RECIPES_KEY : null,
    () => recipesApi.list(),
  );

  return {
    recipes: data ?? [],
    isLoading: isAuthenticated ? isLoading : false,
    error,
    createRecipe: async (body: CreateRecipeInput) => {
      const created = await recipesApi.create(body);
      mutate(RECIPES_KEY);
      return created;
    },
    editRecipe: async (id: string, fields: EditRecipeInput) => {
      const updated = await recipesApi.edit(id, fields);
      mutate(RECIPES_KEY);
      mutate(recipeKey(id));
      return updated;
    },
    deleteRecipe: async (id: string) => {
      await recipesApi.delete(id);
      mutate(RECIPES_KEY);
    },
  };
}

/** Friends feed — recipes from caller + accepted friends, newest first. */
export function useFeed() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate: mutateFeed } = useSWR(
    isAuthenticated ? FEED_KEY : null,
    () => friendsApi.feed(),
  );
  return {
    items: data?.items ?? [],
    friendCount: data?.friendCount ?? 0,
    isLoading: isAuthenticated ? isLoading : false,
    error,
    refresh: () => mutateFeed(),
  };
}

/** All friendship state in one shot, plus mutator helpers. */
export function useFriends() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate: mutateFriends } = useSWR(
    isAuthenticated ? FRIENDS_KEY : null,
    () => friendsApi.list(),
  );
  return {
    friends: data?.friends ?? [],
    incomingPending: data?.incomingPending ?? [],
    outgoingPending: data?.outgoingPending ?? [],
    isLoading: isAuthenticated ? isLoading : false,
    error,
    refresh: () => mutateFriends(),
    addFriend: async (friendUserId: string) => {
      const res = await friendsApi.add(friendUserId);
      mutate(FRIENDS_KEY);
      mutate(FEED_KEY);
      return res;
    },
    respond: async (friendUserId: string, action: 'accept' | 'decline') => {
      const res = await friendsApi.respond(friendUserId, action);
      mutate(FRIENDS_KEY);
      mutate(FEED_KEY);
      return res;
    },
    remove: async (friendUserId: string) => {
      await friendsApi.remove(friendUserId);
      mutate(FRIENDS_KEY);
      mutate(FEED_KEY);
    },
  };
}

/** Public recipes feed — anyone signed in can read this. */
export function usePublicRecipes() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading } = useSWR(
    isAuthenticated ? 'recipes:public' : null,
    () => recipesApi.listPublic({ limit: 50 }),
  );
  return {
    recipes: data?.items ?? [],
    nextCursor: data?.nextCursor ?? null,
    isLoading: isAuthenticated ? isLoading : false,
    error,
  };
}

/** Recipes by another user (filtered to public on the server). */
export function useUserRecipes(authorUserId: string | null) {
  const { isAuthenticated } = useAuth();
  const key = authorUserId && isAuthenticated ? ['user-recipes', authorUserId] as const : null;
  const { data, error, isLoading } = useSWR(key, () =>
    authorUserId ? recipesApi.list(authorUserId) : Promise.reject(new Error('no id')),
  );
  return { recipes: data ?? [], isLoading, error };
}

export function useRecipe(recipeId: string | null) {
  const { isAuthenticated } = useAuth();
  const key = recipeId && isAuthenticated ? recipeKey(recipeId) : null;
  const { data, error, isLoading, mutate: mutateOne } = useSWR(key, () =>
    recipeId ? recipesApi.get(recipeId) : Promise.reject(new Error('no id')),
  );

  return {
    recipe: data,
    isLoading,
    error,
    refresh: () => mutateOne(),
    rate: async (rating: number) => {
      if (!recipeId) return;
      await recipesApi.rate(recipeId, rating);
      mutateOne();
      mutate(RECIPES_KEY);
    },
    edit: async (fields: EditRecipeInput) => {
      if (!recipeId) return;
      const updated = await recipesApi.edit(recipeId, fields);
      mutateOne(updated, { revalidate: false });
      mutate(RECIPES_KEY);
      return updated;
    },
    remove: async () => {
      if (!recipeId) return;
      await recipesApi.delete(recipeId);
      mutate(RECIPES_KEY);
    },
  };
}

export function useRecipeComments(recipeId: string | null) {
  const { isAuthenticated } = useAuth();
  const key = recipeId && isAuthenticated ? commentsKey(recipeId) : null;
  const { data, error, isLoading } = useSWR(key, () =>
    recipeId ? commentsApi.list(recipeId) : Promise.resolve([]),
  );

  return {
    comments: data ?? [],
    isLoading,
    error,
    addComment: async (text: string) => {
      if (!recipeId) return;
      await commentsApi.add(recipeId, text);
      mutate(commentsKey(recipeId));
    },
    deleteComment: async (commentId: string) => {
      if (!recipeId) return;
      await commentsApi.delete(recipeId, commentId);
      mutate(commentsKey(recipeId));
    },
  };
}

export function useMyCooks() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading } = useSWR(
    isAuthenticated ? COOKS_MINE_KEY : null,
    () => cooksApi.list('mine'),
  );

  return {
    cooks: data ?? [],
    isLoading: isAuthenticated ? isLoading : false,
    error,
  };
}

export function useRecipeCooks(recipeId: string | null) {
  const { isAuthenticated } = useAuth();
  const key = recipeId && isAuthenticated ? cooksForRecipeKey(recipeId) : null;
  const { data, error, isLoading } = useSWR(key, () =>
    recipeId ? cooksApi.list('recipe', recipeId) : Promise.resolve([]),
  );

  return {
    cooks: data ?? [],
    isLoading,
    error,
  };
}

export function useCook(cookId: string | null) {
  const { isAuthenticated } = useAuth();
  const key = cookId && isAuthenticated ? cookKey(cookId) : null;
  const { data, error, isLoading, mutate: mutateOne } = useSWR(key, () =>
    cookId ? cooksApi.get(cookId) : Promise.reject(new Error('no id')),
  );

  return {
    cook: data,
    isLoading,
    error,
    edit: async (fields: EditCookInput) => {
      if (!cookId) return;
      const updated = await cooksApi.edit(cookId, fields);
      mutateOne(updated, { revalidate: false });
      mutate(COOKS_MINE_KEY);
      return updated;
    },
    remove: async () => {
      if (!cookId) return;
      await cooksApi.delete(cookId);
      mutate(COOKS_MINE_KEY);
    },
  };
}

export async function logCook(body: LogCookInput) {
  const cook = await cooksApi.log(body);
  mutate(COOKS_MINE_KEY);
  mutate(cooksForRecipeKey(body.recipeId));
  mutate(recipeKey(body.recipeId));
  mutate(RECIPES_KEY);
  return cook;
}
