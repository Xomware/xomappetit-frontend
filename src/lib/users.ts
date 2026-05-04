import { AuthRequiredError } from './api';
import { getJwtToken } from './auth-context';

const USERS_API_BASE =
  process.env.NEXT_PUBLIC_USERS_API_URL || 'https://api.xomware.com';

export type ProfileVisibility = 'public' | 'private';

/** Full profile returned by /users/me and /users/edit. */
export interface UserProfile {
  userId: string;
  email: string;
  preferredUsername: string;
  displayName: string;
  avatarUrl: string | null;
  /** Hex color (`#rrggbb`) for the stock SVG avatar; null when using uploaded photo or app default. */
  avatarStockColor: string | null;
  /** Recently-used avatar URLs (most recent first, capped at 6). */
  avatarHistory: string[];
  profileVisibility: ProfileVisibility;
  createdAt: string;
}

/** Public lookup shape — never exposes email. */
export interface PublicUserProfile {
  userId: string;
  preferredUsername: string;
  displayName: string;
  avatarUrl: string | null;
  avatarStockColor: string | null;
  profileVisibility: ProfileVisibility;
}

export interface EditProfileFields {
  displayName?: string;
  avatarUrl?: string | null;
  avatarStockColor?: string | null;
  profileVisibility?: ProfileVisibility;
}

export type AvatarContentType = 'image/png' | 'image/jpeg' | 'image/webp';

interface PresignAvatarResponse {
  uploadUrl: string;
  finalUrl: string;
}

/**
 * Errors that should not blow up the SWR boundary — currently just 404 from
 * /users/me when the PostConfirmation Lambda hasn't fired yet. Callers
 * (the SWR hook) detect this and retry once.
 */
export class ProfileNotReadyError extends Error {
  constructor() {
    super('Profile not ready');
    this.name = 'ProfileNotReadyError';
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
  const res = await fetch(`${USERS_API_BASE}${path}`, {
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
  if (res.status === 404 && path === '/users/me') {
    throw new ProfileNotReadyError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Users API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const usersApi = {
  me: async (): Promise<UserProfile> => apiPost<UserProfile>('/users/me'),

  getByHandle: async (handle: string): Promise<PublicUserProfile> =>
    apiPost<PublicUserProfile>('/users/get-by-handle', { handle }),

  edit: async (fields: EditProfileFields): Promise<UserProfile> =>
    apiPost<UserProfile>('/users/edit', fields),

  presignAvatar: async (
    contentType: AvatarContentType,
  ): Promise<PresignAvatarResponse> =>
    apiPost<PresignAvatarResponse>('/users/presign-avatar', { contentType }),

  /**
   * Full upload flow: ask the API for a presigned PUT, push the raw file body
   * directly to S3, and return the CDN URL. Callers persist `finalUrl` via
   * `usersApi.edit({ avatarUrl })`.
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const ct = file.type;
    if (ct !== 'image/png' && ct !== 'image/jpeg' && ct !== 'image/webp') {
      throw new Error('Avatar must be a PNG, JPEG, or WebP image');
    }
    const { uploadUrl, finalUrl } = await usersApi.presignAvatar(ct);
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': ct },
      body: file,
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      throw new Error(`Avatar upload failed (${putRes.status}): ${text}`);
    }
    return finalUrl;
  },
};
