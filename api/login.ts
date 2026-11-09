// POST /api/login { password } -> { token }
import { login } from '../server/auth.js';

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const token = await login(body.password ?? '');
  if (!token) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: 'Wrong password.' }, { status: 401 });
  }
  return Response.json({ token });
}
