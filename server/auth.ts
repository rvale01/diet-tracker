// One person, one password. The password lives only in the DASHBOARD_PASSWORD environment variable.
declare const process: { env: Record<string, string | undefined> };

function password(): string | null {
  const p = process.env.DASHBOARD_PASSWORD;
  if (p) return p;
  return process.env.VERCEL ? null : 'dev'; // local development only
}

async function hmac(key: string, text: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** A token for the given password, or null when it is wrong. Changing the password signs every device out. */
export async function login(given: string): Promise<string | null> {
  const p = password();
  if (!p || typeof given !== 'string') return null;
  const [a, b] = await Promise.all([hmac('cmp', given), hmac('cmp', p)]); // constant-length comparison
  if (a !== b) return null;
  return 'v1.' + (await hmac(p, 'personal-dashboard-session'));
}

export async function verify(req: Request): Promise<boolean> {
  const p = password();
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!p || !token) return false;
  return token === 'v1.' + (await hmac(p, 'personal-dashboard-session'));
}

export const unauthorized = () => Response.json({ error: 'Please sign in again.' }, { status: 401 });
