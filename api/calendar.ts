// GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD (signed in)
//  -> { events, familyBills, errors } from your own calendar links (Settings) and HomeHub.
import { unauthorized, verify } from '../server/auth.js';
import { familyBills, familyEvents, zonedMidnight, addDaysKey } from '../server/homehub.js';
import { feedEvents, type CalEvent } from '../server/ics.js';
import { settings } from '../server/store.js';

const KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request): Promise<Response> {
  if (!(await verify(req))) return unauthorized();
  const q = new URL(req.url).searchParams;
  const fromKey = q.get('from') ?? '';
  const toKey = q.get('to') ?? '';
  if (!KEY.test(fromKey) || !KEY.test(toKey) || toKey < fromKey || Date.parse(toKey) - Date.parse(fromKey) > 400 * 86400000) {
    return Response.json({ error: 'Bad date range.' }, { status: 400 });
  }
  const from = zonedMidnight(fromKey);
  const to = zonedMidnight(addDaysKey(toKey, 1));
  const s = await settings().catch(() => ({} as Record<string, any>));
  const feeds: { id: string; name: string; url: string; enabled?: boolean }[] = Array.isArray(s.calendars) ? s.calendars : [];

  const errors: { source: string; error: string }[] = [];
  const events: CalEvent[] = [];
  const jobs = feeds.filter((f) => f.enabled !== false && f.url).map(async (f) => {
    try { events.push(...(await feedEvents(f.url, f.id, from, to))); }
    catch (e) { errors.push({ source: f.id, error: e instanceof Error ? e.message : 'Could not read calendar' }); }
  });
  let bills = null;
  jobs.push((async () => {
    try {
      const fam = await familyEvents(from, to);
      if (fam) events.push(...fam);
      bills = await familyBills(fromKey, toKey);
    } catch (e) { errors.push({ source: 'homehub', error: e instanceof Error ? e.message : 'HomeHub unreachable' }); }
  })());
  await Promise.all(jobs);
  events.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return Response.json({ events, familyBills: bills, errors }, { headers: { 'cache-control': 'no-store' } });
}
