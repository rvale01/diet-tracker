// Reads the family calendar and household bills from HomeHub's read-only kitchen-screen endpoint.
// The date logic below is copied from HomeHub (shared/schedule.ts and shared/bills.ts) so both apps agree.
import type { CalEvent } from './ics.js';

declare const process: { env: Record<string, string | undefined> };

export const HOUSEHOLD_TZ = 'Europe/London';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type BillSchedule = 'monthly' | 'council10' | 'quarterly' | 'half_yearly' | 'yearly' | 'none';

/** YYYY-MM-DD for a Date in the given time zone. */
export function localDateKey(d: Date, tz = HOUSEHOLD_TZ): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** HH:MM (24h) for a Date in the given time zone. */
export function localTime(d: Date, tz = HOUSEHOLD_TZ): string {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get('hour')}:${get('minute')}`;
}

/** Add days to a YYYY-MM-DD key (calendar arithmetic, no time zone involved). */
export function addDaysKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Add months to a YYYY-MM-DD key, clamping to the end of the month (31 Jan + 1 month = 28/29 Feb). */
export function addMonthsKey(key: string, months: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function stepKey(key: string, recurrence: Recurrence, n = 1): string {
  switch (recurrence) {
    case 'daily': return addDaysKey(key, n);
    case 'weekly': return addDaysKey(key, 7 * n);
    case 'monthly': return addMonthsKey(key, n);
    case 'yearly': return addMonthsKey(key, 12 * n);
    default: return key;
  }
}

export interface EventLike {
  id: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  recurrence: Recurrence;
  recurrence_until: string | null;
}

export interface Occurrence<E extends EventLike = EventLike> {
  event: E;
  start: Date;
  end: Date | null;
  /** YYYY-MM-DD of this occurrence's start in the household time zone */
  dateKey: string;
}

/**
 * Expand an event into occurrences that overlap [from, to).
 * Recurrence keeps the same wall-clock time in the household time zone, so a 9:00 weekly
 * event stays at 9:00 across the clocks changing.
 */
export function expandEvent<E extends EventLike>(event: E, from: Date, to: Date, tz = HOUSEHOLD_TZ): Occurrence<E>[] {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const duration = end ? end.getTime() - start.getTime() : 0;
  const out: Occurrence<E>[] = [];
  if (event.recurrence === 'none') {
    const endT = end ? end.getTime() : start.getTime();
    if (start < to && (endT >= from.getTime() || start >= from)) {
      out.push({ event, start, end, dateKey: localDateKey(start, tz) });
    }
    return out;
  }
  const baseKey = localDateKey(start, tz);
  const baseTime = localTime(start, tz);
  const untilKey = event.recurrence_until;
  const fromKey = localDateKey(new Date(from.getTime() - Math.max(duration, 0) - 86400000), tz);
  // Skip ahead cheaply for long-running daily/weekly series.
  let n = 0;
  if (event.recurrence === 'daily' || event.recurrence === 'weekly') {
    const days = Math.floor((Date.parse(fromKey) - Date.parse(baseKey)) / 86400000);
    const per = event.recurrence === 'daily' ? 1 : 7;
    if (days > per) n = Math.floor(days / per) - 1;
  } else if (event.recurrence === 'yearly' || event.recurrence === 'monthly') {
    const months = (Number(fromKey.slice(0, 4)) - Number(baseKey.slice(0, 4))) * 12 +
      Number(fromKey.slice(5, 7)) - Number(baseKey.slice(5, 7));
    const per = event.recurrence === 'monthly' ? 1 : 12;
    if (months > per) n = Math.floor(months / per) - 1;
  }
  for (let guard = 0; guard < 2000; guard++, n++) {
    const key = stepKey(baseKey, event.recurrence, n);
    if (untilKey && key > untilKey) break;
    const occStart = event.all_day ? zonedMidnight(key, tz) : zonedDateTime(key, baseTime, tz);
    if (occStart >= to) break;
    const occEnd = end ? new Date(occStart.getTime() + duration) : null;
    const endT = occEnd ? occEnd.getTime() : occStart.getTime();
    if (endT >= from.getTime() || occStart >= from) out.push({ event, start: occStart, end: occEnd, dateKey: key });
  }
  return out;
}

/** Offset (ms) of a time zone from UTC at a given instant. */
function tzOffset(at: Date, tz: string): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant at which the wall clock in `tz` reads `key` `HH:MM`. */
export function zonedDateTime(key: string, hhmm: string, tz = HOUSEHOLD_TZ): Date {
  const [y, m, d] = key.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffset(new Date(guess), tz);
  t = guess - tzOffset(new Date(t), tz);
  return new Date(t);
}

export function zonedMidnight(key: string, tz = HOUSEHOLD_TZ): Date {
  return zonedDateTime(key, '00:00', tz);
}

const MONTHS: Record<BillSchedule, number> = { monthly: 1, council10: 1, quarterly: 3, half_yearly: 6, yearly: 12, none: 0 };


/** Same day of the month `months` later, clamped to the month's last day. */
function shiftMonths(key: string, months: number, day: number): string {
  const [y, m] = key.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(day, last));
  return first.toISOString().slice(0, 10);
}

/** The payment after `key`, or null for a one-off bill. */
export function nextBillDate(key: string, schedule: BillSchedule, dueDay?: number | null): string | null {
  const step = MONTHS[schedule];
  if (!step) return null;
  const day = dueDay ?? Number(key.slice(8, 10));
  let next = shiftMonths(key, step, day);
  if (schedule === 'council10') {
    // No council tax instalments in February or March.
    while (['02', '03'].includes(next.slice(5, 7))) next = shiftMonths(next, 1, day);
  }
  return next;
}

/** Bill dates from its next due date up to `toKey` (inclusive), at most `max`. */
export function billDates(bill: { next_due: string | null; schedule: BillSchedule; due_day: number | null }, toKey: string, max = 60): string[] {
  const out: string[] = [];
  let d = bill.next_due;
  while (d && d <= toKey && out.length < max) {
    out.push(d);
    d = nextBillDate(d, bill.schedule, bill.due_day);
  }
  return out;
}


export interface FamilyBill { id: string; name: string; icon: string; date: string; method: string }

interface Display {
  data: {
    calendar_events: (EventLike & { title: string; location: string | null })[];
    bills?: { id: string; name: string; icon: string; schedule: BillSchedule; next_due: string | null; due_day: number | null; payment_method: string }[];
  };
}

let memo: { at: number; value: Display } | null = null;

async function display(): Promise<Display | null> {
  const key = process.env.HOMEHUB_DISPLAY_KEY;
  if (!key) return null;
  if (memo && Date.now() - memo.at < 2 * 60_000) return memo.value;
  const base = (process.env.HOMEHUB_URL || 'https://homehub-five-azure.vercel.app').replace(/\/$/, '');
  const res = await fetch(`${base}/api/display?k=${encodeURIComponent(key)}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HomeHub answered ${res.status}`);
  memo = { at: Date.now(), value: await res.json() };
  return memo.value;
}

export async function familyEvents(from: Date, to: Date): Promise<CalEvent[] | null> {
  const d = await display();
  if (!d) return null;
  return d.data.calendar_events.flatMap((e) => expandEvent(e, from, to).map((o) => {
    const endKey = o.end ? localDateKey(new Date(o.end.getTime() - 1)) : null;
    return {
      id: `homehub:${e.id}:${o.dateKey}`,
      title: e.title,
      start: e.all_day ? o.dateKey : o.start.toISOString(),
      end: e.all_day ? (endKey && endKey > o.dateKey ? addDaysKey(endKey, 1) : addDaysKey(o.dateKey, 1)) : o.end?.toISOString() ?? null,
      allDay: e.all_day,
      location: e.location ?? null,
      source: 'homehub',
    };
  }));
}

export async function familyBills(fromKey: string, toKey: string): Promise<FamilyBill[] | null> {
  const d = await display();
  if (!d) return null;
  return (d.data.bills ?? []).flatMap((b) => billDates(b, toKey)
    .filter((date) => date >= fromKey)
    .map((date) => ({ id: b.id, name: b.name, icon: b.icon, date, method: b.payment_method })));
}

