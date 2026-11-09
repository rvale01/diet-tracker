import { useEffect, useState } from 'react';

export interface Weather {
  current: { temp: number; feels: number; code: number; wind: number; isDay: boolean };
  hourly: { time: string; temp: number; rain: number; code: number }[];
  daily: { date: string; max: number; min: number; rain: number; code: number }[];
  at: number;
}

const CODES: [number[], string, string][] = [
  [[0], '☀️', 'Clear'], [[1], '🌤️', 'Mostly clear'], [[2], '⛅', 'Partly cloudy'], [[3], '☁️', 'Cloudy'],
  [[45, 48], '🌫️', 'Fog'], [[51, 53, 55, 56, 57], '🌦️', 'Drizzle'], [[61, 63, 66, 80, 81], '🌧️', 'Rain'],
  [[65, 67, 82], '🌧️', 'Heavy rain'], [[71, 73, 75, 77, 85, 86], '🌨️', 'Snow'], [[95, 96, 99], '⛈️', 'Thunderstorm'],
];
export function describe(code: number, isDay = true): { icon: string; label: string } {
  const hit = CODES.find(([c]) => c.includes(code));
  if (!hit) return { icon: '🌡️', label: '' };
  const icon = !isDay && code <= 1 ? '🌙' : hit[1];
  return { icon, label: hit[2] };
}

const cache = new Map<string, Weather>();

export function useWeather(loc: { lat: number; lon: number } | undefined) {
  const key = loc ? `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}` : '';
  const [w, setW] = useState<Weather | null>(() => cache.get(key) ?? null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!loc) return;
    let alive = true;
    const load = async () => {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < 15 * 60_000) { setW(hit); return; }
      try {
        const u = new URL('https://api.open-meteo.com/v1/forecast');
        u.search = new URLSearchParams({
          latitude: String(loc.lat), longitude: String(loc.lon), timezone: 'auto', forecast_days: '5',
          current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
          hourly: 'temperature_2m,precipitation_probability,weather_code',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        }).toString();
        const j = await (await fetch(u)).json();
        const nowHour = new Date(); nowHour.setMinutes(0, 0, 0);
        const hourly = (j.hourly.time as string[]).map((t, i) => ({ time: t, temp: j.hourly.temperature_2m[i], rain: j.hourly.precipitation_probability[i] ?? 0, code: j.hourly.weather_code[i] }))
          .filter((h) => new Date(h.time) >= nowHour).slice(0, 12);
        const data: Weather = {
          current: { temp: j.current.temperature_2m, feels: j.current.apparent_temperature, code: j.current.weather_code, wind: j.current.wind_speed_10m, isDay: !!j.current.is_day },
          hourly,
          daily: (j.daily.time as string[]).map((d, i) => ({ date: d, max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], rain: j.daily.precipitation_probability_max[i] ?? 0, code: j.daily.weather_code[i] })),
          at: Date.now(),
        };
        cache.set(key, data);
        if (alive) { setW(data); setError(null); }
      } catch { if (alive) setError('Weather unavailable'); }
    };
    load();
    const t = setInterval(load, 15 * 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { weather: w, error };
}

export async function searchPlaces(q: string) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&name=${encodeURIComponent(q)}`);
  const j = await res.json();
  return ((j.results ?? []) as any[]).map((r) => ({ name: [r.name, r.admin1, r.country_code].filter(Boolean).join(', '), lat: r.latitude as number, lon: r.longitude as number }));
}
