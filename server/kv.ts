// Tiny key-value layer: Upstash Redis (REST) on Vercel, an in-memory store for local development.
declare const process: { env: Record<string, string | undefined> };

export interface Kv {
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, values: Record<string, string>): Promise<void>;
  hdel(key: string, fields: string[]): Promise<void>;
  incr(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  /** Set only if missing; true when this call set it. */
  setnx(key: string, value: string): Promise<boolean>;
}

function upstash(url: string, token: string): Kv {
  const cmd = async (...args: (string | number)[]) => {
    const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(args) });
    const body = await res.json();
    if (!res.ok || body.error) throw new Error(`Database: ${body.error ?? res.status}`);
    return body.result;
  };
  return {
    async hgetall(key) {
      const flat: string[] = (await cmd('HGETALL', key)) ?? [];
      const out: Record<string, string> = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
    async hset(key, values) {
      const args = Object.entries(values).flat();
      if (args.length) await cmd('HSET', key, ...args);
    },
    async hdel(key, fields) {
      if (fields.length) await cmd('HDEL', key, ...fields);
    },
    incr: (key) => cmd('INCR', key),
    get: (key) => cmd('GET', key),
    set: async (key, value) => { await cmd('SET', key, value); },
    setnx: async (key, value) => (await cmd('SET', key, value, 'NX')) === 'OK',
  };
}

function memory(): Kv {
  const g = globalThis as any;
  const db: Map<string, any> = (g.__dashKv ??= new Map());
  const hash = (key: string): Map<string, string> => {
    if (!db.has(key)) db.set(key, new Map());
    return db.get(key);
  };
  return {
    hgetall: async (key) => Object.fromEntries(hash(key)),
    hset: async (key, values) => { for (const [k, v] of Object.entries(values)) hash(key).set(k, v); },
    hdel: async (key, fields) => { fields.forEach((f) => hash(key).delete(f)); },
    incr: async (key) => { const n = Number(db.get(key) ?? 0) + 1; db.set(key, String(n)); return n; },
    get: async (key) => db.get(key) ?? null,
    set: async (key, value) => { db.set(key, value); },
    setnx: async (key, value) => { if (db.has(key)) return false; db.set(key, value); return true; },
  };
}

export function getKv(): Kv {
  const env = typeof process !== 'undefined' ? process.env : {};
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return upstash(url, token);
  if (env.VERCEL) throw new Error('Database not connected: connect Upstash Redis to this project in Vercel (Storage).');
  return memory();
}
