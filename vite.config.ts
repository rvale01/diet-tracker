import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig, type Connect, type Plugin } from 'vite';
import { GET as calendar } from './api/calendar';
import { POST as data } from './api/data';
import { POST as login } from './api/login';
import { GET as tfl } from './api/tfl';

/** Serve the Vercel /api functions locally too. Data is kept in memory; the password is "dev". */
function localApi(): Plugin {
  const routes: Record<string, (r: Request) => Promise<Response>> = { '/api/calendar': calendar, '/api/data': data, '/api/login': login, '/api/tfl': tfl };
  const mw: Connect.NextHandleFunction = async (req, res, next) => {
    const handler = routes[req.url?.split('?')[0] ?? ''];
    if (!handler) return next();
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const r = await handler(new Request(`http://localhost${req.url}`, {
      method: req.method, headers: req.headers as any, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    }));
    res.statusCode = r.status;
    r.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(await r.text());
  };
  return { name: 'local-api', configureServer: (s) => { s.middlewares.use(mw); }, configurePreviewServer: (s) => { s.middlewares.use(mw); } };
}

export default defineConfig({
  plugins: [
    localApi(),
    react(),
    // Cheap Android photo frames ship an old built-in browser: also build a version that runs there.
    legacy({ targets: ['chrome >= 49', 'android >= 5'], modernPolyfills: true }),
  ],
});
