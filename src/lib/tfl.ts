import { useEffect, useState } from 'react';
import { api } from './api';
import type { TflStop } from './types';

export interface LineStatus { id: string; name: string; mode: string; severity: number; status: string; reason: string | null }

export const LINE_COLORS: Record<string, string> = {
  bakerloo: '#b36305', central: '#e32017', circle: '#ffd300', district: '#00782a', 'hammersmith-city': '#f3a9bb',
  jubilee: '#a0a5a9', metropolitan: '#9b0056', northern: '#000000', piccadilly: '#003688', victoria: '#0098d4',
  'waterloo-city': '#95cdba', 'elizabeth': '#6950a1', dlr: '#00a4a7', liberty: '#61686b', lioness: '#ffa600',
  mildmay: '#006fe6', suffragette: '#18a95d', weaver: '#9b0058', windrush: '#dc241f', tram: '#5fb526',
};
export const lineColor = (id: string) => LINE_COLORS[id] ?? '#64748b';
export const MODES = 'tube,elizabeth-line,overground,dlr,tram';

export async function fetchStatuses(): Promise<LineStatus[]> {
  const raw = await api<any[]>(`/api/tfl?path=${encodeURIComponent(`/Line/Mode/${MODES}/Status`)}`);
  return raw.map((l) => {
    const worst = [...(l.lineStatuses ?? [])].sort((a, b) => a.statusSeverity - b.statusSeverity)[0];
    return {
      id: l.id, name: l.name, mode: l.modeName,
      severity: worst?.statusSeverity ?? 10,
      status: worst?.statusSeverityDescription ?? 'Good Service',
      reason: worst?.reason ?? null,
    };
  });
}

export interface Arrival { id: string; line: string; lineId: string; towards: string; platform: string; mins: number; mode: string }

export async function fetchArrivals(stopId: string): Promise<Arrival[]> {
  const raw = await api<any[]>(`/api/tfl?path=${encodeURIComponent(`/StopPoint/${stopId}/Arrivals`)}`);
  return raw.map((a) => ({
    id: a.id, line: a.lineName, lineId: a.lineId, mode: a.modeName,
    towards: (a.towards || a.destinationName || '').replace(/ (Underground|Rail|DLR) Station$/, ''),
    platform: a.platformName ?? '', mins: Math.max(0, Math.round(a.timeToStation / 60)),
  })).sort((a, b) => a.mins - b.mins);
}

export async function searchStops(q: string): Promise<TflStop[]> {
  const raw = await api<any>(`/api/tfl?path=${encodeURIComponent(`/StopPoint/Search/${q}`)}&modes=${MODES},bus&maxResults=10`);
  return ((raw.matches ?? []) as any[]).map((m) => ({ id: m.id, name: m.name, modes: m.modes ?? [] }));
}

/** Bus searches return a stop area; arrivals need the individual stops (each direction). */
export async function expandStop(stop: TflStop): Promise<TflStop[]> {
  if (!stop.modes.includes('bus') || stop.modes.some((m) => m !== 'bus')) return [stop];
  try {
    const raw = await api<any>(`/api/tfl?path=${encodeURIComponent(`/StopPoint/${stop.id}`)}`);
    const kids: any[] = [];
    const walk = (n: any) => { if (n.stopType === 'NaptanPublicBusCoachTram') kids.push(n); (n.children ?? []).forEach(walk); };
    walk(raw);
    if (!kids.length) return [stop];
    return kids.map((k) => ({ id: k.naptanId, name: `${stop.name}${k.stopLetter ? ` (${k.stopLetter})` : ''}${k.additionalProperties?.find((p: any) => p.key === 'Towards') ? ' → ' + k.additionalProperties.find((p: any) => p.key === 'Towards').value : ''}`, modes: ['bus'] }));
  } catch { return [stop]; }
}

export function usePoll<T>(fn: () => Promise<T>, ms: number, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const run = () => fn().then((d) => { if (alive) { setData(d); setError(null); } }).catch((e) => alive && setError(e instanceof Error ? e.message : 'Unavailable'));
    run();
    const t = setInterval(() => document.visibilityState === 'visible' && run(), ms);
    return () => { alive = false; clearInterval(t); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error };
}
