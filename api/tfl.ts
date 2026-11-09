// GET /api/tfl?path=/Line/Mode/tube/Status (signed in). A small proxy to the public TfL API,
// limited to the read-only endpoints the dashboard uses.
import { unauthorized, verify } from '../server/auth.js';

const ALLOWED = [
  /^\/Line\/Mode\/[a-z,-]+\/Status$/,
  /^\/Line\/[a-z0-9,-]+\/Status$/,
  /^\/StopPoint\/Search\/[^/?#]{1,60}$/,
  /^\/StopPoint\/[A-Za-z0-9]{3,20}\/Arrivals$/,
  /^\/StopPoint\/[A-Za-z0-9]{3,20}$/,
];

export async function GET(req: Request): Promise<Response> {
  if (!(await verify(req))) return unauthorized();
  const q = new URL(req.url).searchParams;
  const path = q.get('path') ?? '';
  if (!ALLOWED.some((r) => r.test(path))) return Response.json({ error: 'Not allowed.' }, { status: 400 });
  const extra = new URLSearchParams();
  for (const k of ['modes', 'maxResults']) { const v = q.get(k); if (v) extra.set(k, v); }
  try {
    const res = await fetch(`https://api.tfl.gov.uk${path}${extra.size ? '?' + extra : ''}`, { headers: { accept: 'application/json' } });
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=20' } });
  } catch {
    return Response.json({ error: 'TfL unreachable.' }, { status: 502 });
  }
}
