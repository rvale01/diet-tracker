export interface CalendarFeed { id: string; name: string; url: string; color: string; enabled: boolean }
export interface TflStop { id: string; name: string; modes: string[] }

export interface Settings {
  name?: string;
  weather?: { name: string; lat: number; lon: number };
  tfl?: { lines: string[]; stops: TflStop[] };
  calendars?: CalendarFeed[];
  budget?: { monthly: number; categories: string[]; includeBills: boolean };
  diet?: { measures?: Record<string, number> };
  board?: { nightFrom: number; nightTo: number };
}

export interface DietDay { sugar?: boolean; gluten?: boolean; protein?: boolean; water?: number; sleep?: number; gym?: boolean; karate?: boolean; rest?: boolean }
export interface Session { id: string; act: string; start: number; end: number }
export interface Timer { act: string; start: number | null }
export interface Weight { date: string; kg: number }

export type BillFrequency = 'monthly' | 'quarterly' | 'yearly';
export interface Bill {
  id: string; name: string; icon: string;
  /** e.g. London, Bristol, Credit cards */
  group?: string;
  /** Usual amount, if it is fixed. Variable bills leave it empty and the amount is entered when ticking. */
  amount: number | null;
  /** Day of the month it is due, or null for "any time this month". */
  dueDay: number | null;
  frequency: BillFrequency; startMonth: number; method: 'dd' | 'manual'; active: boolean; createdAt: number; order?: number;
}
/** One per bill per month (id "billId:YYYY-MM"), so ticks reset every month by themselves. */
export interface BillPayment { paidAt: number; amount: number }
export interface Todo { id: string; text: string; done: boolean; createdAt: number; doneAt?: number; due?: string | null }
export interface Expense { id: string; date: string; amount: number; category: string; note: string }

export interface Data {
  settings: { main?: Settings };
  meta: { timer?: Timer; migratedDiet?: { at: number }; billsSeeded?: { at: number } } & Record<string, unknown>;
  dietDays: Record<string, DietDay>;
  sessions: Record<string, Session>;
  weights: Record<string, Weight>;
  bills: Record<string, Bill>;
  billPayments: Record<string, BillPayment>;
  todos: Record<string, Todo>;
  expenses: Record<string, Expense>;
}
export type Collection = keyof Data;

export interface CalEvent {
  id: string; title: string; start: string; end: string | null; allDay: boolean; location: string | null; source: string;
}
export interface FamilyBill { id: string; name: string; icon: string; date: string; method: string }
