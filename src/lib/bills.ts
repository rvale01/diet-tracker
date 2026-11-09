import { daysInMonth, keyOf, monthKey, pad, parseKey, todayKey } from './dates';

const parseKeyTime = (k: string) => parseKey(k).getTime();
import type { Bill, BillPayment } from './types';

export const BILL_ICONS = ['🏠', '⚡', '🔥', '💧', '📱', '🌐', '📺', '🎵', '🏋️', '🚗', '🛡️', '💳', '🏦', '🎓', '🐾', '💡'];

export function dueInMonth(b: Bill, y: number, m: number) {
  if (!b.active) return false;
  const made = new Date(b.createdAt);
  if (y * 12 + m < made.getFullYear() * 12 + made.getMonth() + 1) return false; // nothing before it was added
  if (b.frequency === 'monthly') return true;
  const diff = (m - b.startMonth + 12) % 12;
  return b.frequency === 'quarterly' ? diff % 3 === 0 : diff === 0;
}

export function dueDate(b: Bill, y: number, m: number) {
  return `${y}-${pad(m)}-${pad(Math.min(b.dueDay, daysInMonth(y, m)))}`;
}

export const payKey = (b: Bill, y: number, m: number) => `${b.id}:${y}-${pad(m)}`;

export type BillState = 'paid' | 'overdue' | 'today' | 'soon' | 'later';

export interface MonthBill { bill: Bill; date: string; payId: string; paid: BillPayment | undefined; auto: boolean; state: BillState }

export function monthBills(bills: Bill[], payments: Record<string, BillPayment>, y: number, m: number): MonthBill[] {
  const t = todayKey();
  const soon = keyOf(new Date(Date.now() + 7 * 86400000));
  return bills.filter((b) => dueInMonth(b, y, m)).map((bill) => {
    const date = dueDate(bill, y, m);
    const payId = payKey(bill, y, m);
    // Direct debits are taken automatically, so once the date has passed they count as paid.
    const auto = !payments[payId] && bill.method === 'dd' && date < t;
    const paid = payments[payId] ?? (auto ? { paidAt: parseKeyTime(date), amount: bill.amount } : undefined);
    const state: BillState = paid ? 'paid' : date < t ? 'overdue' : date === t ? 'today' : date <= soon ? 'soon' : 'later';
    return { bill, date, payId, paid, auto, state };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.bill.name.localeCompare(b.bill.name));
}

/** Unpaid bills up to N days ahead, including anything still unpaid from last month. */
export function billsNeedingAttention(bills: Bill[], payments: Record<string, BillPayment>, days = 7): MonthBill[] {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const limit = keyOf(new Date(Date.now() + days * 86400000));
  return [prev, now, next]
    .flatMap((d) => monthBills(bills, payments, d.getFullYear(), d.getMonth() + 1))
    .filter((x) => !x.paid && x.date <= limit);
}

export function monthlyEquivalent(b: Bill) {
  return b.frequency === 'monthly' ? b.amount : b.frequency === 'quarterly' ? b.amount / 3 : b.amount / 12;
}

export const thisMonth = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, key: monthKey(d) }; };
