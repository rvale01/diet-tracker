// The old diet tracker saved everything in this browser (localStorage). On the first sign-in from a
// device that still has that data, copy it to the server once so it shows everywhere.
import type { Data } from './types';

const LEGACY = 'dietChronicles.round3';
type Write = { col: keyof Data; id: string; value: unknown };

export function legacyWrites(data: Data): Write[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(LEGACY); } catch { return []; }
  if (!raw) return [];
  let old: any;
  try { old = JSON.parse(raw); } catch { return []; }
  const writes: Write[] = [];
  for (const [k, v] of Object.entries<any>(old.days ?? {})) {
    if (!data.dietDays[k]) writes.push({ col: 'dietDays', id: k, value: v });
  }
  for (const s of old.sessions ?? []) {
    const id = String(s.id);
    if (!data.sessions[id]) writes.push({ col: 'sessions', id, value: { id, act: s.act, start: s.start, end: s.end } });
  }
  const m = old.measures ?? {};
  if (m.w1 && !data.weights['2026-11-09']) writes.push({ col: 'weights', id: '2026-11-09', value: { date: '2026-11-09', kg: m.w1 } });
  if (m.w2 && !data.weights['2026-12-07']) writes.push({ col: 'weights', id: '2026-12-07', value: { date: '2026-12-07', kg: m.w2 } });
  if (old.timer?.start && !data.meta.timer?.start) writes.push({ col: 'meta', id: 'timer', value: { act: old.timer.act, start: old.timer.start } });
  return writes;
}

export function markMigrated() {
  try { localStorage.setItem(LEGACY + '.migrated', '1'); localStorage.removeItem(LEGACY); } catch { /* ignore */ }
}
