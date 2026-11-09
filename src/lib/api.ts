const TOKEN = 'pd.token';

export const getToken = () => { try { return localStorage.getItem(TOKEN); } catch { return null; } };
export const setToken = (t: string | null) => {
  try { if (t) localStorage.setItem(TOKEN, t); else localStorage.removeItem(TOKEN); } catch { /* private mode */ }
};

export class AuthError extends Error {}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  // Old Android browsers (photo frames) have no AbortController: skip the timeout there.
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), 15_000);
  const res = await fetch(path, {
    signal: ctrl?.signal,
    method: init?.method ?? (init?.body ? 'POST' : 'GET'),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken() ?? ''}` },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  }).catch((e) => {
    throw new Error(e?.name === 'AbortError' ? 'The server took too long to answer. Check your connection.' : 'No connection to the server.');
  }).finally(() => clearTimeout(timer));
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AuthError(json.error ?? 'Please sign in again.');
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json as T;
}

export async function login(password: string) {
  const res = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Could not sign in');
  setToken(json.token);
}
