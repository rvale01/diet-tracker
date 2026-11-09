import { useState } from 'react';
import { QuickAdd, sortTodos, TodoRow } from '../components/Todos';
import { Card, PageHead } from '../components/ui';
import { useStore } from '../lib/store';

export default function TodosPage() {
  const { data, put, putMany } = useStore();
  const [showDone, setShowDone] = useState(false);
  const all = sortTodos(Object.values(data.todos));
  const open = all.filter((t) => !t.done);
  const done = all.filter((t) => t.done);
  return (
    <>
      <PageHead title="To-dos" sub={`${open.length} open`} />
      <Card><QuickAdd withDate /></Card>
      <Card title="Open">
        <div className="list">
          {open.map((t) => <TodoRow key={t.id} t={t} onDelete={() => put('todos', t.id, null)} />)}
          {!open.length && <div className="empty">🎉 Nothing to do</div>}
        </div>
      </Card>
      {done.length > 0 && (
        <Card title={`Done (${done.length})`} action={
          <div className="row">
            <button className="link small" style={{ color: 'var(--teal)' }} onClick={() => setShowDone((s) => !s)}>{showDone ? 'Hide' : 'Show'}</button>
            <button className="link small" style={{ color: 'var(--red)' }} onClick={() => confirm('Clear all done to-dos?') && putMany(done.map((t) => ({ col: 'todos', id: t.id, value: null })))}>Clear</button>
          </div>
        }>
          {showDone && <div className="list">{done.map((t) => <TodoRow key={t.id} t={t} onDelete={() => put('todos', t.id, null)} />)}</div>}
        </Card>
      )}
    </>
  );
}
