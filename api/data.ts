// POST /api/data (signed in)
//   { op: 'all' }                  -> { version, data }
//   { op: 'version' }              -> { version }
//   { op: 'write', writes: [...] } -> { version }
import { unauthorized, verify } from '../server/auth.js';
import { isCollection, readAll, version, write, type Write } from '../server/store.js';

export async function POST(req: Request): Promise<Response> {
  if (!(await verify(req))) return unauthorized();
  try {
    const body = await req.json();
    const headers = { 'cache-control': 'no-store' };
    if (body.op === 'all') return Response.json(await readAll(), { headers });
    if (body.op === 'version') return Response.json({ version: await version() }, { headers });
    if (body.op === 'write') {
      const writes: Write[] = Array.isArray(body.writes) ? body.writes : [];
      if (!writes.length || writes.length > 200) return Response.json({ error: 'Nothing to save.' }, { status: 400 });
      for (const w of writes) {
        if (!isCollection(w.col) || typeof w.id !== 'string' || !w.id || w.id.length > 100) {
          return Response.json({ error: 'Invalid write.' }, { status: 400 });
        }
        if (w.value !== undefined && w.value !== null && JSON.stringify(w.value).length > 50_000) {
          return Response.json({ error: 'Item too large.' }, { status: 400 });
        }
      }
      return Response.json({ version: await write(writes) }, { headers });
    }
    return Response.json({ error: 'Unknown operation.' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
