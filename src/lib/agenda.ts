// One list of "things on a day": calendar events, personal bills and HomeHub family bills.
import { useMemo } from 'react';
import { dueDate, dueInMonth } from './bills';
import { eventDays, SOURCE_HOMEHUB, useCalendar } from './calendar';
import { addDays, fmtTime, keyOf, parseKey } from './dates';
import { useStore } from './store';
import type { CalEvent } from './types';

export interface AgendaItem {
  key: string; day: string; title: string; time: string | null; sort: string;
  color: string; location: string | null; source: string; kind: 'event' | 'bill' | 'familyBill';
}

export function useSources() {
  const { settings } = useStore();
  return useMemo(() => {
    const map: Record<string, { name: string; color: string }> = { [SOURCE_HOMEHUB.id]: SOURCE_HOMEHUB, bills: { name: 'My bills', color: '#fb923c' } };
    for (const f of settings.calendars ?? []) map[f.id] = { name: f.name, color: f.color };
    return map;
  }, [settings.calendars]);
}

function eventItems(e: CalEvent, color: string): AgendaItem[] {
  return eventDays(e).map((day, i) => {
    const time = e.allDay ? null : i === 0 ? fmtTime(e.start) : null;
    return {
      key: `${e.id}|${day}`, day, title: e.title, time, sort: time ?? '00:00',
      color, location: e.location, source: e.source, kind: 'event',
    };
  });
}

export function useAgenda(from: string, to: string, refreshMs?: number, bump = 0) {
  const { data: cal, loading } = useCalendar(from, to, refreshMs, bump);
  const { data } = useStore();
  const sources = useSources();
  const items = useMemo(() => {
    const out: AgendaItem[] = [];
    for (const e of cal?.events ?? []) out.push(...eventItems(e, sources[e.source]?.color ?? '#64748b'));
    // Personal bills
    const bills = Object.values(data.bills);
    for (let d = parseKey(from); keyOf(d) <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const y = d.getFullYear(), m = d.getMonth() + 1;
      for (const b of bills) {
        if (!dueInMonth(b, y, m)) continue;
        const day = dueDate(b, y, m);
        if (day < from || day > to) continue;
        const paid = !!data.billPayments[`${b.id}:${day.slice(0, 7)}`];
        out.push({ key: `bill:${b.id}:${day}`, day, title: `${b.icon} ${b.name}${paid ? ' ✓' : ''}`, time: null, sort: '00:01', color: '#fb923c', location: null, source: 'bills', kind: 'bill' });
      }
    }
    for (const b of cal?.familyBills ?? []) {
      out.push({ key: `fbill:${b.id}:${b.date}`, day: b.date, title: `${b.icon} ${b.name} (family)`, time: null, sort: '00:02', color: SOURCE_HOMEHUB.color, location: null, source: 'homehub', kind: 'familyBill' });
    }
    return out.sort((a, b) => a.day.localeCompare(b.day) || (a.time === null ? -1 : 0) - (b.time === null ? -1 : 0) || a.sort.localeCompare(b.sort));
  }, [cal, data.bills, data.billPayments, sources, from, to]);

  const byDay = useMemo(() => {
    const m = new Map<string, AgendaItem[]>();
    for (const it of items) { if (!m.has(it.day)) m.set(it.day, []); m.get(it.day)!.push(it); }
    return m;
  }, [items]);

  return { items, byDay, errors: cal?.errors ?? [], loading, loaded: !!cal };
}

export const rangeDays = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));
