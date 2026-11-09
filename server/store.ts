// Every collection is a Redis hash (pd:<collection>) of id -> JSON. Item-level writes, so the
// phone and the kitchen board never overwrite each other's changes.
import { getKv } from './kv.js';

export const COLLECTIONS = ['settings', 'meta', 'dietDays', 'sessions', 'weights', 'bills', 'billPayments', 'todos', 'expenses'] as const;
export type Collection = (typeof COLLECTIONS)[number];
const VERSION = 'pd:version';

export const isCollection = (c: unknown): c is Collection => COLLECTIONS.includes(c as Collection);

export async function version(): Promise<number> {
  return Number((await getKv().get(VERSION)) ?? 0);
}

export async function readAll() {
  const kv = getKv();
  const hashes = await Promise.all(COLLECTIONS.map((c) => kv.hgetall(`pd:${c}`)));
  const data: Record<string, Record<string, unknown>> = {};
  COLLECTIONS.forEach((c, i) => {
    data[c] = {};
    for (const [id, json] of Object.entries(hashes[i])) {
      try { data[c][id] = JSON.parse(json); } catch { /* skip a broken row */ }
    }
  });
  return { version: await version(), data };
}

export interface Write { col: Collection; id: string; value?: unknown }

/** Apply writes (value undefined or null = delete). Returns the new version. */
export async function write(writes: Write[]): Promise<number> {
  const kv = getKv();
  for (const w of writes) {
    if (w.value === undefined || w.value === null) await kv.hdel(`pd:${w.col}`, [w.id]);
    else await kv.hset(`pd:${w.col}`, { [w.id]: JSON.stringify(w.value) });
  }
  return kv.incr(VERSION);
}

export async function settings(): Promise<Record<string, any>> {
  const raw = await getKv().hgetall('pd:settings');
  try { return raw.main ? JSON.parse(raw.main) : {}; } catch { return {}; }
}

/** Small JSON cache in Redis, used for calendar feeds. */
export async function cached<T>(key: string, maxAgeMs: number, fetcher: () => Promise<T>): Promise<T> {
  const kv = getKv();
  const hit = await kv.get(`pd:cache:${key}`).then((v) => (v ? JSON.parse(v) : null)).catch(() => null);
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.value;
  try {
    const value = await fetcher();
    await kv.set(`pd:cache:${key}`, JSON.stringify({ at: Date.now(), value }));
    return value;
  } catch (e) {
    if (hit) return hit.value;
    throw e;
  }
}
