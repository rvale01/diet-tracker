import { useState } from 'react';
import { relDay, todayKey, uid } from '../lib/dates';
import { useStore } from '../lib/store';
import type { Todo } from '../lib/types';
import { Check } from './ui';

export function sortTodos(list: Todo[]) {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done) return (b.doneAt ?? 0) - (a.doneAt ?? 0);
    const ad = a.due ?? '9999', bd = b.due ?? '9999';
    return ad.localeCompare(bd) || a.createdAt - b.createdAt;
  });
}

export function TodoRow({ t, onDelete }: { t: Todo; onDelete?: () => void }) {
  const { put } = useStore();
  const overdue = !t.done && t.due && t.due < todayKey();
  return (
    <div className="list-row">
      <Check round on={t.done} label={`Done: ${t.text}`} onClick={() => put('todos', t.id, { ...t, done: !t.done, doneAt: t.done ? undefined : Date.now() })} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className={t.done ? 'done-text' : ''}>{t.text}</div>
        {t.due && !t.done && <div className={`tiny ${overdue ? '' : 'muted'}`} style={overdue ? { color: 'var(--red)' } : undefined}>📅 {relDay(t.due)}</div>}
      </div>
      {onDelete && <button className="icon-btn" onClick={onDelete} aria-label="Delete">✕</button>}
    </div>
  );
}

export function QuickAdd({ placeholder = 'Add a to-do…', withDate }: { placeholder?: string; withDate?: boolean }) {
  const { put } = useStore();
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v) return;
    const id = uid();
    put('todos', id, { id, text: v, done: false, createdAt: Date.now(), due: due || null });
    setText(''); setDue('');
  };
  return (
    <form className="row" onSubmit={(e) => { e.preventDefault(); add(); }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label="New to-do" />
      {withDate && <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ width: '9.5rem' }} aria-label="Due date" />}
      <button className="btn primary" type="submit" disabled={!text.trim()}>Add</button>
    </form>
  );
}

export default function TodoPreview({ limit = 5 }: { limit?: number }) {
  const { data } = useStore();
  const open = sortTodos(Object.values(data.todos).filter((t) => !t.done));
  return (
    <div className="stack" style={{ gap: '0.4rem' }}>
      <div className="list">
        {open.slice(0, limit).map((t) => <TodoRow key={t.id} t={t} />)}
        {!open.length && <div className="empty">🎉 All done</div>}
      </div>
      {open.length > limit && <div className="small muted">+ {open.length - limit} more</div>}
      <QuickAdd />
    </div>
  );
}
