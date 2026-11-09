import { useEffect, useState } from 'react';
import { api } from './api';
import { addDays, keyOf, parseKey } from './dates';
import type { CalEvent, FamilyBill } from './types';

export interface CalData { events: CalEvent[]; familyBills: FamilyBill[] | null; errors: { source: string; error: string }[] }

const cache = new Map<string, { at: number; data: CalData }>();

export function useCalendar(from: string, to: string, refreshMs = 5 * 60_000, bump = 0) {
  const key = `${from}|${to}`;
  const [data, setData] = useState<CalData | null>(cache.get(key)?.data ?? null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async (force = false) => {
      const hit = cache.get(key);
      if (!force && hit && Date.now() - hit.at < 60_000) { setData(hit.data); return; }
      setLoading(true);
      try {
        const d = await api<CalData>(`/api/calendar?from=${from}&to=${to}`);
        cache.set(key, { at: Date.now(), data: d });
        if (alive) setData(d);
      } catch (e) {
        if (alive) setData((old) => old ?? { events: [], familyBills: null, errors: [{ source: 'all', error: e instanceof Error ? e.message : 'Calendar unavailable' }] });
      } finally { if (alive) setLoading(false); }
    };
    load(bump > 0);
    const t = setInterval(() => load(true), refreshMs);
    return () => { alive = false; clearInterval(t); };
  }, [key, refreshMs, bump]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, loading };
}

export const clearCalendarCache = () => cache.clear();

/** Local date keys an event covers (all-day end is exclusive). */
export function eventDays(e: CalEvent): string[] {
  const startKey = e.allDay ? e.start : keyOf(new Date(e.start));
  let endKey = startKey;
  if (e.end) {
    endKey = e.allDay ? addDays(e.end, -1) : keyOf(new Date(new Date(e.end).getTime() - 1));
    if (endKey < startKey) endKey = startKey;
  }
  const out: string[] = [];
  for (let k = startKey, i = 0; k <= endKey && i < 60; k = addDays(k, 1), i++) out.push(k);
  return out;
}

export function groupByDay(events: CalEvent[]) {
  const map = new Map<string, CalEvent[]>();
  for (const e of events) for (const k of eventDays(e)) {
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  for (const list of map.values()) list.sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
  return map;
}

export const SOURCE_HOMEHUB = { id: 'homehub', name: 'Family (HomeHub)', color: '#2dd4bf' };
export const monthGridStart = (y: number, m: number) => {
  const first = new Date(y, m - 1, 1);
  const shift = (first.getDay() + 6) % 7; // Monday first
  return keyOf(new Date(y, m - 1, 1 - shift));
};
export { parseKey };
