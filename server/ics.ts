// Read-only calendar feeds (Google "secret address in iCal format", iCloud public calendar links).
import ICAL from 'ical.js';

export interface CalEvent {
  id: string;
  title: string;
  /** ISO instant, or YYYY-MM-DD for all-day events */
  start: string;
  /** ISO instant, or exclusive YYYY-MM-DD for all-day events; null when there is no end */
  end: string | null;
  allDay: boolean;
  location: string | null;
  source: string;
}

const memo = new Map<string, { at: number; text: string }>();
const TTL = 10 * 60_000;

export function normaliseFeedUrl(url: string): string {
  return url.trim().replace(/^webcals?:\/\//i, 'https://');
}

async function fetchFeed(url: string): Promise<string> {
  const hit = memo.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.text;
  const res = await fetch(url, { headers: { accept: 'text/calendar, */*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`Calendar link answered ${res.status}`);
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That link is not a calendar (.ics) link');
  memo.set(url, { at: Date.now(), text });
  return text;
}

const dateKey = (t: ICAL.Time) => `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;

function toOut(t: ICAL.Time, allDay: boolean): string {
  return allDay ? dateKey(t) : t.toJSDate().toISOString();
}

/** Events overlapping [from, to) from one feed. */
export async function feedEvents(url: string, source: string, from: Date, to: Date): Promise<CalEvent[]> {
  const comp = new ICAL.Component(ICAL.parse(await fetchFeed(normaliseFeedUrl(url))));
  for (const tz of comp.getAllSubcomponents('vtimezone')) {
    try { ICAL.TimezoneService.register(tz); } catch { /* already known */ }
  }
  const vevents = comp.getAllSubcomponents('vevent');
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];
  for (const v of vevents) {
    const ev = new ICAL.Event(v);
    if (ev.isRecurrenceException()) exceptions.push(ev);
    else masters.set(ev.uid, ev);
  }
  for (const ex of exceptions) {
    const m = masters.get(ex.uid);
    if (m) { try { m.relateException(ex); } catch { /* ignore broken exception */ } }
  }

  const fromT = ICAL.Time.fromJSDate(from, true);
  const toT = ICAL.Time.fromJSDate(to, true);
  const out: CalEvent[] = [];
  const push = (ev: ICAL.Event, start: ICAL.Time, end: ICAL.Time | null, key: string) => {
    const allDay = start.isDate;
    out.push({
      id: `${source}:${ev.uid}:${key}`,
      title: ev.summary || '(no title)',
      start: toOut(start, allDay),
      end: end ? toOut(end, allDay) : null,
      allDay,
      location: ev.location || null,
      source,
    });
  };

  for (const ev of masters.values()) {
    if (!ev.startDate) continue;
    const status = ev.component.getFirstPropertyValue('status');
    if (typeof status === 'string' && status.toUpperCase() === 'CANCELLED') continue;
    if (ev.isRecurring()) {
      const it = ev.iterator();
      for (let next = it.next(), n = 0; next && n < 1500; next = it.next(), n++) {
        if (next.compare(toT) >= 0) break;
        const det = ev.getOccurrenceDetails(next);
        const end = det.endDate ?? det.startDate;
        if (end.compare(fromT) <= 0 && det.startDate.compare(fromT) < 0) continue;
        push(det.item, det.startDate, det.endDate, next.toString());
      }
    } else {
      const end = ev.endDate ?? ev.startDate;
      if (ev.startDate.compare(toT) < 0 && (end.compare(fromT) > 0 || ev.startDate.compare(fromT) >= 0)) {
        push(ev, ev.startDate, ev.endDate, 'once');
      }
    }
  }
  return out;
}
