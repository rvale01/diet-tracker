// The Claude connector's tools: add and tick off to-dos, log spending and weigh-ins.
// They write through the same store as the app, so the phone and the board show changes on their next check.
import { DEFAULT_CATEGORIES } from '../src/lib/categories.js';
import type { Expense, Todo, Weight } from '../src/lib/types.js';
import { addDaysKey, localDateKey } from './homehub.js';
import { readCollection, settings, write } from './store.js';

/** A problem to report back to Claude (bad input, unknown id), not a server failure. */
export class ToolError extends Error {}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => localDateKey(new Date()); // UK date, whatever time zone the server runs in

/** "2026-12-01", "today", "tomorrow" or "yesterday" -> YYYY-MM-DD; empty -> null. */
function dayKey(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  const s = String(value).trim().toLowerCase();
  if (s === 'today') return today();
  if (s === 'tomorrow') return addDaysKey(today(), 1);
  if (s === 'yesterday') return addDaysKey(today(), -1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) && addDaysKey(s, 0) === s) return s; // also rejects 2026-02-30
  throw new ToolError(`${field} must be a date like 2026-12-01, or "today" / "tomorrow".`);
}

const label = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
};
function rel(key: string): string {
  const t = today();
  if (key === t) return `today (${label(key)})`;
  if (key === addDaysKey(t, 1)) return `tomorrow (${label(key)})`;
  if (key === addDaysKey(t, -1)) return `yesterday (${label(key)})`;
  return label(key);
}

async function categories(): Promise<string[]> {
  const list = (await settings()).budget?.categories;
  return Array.isArray(list) && list.length ? list : DEFAULT_CATEGORIES;
}

/** "groceries", "Groceries" or "🛒 Groceries" all find "🛒 Groceries". Falls back to Other. */
function matchCategory(given: unknown, list: string[]): { category: string; matched: boolean } {
  const plain = (s: string) => s.replace(/[^\p{L}\p{N} ]/gu, '').trim().toLowerCase();
  const g = typeof given === 'string' ? plain(given) : '';
  if (g) {
    const hit = list.find((c) => plain(c) === g) ?? list.find((c) => plain(c) && (plain(c).includes(g) || g.includes(plain(c))));
    if (hit) return { category: hit, matched: true };
  }
  return { category: list.find((c) => plain(c) === 'other') ?? list[list.length - 1], matched: !g };
}

const writeHints = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

export async function listTools() {
  const cats = await categories();
  return [
    {
      name: 'add_todo',
      title: 'Add a to-do',
      description: 'Add a to-do to the dashboard. One call per item. Dates are UK (Europe/London) dates.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The to-do, short, in the user\'s words.' },
          due: { type: 'string', description: 'Optional due date: YYYY-MM-DD, "today" or "tomorrow". Leave out for no date.' },
        },
        required: ['text'],
      },
      annotations: writeHints,
    },
    {
      name: 'list_todos',
      title: 'List to-dos',
      description: 'List open to-dos with their ids and due dates (and recently done ones if asked). Also gives today\'s UK date.',
      inputSchema: {
        type: 'object',
        properties: { include_done: { type: 'boolean', description: 'Also list the 20 most recently done to-dos.' } },
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    {
      name: 'complete_todo',
      title: 'Tick off a to-do',
      description: 'Mark a to-do as done. Get its id from list_todos first.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'The to-do\'s id from list_todos.' } }, required: ['id'] },
      annotations: { ...writeHints, idempotentHint: true },
    },
    {
      name: 'add_expense',
      title: 'Log spending',
      description: 'Log money spent, in pounds, on the Money page.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in £, e.g. 12.5' },
          category: { type: 'string', enum: cats, description: 'Spending category.' },
          note: { type: 'string', description: 'Optional short note, e.g. the shop.' },
          date: { type: 'string', description: 'YYYY-MM-DD, "today" or "yesterday". Defaults to today.' },
        },
        required: ['amount'],
      },
      annotations: writeHints,
    },
    {
      name: 'log_weight',
      title: 'Log a weigh-in',
      description: 'Log body weight in kg on the Health page. Replaces any weigh-in already logged for that day.',
      inputSchema: {
        type: 'object',
        properties: {
          kg: { type: 'number', description: 'Weight in kg, e.g. 64.2' },
          date: { type: 'string', description: 'YYYY-MM-DD, "today" or "yesterday". Defaults to today.' },
        },
        required: ['kg'],
      },
      annotations: { ...writeHints, idempotentHint: true },
    },
  ];
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'add_todo': {
      const text = String(args.text ?? '').trim();
      if (!text) throw new ToolError('The to-do text is empty.');
      if (text.length > 500) throw new ToolError('The to-do is too long (500 characters at most).');
      const due = dayKey(args.due, 'due');
      const id = uid();
      await write([{ col: 'todos', id, value: { id, text, done: false, createdAt: Date.now(), due } satisfies Todo }]);
      return `Added to-do "${text}"${due ? `, due ${rel(due)}` : ''}. (id ${id})`;
    }
    case 'list_todos': {
      const all = Object.values(await readCollection<Todo>('todos'));
      const t = today();
      const open = all.filter((x) => !x.done)
        .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.createdAt - b.createdAt);
      const lines = [`Today is ${label(t)} (${t}).`, '', `Open to-dos (${open.length}):`];
      for (const x of open) {
        const when = x.due ? (x.due < t ? ` · overdue, was due ${label(x.due)}` : ` · due ${rel(x.due)}`) : '';
        lines.push(`- ${x.text}${when} · id ${x.id}`);
      }
      if (!open.length) lines.push('(none)');
      if (args.include_done) {
        const done = all.filter((x) => x.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 20);
        lines.push('', `Recently done (${done.length}):`, ...done.map((x) => `- ${x.text} · id ${x.id}`));
      }
      return lines.join('\n');
    }
    case 'complete_todo': {
      const id = String(args.id ?? '').trim();
      const todo = (await readCollection<Todo>('todos'))[id];
      if (!todo) throw new ToolError(`No to-do with id "${id}". Call list_todos to see the ids.`);
      if (todo.done) return `"${todo.text}" was already done.`;
      await write([{ col: 'todos', id, value: { ...todo, done: true, doneAt: Date.now() } satisfies Todo }]);
      return `Ticked off "${todo.text}".`;
    }
    case 'add_expense': {
      const raw = typeof args.amount === 'number' ? args.amount : parseFloat(String(args.amount ?? '').replace('£', '').replace(',', '.'));
      const amount = Math.round(raw * 100) / 100;
      if (!(amount > 0) || amount > 1_000_000) throw new ToolError('The amount must be a positive number of pounds.');
      const { category, matched } = matchCategory(args.category, await categories());
      const note = String(args.note ?? '').trim().slice(0, 200);
      const date = dayKey(args.date, 'date') ?? today();
      const id = uid();
      await write([{ col: 'expenses', id, value: { id, date, amount, category, note } satisfies Expense }]);
      return `Logged £${amount.toFixed(2)} under ${category}${matched ? '' : ` (no "${String(args.category)}" category)`}${note ? `, "${note}"` : ''}, ${rel(date)}.`;
    }
    case 'log_weight': {
      const kg = typeof args.kg === 'number' ? args.kg : parseFloat(String(args.kg ?? '').replace(',', '.'));
      if (!(kg >= 20 && kg <= 400)) throw new ToolError('The weight must be in kg, between 20 and 400.');
      const date = dayKey(args.date, 'date') ?? today();
      if (date > today()) throw new ToolError('A weigh-in can\'t be in the future.');
      const value: Weight = { date, kg: Math.round(kg * 10) / 10 };
      await write([{ col: 'weights', id: date, value }]);
      return `Logged ${value.kg} kg for ${rel(date)}.`;
    }
    default:
      throw new ToolError(`Unknown tool: ${name}`);
  }
}
