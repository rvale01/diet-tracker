// POST /api/mcp/<key>: the Claude connector, a small MCP server (Streamable HTTP, stateless, JSON replies).
// Add the link from Settings → Claude as a custom connector, then ask Claude to add to-dos, spending or weigh-ins.
// The key can also come as ?key=… or "Authorization: Bearer …". vercel.json rewrites /api/mcp/<key> here.
import { verifyConnector } from '../server/auth.js';
import { callTool, listTools } from '../server/connector.js';

const LATEST = '2025-06-18';
const INSTRUCTIONS =
  'The user\'s personal dashboard (phone and kitchen board). Use it when they ask to add or tick off to-dos, ' +
  'log spending, or log a weigh-in. Dates are UK dates; list_todos gives today\'s date.';

type Msg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };
const ok = (id: Msg['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const fail = (id: Msg['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

function keyOf(req: Request): string | null {
  const url = new URL(req.url, 'http://localhost');
  return url.searchParams.get('key')
    || url.pathname.match(/^\/api\/mcp\/([^/]+)/)?.[1]
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || null;
}

async function handle(msg: Msg): Promise<object | null> {
  if (!msg || typeof msg !== 'object') return fail(null, -32600, 'Invalid request');
  if (typeof msg.method !== 'string') return null; // a reply to a request we never send: ignore
  if (msg.id === undefined) return null; // notifications (e.g. notifications/initialized) need no answer
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      return ok(id, {
        protocolVersion: typeof asked === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : LATEST,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'personal-dashboard', title: 'Dashboard', version: '1.0.0' },
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: await listTools() });
    case 'tools/call': {
      try {
        const text = await callTool(String(params?.name ?? ''), params?.arguments ?? {});
        return ok(id, { content: [{ type: 'text', text }] });
      } catch (e) {
        // Shown to Claude so it can fix the input or tell the user (also covers database errors).
        return ok(id, { content: [{ type: 'text', text: e instanceof Error ? e.message : 'Something went wrong.' }], isError: true });
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: Request): Promise<Response> {
  if (!(await verifyConnector(keyOf(req)))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: 'Unknown connector link. Copy it again from Settings → Claude.' }, { status: 401 });
  }
  let body: Msg | Msg[];
  try { body = await req.json(); } catch { return Response.json(fail(null, -32700, 'Parse error'), { status: 400 }); }
  const replies = (await Promise.all((Array.isArray(body) ? body : [body]).map(handle))).filter(Boolean);
  if (!replies.length) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(body) ? replies : replies[0], { headers: { 'cache-control': 'no-store' } });
}

// No server-to-client stream and no sessions: only POST is supported.
const notAllowed = () => new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
export const GET = notAllowed;
export const DELETE = notAllowed;
