import { daysInMonth, keyOf, monthKey, pad, parseKey, todayKey } from './dates';
import type { Bill, BillPayment } from './types';

export const BILL_ICONS = ['🏠', '⚡', '🔥', '💧', '🚿', '🏛️', '🏦', '💳', '📱', '🌐', '📺', '🎵', '🏋️', '🚗', '🛡️', '🐾'];
export const OTHER_GROUP = 'Other';

/** Your usual bills, added once on first use. Fixed ids so a Shortcut can tick them later. */
export function starterBills(now = new Date()): Bill[] {
  const createdAt = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const b = (id: string, group: string, name: string, icon: string, order: number): Bill => ({
    id, group, name, icon, order, amount: null, dueDay: null, frequency: 'monthly', startMonth: 1, method: 'manual', active: true, createdAt,
  });
  return [
    b('london-electricity', 'London', 'Electricity', '⚡', 1),
    b('london-water', 'London', 'Water', '💧', 2),
    b('london-communal', 'London', 'Communal / hot water', '🚿', 3),
    b('london-council', 'London', 'Council tax', '🏛️', 4),
    b('london-rent', 'London', 'Rent', '🏠', 5),
    b('bristol-electricity', 'Bristol', 'Electricity', '⚡', 11),
    b('bristol-gas', 'Bristol', 'Gas', '🔥', 12),
    b('bristol-water', 'Bristol', 'Water', '💧', 13),
    b('bristol-mortgage', 'Bristol', 'Mortgage', '🏦', 14),
    b('card-aqua', 'Credit cards', 'Aqua', '💳', 21),
    b('card-capital-one', 'Credit cards', 'Capital One', '💳', 22),
  ];
}

export function dueInMonth(b: Bill, y: number, m: number) {
  if (!b.active) return false;
  const made = new Date(b.createdAt);
  if (y * 12 + m < made.getFullYear() * 12 + made.getMonth() + 1) return false; // nothing before it was added
  if (b.frequency === 'monthly') return true;
  const diff = (m - b.startMonth + 12) % 12;
  return b.frequency === 'quarterly' ? diff % 3 === 0 : diff === 0;
}

/** The due date, or the last day of the month for "any time this month". */
export function dueDate(b: Bill, y: number, m: number) {
  const last = daysInMonth(y, m);
  return `${y}-${pad(m)}-${pad(Math.min(b.dueDay ?? last, last))}`;
}

export const payKey = (b: Bill, y: number, m: number) => `${b.id}:${y}-${pad(m)}`;

/** What was paid last time (looks back up to a year), to pre-fill the amount. */
export function lastAmount(b: Bill, payments: Record<string, BillPayment>, y: number, m: number): number | null {
  for (let i = 1; i <= 12; i++) {
    const d = new Date(y, m - 1 - i, 1);
    const p = payments[payKey(b, d.getFullYear(), d.getMonth() + 1)];
    if (p) return p.amount;
  }
  return b.amount;
}

export type BillState = 'paid' | 'overdue' | 'today' | 'soon' | 'later';

export interface MonthBill {
  bill: Bill; date: string; payId: string; paid: BillPayment | undefined; auto: boolean; state: BillState;
  /** Amount to suggest: last month's, or the usual amount */
  suggested: number | null;
}

export function monthBills(bills: Bill[], payments: Record<string, BillPayment>, y: number, m: number): MonthBill[] {
  const t = todayKey();
  const soon = keyOf(new Date(Date.now() + 7 * 86400000));
  return bills.filter((b) => dueInMonth(b, y, m)).map((bill) => {
    const date = dueDate(bill, y, m);
    const payId = payKey(bill, y, m);
    const suggested = lastAmount(bill, payments, y, m);
    // Direct debits with a fixed amount are taken automatically, so once the date has passed they count as paid.
    const auto = !payments[payId] && bill.method === 'dd' && bill.amount !== null && date < t;
    const paid = payments[payId] ?? (auto ? { paidAt: parseKey(date).getTime(), amount: bill.amount ?? 0 } : undefined);
    const anyTime = bill.dueDay === null;
    const state: BillState = paid ? 'paid' : date < t ? 'overdue' : date === t ? 'today' : !anyTime && date <= soon ? 'soon' : 'later';
    return { bill, date, payId, paid, auto, state, suggested };
  }).sort((a, b) => (a.bill.order ?? 99) - (b.bill.order ?? 99) || a.date.localeCompare(b.date) || a.bill.name.localeCompare(b.bill.name));
}

/** Bills grouped (London, Bristol, Credit cards…) in a stable order. */
export function groupBills(list: MonthBill[]) {
  const groups = new Map<string, MonthBill[]>();
  for (const mb of list) {
    const g = mb.bill.group || OTHER_GROUP;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(mb);
  }
  return [...groups.entries()].sort((a, b) => (a[1][0].bill.order ?? 99) - (b[1][0].bill.order ?? 99));
}

export const paidTotal = (list: MonthBill[]) => list.reduce((s, x) => s + (x.paid?.amount ?? 0), 0);

export function monthlyEquivalent(b: Bill, payments: Record<string, BillPayment>) {
  const now = new Date();
  const amt = lastAmount(b, payments, now.getFullYear(), now.getMonth() + 2) ?? 0; // includes this month
  return b.frequency === 'monthly' ? amt : b.frequency === 'quarterly' ? amt / 3 : amt / 12;
}

export const thisMonth = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, key: monthKey(d) }; };

export const parseMoney = (s: string) => {
  const v = parseFloat(s.replace(/[£,\s]/g, ''));
  return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null;
};
