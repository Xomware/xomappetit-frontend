'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Amplify } from 'aws-amplify';
import {
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  signIn as amplifySignIn,
  signInWithRedirect,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
} from 'aws-amplify/auth';
import { identify } from './analytics';

// ---- Amplify config (runs once at module load on the client) ----

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

if (typeof window !== 'undefined' && userPoolId && userPoolClientId) {
  const origin = window.location.origin;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: cognitoDomain
          ? {
              oauth: {
                domain: cognitoDomain,
                scopes: ['email', 'openid', 'profile'],
                redirectSignIn: [`${origin}/auth/callback`],
                redirectSignOut: [origin],
                responseType: 'code',
              },
            }
          : undefined,
      },
    },
  });
}

// ---- Types ----

export interface AuthUser {
  sub: string;
  email: string;
  preferredUsername: string;
}

export type SignInResult =
  | { kind: 'success' }
  | { kind: 'requires-confirmation'; email: string }
  | { kind: 'error'; message: string };

export type SignUpResult =
  | { kind: 'success'; email: string; username: string }
  | { kind: 'error'; message: string };

export type SimpleResult = { kind: 'success' } | { kind: 'error'; message: string };

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, preferredUsername: string) => Promise<SignUpResult>;
  confirmSignUp: (email: string, code: string) => Promise<SimpleResult>;
  resendCode: (email: string) => Promise<SimpleResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getJwt: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      const next: AuthUser = {
        sub: current.userId,
        email: attrs.email ?? '',
        preferredUsername: attrs.preferred_username ?? current.username,
      };
      setUser(next);
      identify(next.sub);
      return next;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadUser();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      try {
        const res = await amplifySignIn({ username: email, password });
        if (res.isSignedIn) {
          await loadUser();
          return { kind: 'success' };
        }
        const step = res.nextStep?.signInStep;
        if (step === 'CONFIRM_SIGN_UP') {
          return { kind: 'requires-confirmation', email };
        }
        return { kind: 'error', message: `Additional step required: ${step ?? 'unknown'}` };
      } catch (err) {
        return { kind: 'error', message: errorMessage(err) };
      }
    },
    [loadUser],
  );

  const signUp = useCallback<AuthContextValue['signUp']>(
    async (email, password, preferredUsername) => {
      try {
        // The user pool uses alias_attributes = ["email", "preferred_username"]
        // (Option B), which means the underlying Cognito Username CANNOT be in
        // email format. We generate an opaque UUID — users still sign IN with
        // email (alias resolution handles it).
        const opaqueUsername =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // preferred_username CAN'T be a userAttribute during SignUp because
        // alias_attributes includes it — Cognito reserves alias attrs for
        // confirmed accounts only. Pass it via clientMetadata so the
        // PostConfirmation Lambda picks it up and writes it to the users
        // DDB row (and later to the Cognito alias once we wire that).
        await amplifySignUp({
          username: opaqueUsername,
          password,
          options: {
            userAttributes: {
              email,
            },
            clientMetadata: {
              preferred_username: preferredUsername,
            },
          },
        });
        // Return the opaque Username (UUID) — verify must use this, not
        // the email, because email aliases aren't reliable on UNCONFIRMED
        // users (multiple unconfirmed users can share an email; lookup
        // returns ambiguous and 400s the verify call).
        return { kind: 'success', email, username: opaqueUsername };
      } catch (err) {
        return { kind: 'error', message: errorMessage(err) };
      }
    },
    [],
  );

  const confirmSignUp = useCallback<AuthContextValue['confirmSignUp']>(
    async (email, code) => {
      try {
        await amplifyConfirmSignUp({ username: email, confirmationCode: code });
        return { kind: 'success' };
      } catch (err) {
        return { kind: 'error', message: errorMessage(err) };
      }
    },
    [],
  );

  const resendCode = useCallback<AuthContextValue['resendCode']>(async (email) => {
    try {
      await resendSignUpCode({ username: email });
      return { kind: 'success' };
    } catch (err) {
      return { kind: 'error', message: errorMessage(err) };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Phase 4: kick off Google federated sign-in via Cognito Hosted UI.
    // Amplify navigates the page to Google's consent screen; control returns
    // to the app at /auth/callback after the round trip.
    await signInWithRedirect({ provider: 'Google' });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await amplifySignOut();
    } finally {
      setUser(null);
    }
  }, []);

  const getJwt = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ?? null;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      confirmSignUp,
      resendCode,
      signInWithGoogle,
      signOut,
      getJwt,
    }),
    [
      user,
      isLoading,
      signIn,
      signUp,
      confirmSignUp,
      resendCode,
      signInWithGoogle,
      signOut,
      getJwt,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---- Hooks ----

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/**
 * Client-side route guard. Use in protected pages — redirects to /auth/sign-in
 * (preserving the requested path) when no user is present.
 *
 * Static export means we cannot rely on Next.js middleware, so this hook
 * is the canonical gate.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    if (typeof window === 'undefined') return;
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/auth/sign-in?next=${next}`);
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}

// ---- Helpers ----

function errorMessage(err: unknown): string {
  // Amplify v6 puts the Cognito exception class on err.name and the human
  // text on err.message — surface both so the UI doesn't show a meaningless
  // 'Authentication required' when something specific went wrong.
  if (err instanceof Error) {
    const name = err.name && err.name !== 'Error' ? err.name : '';
    return name && err.message ? `${name}: ${err.message}` : err.message || name || 'Unexpected error';
  }
  if (typeof err === 'string') return err;
  return 'Unexpected error';
}

// Re-export so callers can grab a JWT outside of React (e.g. storage.ts) without
// reaching into Amplify directly.
export async function getJwtToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}
