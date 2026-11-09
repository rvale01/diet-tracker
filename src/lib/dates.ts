export const pad = (n: number) => String(n).padStart(2, '0');
export const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => keyOf(new Date());
export const parseKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k: string, n: number) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate(); // m is 1-12
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const fmtDay = (k: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  parseKey(k).toLocaleDateString('en-GB', opts);
export const fmtTime = (iso: string | number | Date) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
export const money = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export function relDay(k: string): string {
  const t = todayKey();
  if (k === t) return 'Today';
  if (k === addDays(t, 1)) return 'Tomorrow';
  if (k === addDays(t, -1)) return 'Yesterday';
  return fmtDay(k);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
