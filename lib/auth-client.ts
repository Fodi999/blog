/**
 * ChefOS Web — Auth client.
 * Talks to the same Rust backend as the iPhone app.
 *
 *   POST /api/auth/register  → AuthTokens
 *   POST /api/auth/login     → AuthTokens
 *   POST /api/auth/refresh   → AuthTokens
 *
 * Tokens live in localStorage (access + refresh) plus a non-httpOnly
 * cookie `chefos_session=1` so middleware/SSR can cheaply check
 * "is the user logged in?" without parsing JWTs.
 */
import { API_URL } from './api';

const ACCESS_KEY = 'chefos.access_token';
const REFRESH_KEY = 'chefos.refresh_token';
const USER_KEY = 'chefos.user';
const SESSION_COOKIE = 'chefos_session';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  restaurant_name: string;
  owner_name?: string;
  language?: 'pl' | 'en' | 'uk' | 'ru';
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type StoredUser = {
  user_id: string;
  tenant_id: string;
  email: string;
};

class AuthError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let parsed: unknown = undefined;
    try {
      parsed = await res.json();
    } catch {
      /* ignore */
    }
    const msg =
      (typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    throw new AuthError(msg, res.status, parsed);
  }
  return (await res.json()) as T;
}

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  // SameSite=Lax keeps it cross-site safe for normal navigation.
  document.cookie = `${name}=${value}; path=/; expires=${exp}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function persist(tokens: AuthTokens, email: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      user_id: tokens.user_id,
      tenant_id: tokens.tenant_id,
      email,
    } satisfies StoredUser),
  );
  setCookie(SESSION_COOKIE, '1');
}

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const tokens = await postJson<AuthTokens>('/api/auth/register', payload);
  persist(tokens, payload.email);
  return tokens;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const tokens = await postJson<AuthTokens>('/api/auth/login', payload);
  persist(tokens, payload.email);
  return tokens;
}

export async function refresh(): Promise<AuthTokens | null> {
  if (typeof window === 'undefined') return null;
  const refresh_token = localStorage.getItem(REFRESH_KEY);
  if (!refresh_token) return null;
  try {
    const tokens = await postJson<AuthTokens>('/api/auth/refresh', { refresh_token });
    const stored = getCurrentUser();
    persist(tokens, stored?.email ?? '');
    return tokens;
  } catch {
    logout();
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  clearCookie(SESSION_COOKIE);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export { AuthError };
