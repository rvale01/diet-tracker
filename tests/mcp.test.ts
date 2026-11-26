import { beforeAll, describe, expect, it } from 'vitest';
import { POST } from '../api/mcp';
import { connectorKey } from '../server/auth';
import { localDateKey } from '../server/homehub';
import { readCollection, version } from '../server/store';

// Runs against the in-memory store and the local "dev" password.
let key = '';
beforeAll(async () => { key = (await connectorKey())!; });

let n = 0;
async function rpc(method: string, params?: unknown, path = `/api/mcp/${key}`) {
  const res = await POST(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++n, method, params }),
  }));
  return { status: res.status, body: res.status === 200 ? await res.json() : null };
}
const call = async (name: string, args: Record<string, unknown>) => (await rpc('tools/call', { name, arguments: args })).body.result;

describe('Claude connector', () => {
  it('rejects a wrong key', async () => {
    expect((await rpc('tools/list', undefined, '/api/mcp/nope')).status).toBe(401);
    expect((await rpc('tools/list', undefined, '/api/mcp')).status).toBe(401);
  });

  it('accepts the key as a path, a query or a bearer token', async () => {
    expect((await rpc('ping', undefined, `/api/mcp?key=${key}`)).status).toBe(200);
    const res = await POST(new Request('http://localhost/api/mcp', {
      method: 'POST', headers: { authorization: `Bearer ${key}` }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    }));
    expect(res.status).toBe(200);
  });

  it('initializes and answers notifications with 202', async () => {
    const { body } = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    expect(body.result.protocolVersion).toBe('2025-06-18');
    expect(body.result.capabilities.tools).toBeDefined();
    const res = await POST(new Request(`http://localhost/api/mcp/${key}`, {
      method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    }));
    expect(res.status).toBe(202);
  });

  it('lists the tools with the spending categories', async () => {
    const tools = (await rpc('tools/list')).body.result.tools;
    expect(tools.map((t: { name: string }) => t.name)).toEqual(['add_todo', 'list_todos', 'complete_todo', 'add_expense', 'log_weight']);
    expect(tools[3].inputSchema.properties.category.enum).toContain('🛒 Groceries');
  });

  it('adds, lists and ticks off a to-do', async () => {
    const before = await version();
    const added = await call('add_todo', { text: 'Kookash → Match2Pay', due: 'today' });
    expect(added.isError).toBeUndefined();
    expect(await version()).toBe(before + 1); // the app notices on its next check

    const todos = Object.values(await readCollection<any>('todos'));
    const todo = todos.find((t) => t.text === 'Kookash → Match2Pay');
    expect(todo).toMatchObject({ done: false, due: localDateKey(new Date()) });

    const list = (await call('list_todos', {})).content[0].text;
    expect(list).toContain('Kookash → Match2Pay · due today');
    expect(list).toContain(`id ${todo.id}`);

    expect((await call('complete_todo', { id: todo.id })).content[0].text).toContain('Ticked off');
    expect((await readCollection<any>('todos'))[todo.id].done).toBe(true);
    expect((await call('complete_todo', { id: 'missing' })).isError).toBe(true);
  });

  it('rejects bad dates', async () => {
    expect((await call('add_todo', { text: 'x', due: '2026-02-30' })).isError).toBe(true);
    expect((await call('add_todo', { text: 'x', due: 'next week' })).isError).toBe(true);
  });

  it('logs spending into the closest category', async () => {
    const text = (await call('add_expense', { amount: 12.5, category: 'eating out', note: 'Lunch' })).content[0].text;
    expect(text).toContain('£12.50 under 🍽️ Eating out');
    const fallback = (await call('add_expense', { amount: '3,20', category: 'Pets' })).content[0].text;
    expect(fallback).toContain('📦 Other');
    expect((await call('add_expense', { amount: -1 })).isError).toBe(true);
  });

  it('logs a weigh-in for today', async () => {
    await call('log_weight', { kg: 64.24 });
    expect((await readCollection<any>('weights'))[localDateKey(new Date())]).toEqual({ date: localDateKey(new Date()), kg: 64.2 });
    expect((await call('log_weight', { kg: 64, date: 'tomorrow' })).isError).toBe(true);
  });
});
