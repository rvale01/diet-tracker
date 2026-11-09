// All data lives on the server (one Redis hash per collection). The app keeps a copy in memory,
// saves item by item, and checks every few seconds whether another device changed something.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, AuthError, getToken, setToken } from './api';
import type { Collection, Data, Settings } from './types';

const EMPTY: Data = { settings: {}, meta: {}, dietDays: {}, sessions: {}, weights: {}, bills: {}, billPayments: {}, todos: {}, expenses: {} };
const POLL_MS = 8000;

interface Write { col: Collection; id: string; value: unknown }
type Item<C extends Collection> = Data[C] extends Record<string, infer V> ? V : never;

interface Ctx {
  status: 'signed-out' | 'loading' | 'ready';
  error: string | null;
  data: Data;
  settings: Settings;
  put: <C extends Collection>(col: C, id: string, value: Item<C> | null) => void;
  putMany: (writes: Write[]) => void;
  saveSettings: (patch: Partial<Settings>) => void;
  signedIn: () => void;
  retry: () => void;
  signOut: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Ctx['status']>(getToken() ? 'loading' : 'signed-out');
  const [data, setData] = useState<Data>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const pending = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  const fail = useCallback((e: unknown) => {
    if (e instanceof AuthError) { setToken(null); setStatus('signed-out'); setData(EMPTY); return; }
    setError(e instanceof Error ? e.message : 'Something went wrong');
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const res = await api<{ version: number; data: Data }>('/api/data', { body: { op: 'all' } });
      if (pending.current) return; // a save is in flight; the next poll will catch up
      version.current = res.version;
      setData({ ...EMPTY, ...res.data });
      setStatus('ready');
      setError(null);
    } catch (e) { fail(e); }
  }, [fail]);

  const check = useCallback(async () => {
    if (!getToken() || pending.current) return;
    try {
      const res = await api<{ version: number }>('/api/data', { body: { op: 'version' } });
      if (res.version !== version.current) await loadAll();
      else setError(null);
    } catch (e) { fail(e); }
  }, [fail, loadAll]);

  useEffect(() => {
    if (status === 'signed-out') return;
    if (status === 'loading') loadAll();
    const t = setInterval(check, POLL_MS);
    const onVis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
  }, [status, loadAll, check]);

  const putMany = useCallback((writes: Write[]) => {
    if (!writes.length) return;
    setData((d) => {
      const next = { ...d } as any;
      for (const w of writes) {
        const col = { ...next[w.col] };
        if (w.value === null || w.value === undefined) delete col[w.id]; else col[w.id] = w.value;
        next[w.col] = col;
      }
      return next;
    });
    pending.current++;
    api<{ version: number }>('/api/data', { body: { op: 'write', writes } })
      .then((res) => {
        // Only skip a reload if nobody else wrote in between.
        if (res.version === version.current + 1) version.current = res.version;
        setError(null);
      })
      .catch(fail)
      .finally(() => { pending.current--; if (!pending.current) check(); });
  }, [fail, check]);

  const put = useCallback(<C extends Collection>(col: C, id: string, value: Item<C> | null) => {
    putMany([{ col, id, value }]);
  }, [putMany]);

  const settings = data.settings.main ?? {};
  const saveSettings = useCallback((patch: Partial<Settings>) => {
    put('settings', 'main', { ...(dataRef.current.settings.main ?? {}), ...patch });
  }, [put]);

  const value = useMemo<Ctx>(() => ({
    status, error, data, settings, put, putMany, saveSettings,
    signedIn: () => setStatus('loading'),
    retry: () => { setError(null); loadAll(); },
    signOut: () => { setToken(null); setData(EMPTY); setStatus('signed-out'); },
  }), [status, error, data, settings, put, putMany, saveSettings, loadAll]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('StoreProvider missing');
  return ctx;
}
