import { Cook, Recipe, RecipeComment } from '@/types';
import { getJwtToken } from './auth-context';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.xomappetit.xomware.com';

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getJwtToken();
  if (!token) throw new AuthRequiredError();
  return { Authorization: `Bearer ${token}` };
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/auth/sign-in?next=${next}`);
  }, 0);
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const auth = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...auth,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  timeMinutes?: number;
  difficulty?: Recipe['difficulty'];
  proteinSource?: string;
  ingredients?: Recipe['ingredients'];
  instructions?: string[];
  macros?: Recipe['macros'];
  privacy?: Recipe['privacy'];
}

export type EditRecipeInput = Partial<CreateRecipeInput>;

export interface RateRecipeResult {
  recipeId: string;
  userId: string;
  rating: number;
  avgRating: number;
  ratingCount: number;
}

export interface RecipesPublicPage {
  items: Recipe[];
  nextCursor: string | null;
}

export interface FriendsListResponse {
  friends: { userId: string; since: string }[];
  incomingPending: { userId: string; requestedAt: string }[];
  outgoingPending: { userId: string; requestedAt: string }[];
}

export type FeedItem =
  | { type: 'recipe'; recipe: Recipe }
  | { type: 'cook'; cook: Cook; recipe: Recipe };

export interface FriendsFeedResponse {
  items: FeedItem[];
  friendCount: number;
}

export const friendsApi = {
  list: (): Promise<FriendsListResponse> =>
    apiPost<FriendsListResponse>('/friends/list'),
  add: (friendUserId: string): Promise<{ status: 'pending' | 'accepted'; alreadyFriends?: boolean; alreadyRequested?: boolean; mutualRequest?: boolean }> =>
    apiPost('/friends/add', { friendUserId }),
  respond: (friendUserId: string, action: 'accept' | 'decline'): Promise<{ status: 'accepted' | 'declined' }> =>
    apiPost('/friends/respond', { friendUserId, action }),
  remove: (friendUserId: string): Promise<{ status: 'removed' }> =>
    apiPost('/friends/remove', { friendUserId }),
  feed: (limit = 50): Promise<FriendsFeedResponse> =>
    apiPost<FriendsFeedResponse>('/friends/feed', { limit }),
};

export const recipesApi = {
  /** Caller's own recipes (default), or another user's public recipes when `authorUserId` is set. */
  list: (authorUserId?: string): Promise<Recipe[]> =>
    apiPost<Recipe[]>('/recipes/list', authorUserId ? { authorUserId } : undefined),
  /** Global feed of `privacy = 'public'` recipes, newest first. */
  listPublic: (opts?: { limit?: number; cursor?: string }): Promise<RecipesPublicPage> =>
    apiPost<RecipesPublicPage>('/recipes/list-public', opts ?? {}),
  create: (body: CreateRecipeInput): Promise<Recipe> =>
    apiPost<Recipe>('/recipes/create', body),
  get: (recipeId: string): Promise<Recipe> =>
    apiPost<Recipe>('/recipes/get', { recipeId }),
  edit: (recipeId: string, fields: EditRecipeInput): Promise<Recipe> =>
    apiPost<Recipe>('/recipes/edit', { recipeId, ...fields }),
  delete: (recipeId: string): Promise<void> =>
    apiPost<void>('/recipes/delete', { recipeId }),
  rate: (recipeId: string, rating: number): Promise<RateRecipeResult> =>
    apiPost<RateRecipeResult>('/recipes/rate', { recipeId, rating }),
  like: (recipeId: string): Promise<{ recipeId: string; likeCount: number; likedByMe: boolean }> =>
    apiPost('/recipes/like', { recipeId }),
};

export const commentsApi = {
  list: (recipeId: string): Promise<RecipeComment[]> =>
    apiPost<RecipeComment[]>('/recipes/comments-list', { recipeId }),
  add: (recipeId: string, text: string): Promise<RecipeComment> =>
    apiPost<RecipeComment>('/recipes/comment-add', { recipeId, text }),
  delete: (recipeId: string, commentId: string): Promise<void> =>
    apiPost<void>('/recipes/comment-delete', { recipeId, commentId }),
};

export interface LogCookInput {
  recipeId: string;
  cookedAt?: string;
  chefs?: string[];
  diners?: string[];
  notes?: string;
  photoUrl?: string | null;
  rating?: number | null;
}

export interface EditCookInput {
  notes?: string;
  photoUrl?: string | null;
  rating?: number | null;
}

export type CookListScope = 'mine' | 'recipe';

export const cooksApi = {
  log: (body: LogCookInput): Promise<Cook> => apiPost<Cook>('/cooks/log', body),
  list: (scope: CookListScope, recipeId?: string): Promise<Cook[]> =>
    apiPost<Cook[]>('/cooks/list', { scope, ...(recipeId ? { recipeId } : {}) }),
  get: (cookId: string): Promise<Cook> => apiPost<Cook>('/cooks/get', { cookId }),
  edit: (cookId: string, fields: EditCookInput): Promise<Cook> =>
    apiPost<Cook>('/cooks/edit', { cookId, ...fields }),
  delete: (cookId: string): Promise<void> =>
    apiPost<void>('/cooks/delete', { cookId }),
};

export interface CookComment {
  cookId: string;
  commentId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export const cookCommentsApi = {
  list: (cookId: string): Promise<CookComment[]> =>
    apiPost<CookComment[]>('/cooks/comments-list', { cookId }),
  add: (cookId: string, text: string): Promise<CookComment> =>
    apiPost<CookComment>('/cooks/comment-add', { cookId, text }),
  delete: (cookId: string, commentId: string): Promise<void> =>
    apiPost<void>('/cooks/comment-delete', { cookId, commentId }),
};

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'recipe_liked'
  | 'comment_added';

export interface Notification {
  userId: string;
  sortKey: string;
  notifId: string;
  type: NotificationType;
  actorUserId: string;
  refType: 'recipe' | 'cook' | 'friend';
  refId: string;
  meta: { recipeName?: string } | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: Notification[];
  nextCursor: string | null;
  unreadInPage: number;
}

export const notificationsApi = {
  list: (opts?: { limit?: number; cursor?: string }): Promise<NotificationsListResponse> =>
    apiPost<NotificationsListResponse>('/notifications/list', opts ?? {}),
  markRead: (sortKey: string): Promise<{ updated: number }> =>
    apiPost('/notifications/mark-read', { sortKey }),
  markAllRead: (): Promise<{ updated: number }> =>
    apiPost('/notifications/mark-read', { all: true }),
};
