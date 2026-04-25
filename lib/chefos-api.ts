/**
 * ChefOS authenticated API client.
 * Wraps fetch with:
 *   • Automatic Bearer token from localStorage
 *   • Single-flight refresh on 401
 *   • Typed JSON responses + structured errors
 *
 * Endpoints used by the web platform map 1:1 to what iOS uses,
 * so both clients hit the same backend.
 */
import { API_URL } from './api';
import { getAccessToken, refresh, logout } from './auth-client';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let inflightRefresh: Promise<string | null> | null = null;

async function getFreshAccessToken(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = refresh()
    .then((t) => t?.access_token ?? null)
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Set true to skip Authorization header (public endpoints). */
  anonymous?: boolean;
};

async function rawRequest<T>(path: string, opts: RequestOptions, token: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token && !opts.anonymous) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  let parsed: unknown = undefined;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg =
      (typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }

  return parsed as T;
}

/**
 * Authenticated request with single-flight refresh on 401.
 */
export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  try {
    return await rawRequest<T>(path, opts, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !opts.anonymous) {
      const fresh = await getFreshAccessToken();
      if (!fresh) {
        logout();
        throw err;
      }
      return rawRequest<T>(path, opts, fresh);
    }
    throw err;
  }
}

// ── Convenience wrappers ─────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};
