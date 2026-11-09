import { useMemo, useState } from 'react';
import { BillRow } from '../components/BillsDue';
import { Card, PageHead, Sheet } from '../components/ui';
import { BILL_ICONS, groupBills, monthBills, OTHER_GROUP, paidTotal, parseMoney } from '../lib/bills';
import { useCalendar } from '../lib/calendar';
import { daysInMonth, fmtDay, money, pad, relDay, todayKey, uid } from '../lib/dates';
import { useStore } from '../lib/store';
import type { Bill, Expense } from '../lib/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DEFAULT_CATEGORIES = ['🛒 Groceries', '🍽️ Eating out', '🚇 Transport', '🛍️ Shopping', '🎉 Fun', '💊 Health', '🎁 Gifts', '📦 Other'];

function useMonth() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m - 1 + n, 1); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });
  const isNow = ym.y === now.getFullYear() && ym.m === now.getMonth() + 1;
  const nav = (
    <div className="row">
      <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
      <b style={{ minWidth: '5.5rem', textAlign: 'center' }}>{MONTHS[ym.m - 1]} {ym.y}</b>
      <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month">›</button>
      {!isNow && <button className="btn small" onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() + 1 })}>Now</button>}
    </div>
  );
  return { ...ym, nav, key: `${ym.y}-${pad(ym.m)}` };
}

function BillEditor({ bill, groups, onClose }: { bill: Bill | null; groups: string[]; onClose: () => void }) {
  const { put } = useStore();
  const [b, setB] = useState<Bill>(bill ?? {
    id: uid(), name: '', icon: '🏠', group: groups[0] ?? 'London', amount: null, dueDay: null, frequency: 'monthly',
    startMonth: new Date().getMonth() + 1, method: 'manual', active: true, createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(), order: 50,
  });
  const [amount, setAmount] = useState(bill?.amount != null ? String(bill.amount) : '');
  const [newGroup, setNewGroup] = useState('');
  const set = (patch: Partial<Bill>) => setB((x) => ({ ...x, ...patch }));
  const save = () => {
    const group = b.group === '__new' ? newGroup.trim() || OTHER_GROUP : b.group;
    put('bills', b.id, { ...b, group, name: b.name.trim(), amount: parseMoney(amount) });
    onClose();
  };
  return (
    <Sheet title={bill ? 'Edit bill' : 'New bill'} onClose={onClose}>
      <div className="icon-pick">{BILL_ICONS.map((i) => <button key={i} className={b.icon === i ? 'on' : ''} onClick={() => set({ icon: i })}>{i}</button>)}</div>
      <div className="field"><label>Name</label><input value={b.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Electricity, Rent" autoFocus={!bill} /></div>
      <div className="form-grid">
        <div className="field"><label>Group</label>
          <select value={b.group ?? OTHER_GROUP} onChange={(e) => set({ group: e.target.value })}>
            {[...new Set([...groups, b.group ?? OTHER_GROUP])].filter((g) => g !== '__new').map((g) => <option key={g}>{g}</option>)}
            <option value="__new">+ New group…</option>
          </select>
        </div>
        {b.group === '__new' ? <div className="field"><label>New group</label><input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="e.g. Subscriptions" /></div> : <div />}
        <div className="field"><label>Usual amount (£)</label><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Varies" /></div>
        <div className="field"><label>Due</label>
          <select value={b.dueDay ?? 0} onChange={(e) => set({ dueDay: Number(e.target.value) || null })}>
            <option value={0}>Any day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}{d === 31 ? ' (last day)' : ''}</option>)}
          </select>
        </div>
        <div className="field"><label>How often</label>
          <select value={b.frequency} onChange={(e) => set({ frequency: e.target.value as Bill['frequency'] })}>
            <option value="monthly">Monthly</option><option value="quarterly">Every 3 months</option><option value="yearly">Yearly</option>
          </select>
        </div>
        {b.frequency !== 'monthly' ? (
          <div className="field"><label>{b.frequency === 'yearly' ? 'Month' : 'Starting month'}</label>
            <select value={b.startMonth} onChange={(e) => set({ startMonth: Number(e.target.value) })}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        ) : <div className="field"><label>Active</label>
          <select value={b.active ? '1' : '0'} onChange={(e) => set({ active: e.target.value === '1' })}><option value="1">Yes</option><option value="0">Paused</option></select>
        </div>}
      </div>
      <p className="tiny faint">Leave the amount empty if it changes every month: you type what you paid when you tick it, and last month’s amount is suggested.</p>
      <div className="row">
        {bill && <button className="btn danger" onClick={() => { if (confirm(`Delete ${bill.name}? Its payment history stays in your budget.`)) { put('bills', bill.id, null); onClose(); } }}>Delete</button>}
        <div className="grow" />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!b.name.trim()} onClick={save}>Save</button>
      </div>
    </Sheet>
  );
}

function BillsTab() {
  const { data } = useStore();
  const { y, m, nav, key } = useMonth();
  const [editing, setEditing] = useState<Bill | null | 'new'>(null);
  const bills = Object.values(data.bills);
  const list = monthBills(bills, data.billPayments, y, m);
  const grouped = groupBills(list);
  const groups = [...new Set(bills.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map((b) => b.group || OTHER_GROUP))];
  const paidCount = list.filter((x) => x.paid).length;
  const total = paidTotal(list);
  const last = `${key}-${pad(daysInMonth(y, m))}`;
  const { data: cal } = useCalendar(`${key}-01`, last, 10 * 60_000);
  const family = (cal?.familyBills ?? []).filter((f) => f.date.startsWith(key));
  const now = new Date();
  const isPast = y * 12 + m < now.getFullYear() * 12 + now.getMonth() + 1;

  return (
    <>
      <Card>
        <div className="between" style={{ marginBottom: '0.9rem' }}>{nav}<button className="btn small primary" onClick={() => setEditing('new')}>+ Bill</button></div>
        <div className="summary">
          <div><div className="n">{paidCount}/{list.length}</div><div className="l">Paid</div></div>
          <div><div className="n" style={{ color: 'var(--green)' }}>{money(total)}</div><div className="l">Paid so far</div></div>
          <div><div className="n" style={{ color: list.length - paidCount ? 'var(--orange)' : undefined }}>{list.length - paidCount}</div><div className="l">{isPast ? 'Missed' : 'To pay'}</div></div>
        </div>
        {list.length > 0 && <div className="bar-outer" style={{ marginTop: '0.9rem' }}><div className="bar-inner" style={{ width: `${(paidCount / list.length) * 100}%`, background: 'var(--green)' }} /></div>}
      </Card>
      {!list.length && <Card><div className="empty">No bills for this month. Tap + Bill to add one.</div></Card>}
      {grouped.map(([g, items]) => (
        <Card key={g} title={g} action={<span className="small muted">{items.filter((x) => x.paid).length}/{items.length} · <b className="num" style={{ color: 'var(--text)' }}>{money(paidTotal(items))}</b></span>}>
          <div className="list">{items.map((mb) => <BillRow key={mb.payId} mb={mb} onEdit={() => setEditing(mb.bill)} />)}</div>
        </Card>
      ))}
      <p className="tiny faint" style={{ textAlign: 'center' }}>Type what you paid and tick it. Ticks reset on the 1st; past months stay in the history. Tap a bill’s name to edit it.</p>
      {cal?.familyBills && family.length > 0 && (
        <Card title="Family bills (HomeHub)">
          <div className="list">
            {family.map((f) => (
              <div className="list-row" key={f.id + f.date}>
                <span className="ico">{f.icon}</span>
                <div className="grow"><div className="bold">{f.name}</div><div className="small muted">{relDay(f.date)}{f.method === 'direct_debit' ? ' · Direct debit' : ''}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {editing && <BillEditor bill={editing === 'new' ? null : editing} groups={groups} onClose={() => setEditing(null)} />}
    </>
  );
}

function BudgetTab() {
  const { data, put, settings, saveSettings } = useStore();
  const { y, m, nav, key } = useMonth();
  const budget = settings.budget ?? { monthly: 0, categories: DEFAULT_CATEGORIES, includeBills: true };
  const cats = budget.categories?.length ? budget.categories : DEFAULT_CATEGORIES;
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState(cats[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayKey());
  const [editBudget, setEditBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(budget.monthly || ''));

  const expenses = useMemo(() => Object.values(data.expenses).filter((e) => e.date.startsWith(key)).sort((a, b) => b.date.localeCompare(a.date)), [data.expenses, key]);
  const billsPaid = monthBills(Object.values(data.bills), data.billPayments, y, m).filter((x) => x.paid).reduce((s, x) => s + (x.paid?.amount ?? 0), 0);
  const spentExp = expenses.reduce((s, e) => s + e.amount, 0);
  const spent = spentExp + (budget.includeBills ? billsPaid : 0);
  const left = budget.monthly - spent;
  const now = new Date();
  const isNow = y === now.getFullYear() && m === now.getMonth() + 1;
  const daysLeft = isNow ? daysInMonth(y, m) - now.getDate() + 1 : 0;
  const byCat = cats.map((c) => ({ c, v: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) }))
    .concat(budget.includeBills && billsPaid ? [{ c: '🧾 Bills', v: billsPaid }] : []).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const maxCat = Math.max(...byCat.map((x) => x.v), 1);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Math.round((parseFloat(amount.replace(',', '.')) || 0) * 100) / 100;
    if (v <= 0) return;
    const id = uid();
    put('expenses', id, { id, date, amount: v, category: cat, note: note.trim() } satisfies Expense);
    setAmount(''); setNote('');
  };

  return (
    <>
      <Card>
        <div className="between" style={{ marginBottom: '0.9rem' }}>{nav}<button className="btn small" onClick={() => { setBudgetInput(String(budget.monthly || '')); setEditBudget(true); }}>Budget: {budget.monthly ? money(budget.monthly) : 'set'}</button></div>
        <div className="summary">
          <div><div className="n">{money(spent)}</div><div className="l">Spent</div></div>
          <div><div className="n" style={{ color: left < 0 ? 'var(--red)' : 'var(--green)' }}>{budget.monthly ? money(left) : '–'}</div><div className="l">{left < 0 ? 'Over' : 'Left'}</div></div>
          <div><div className="n">{budget.monthly && isNow && left > 0 ? money(Math.floor(left / daysLeft)) : '–'}</div><div className="l">Per day</div></div>
        </div>
        {budget.monthly > 0 && (
          <div className="bar-outer" style={{ marginTop: '0.9rem' }}>
            <div className="bar-inner" style={{ width: `${Math.min((spent / budget.monthly) * 100, 100)}%`, background: spent > budget.monthly ? 'var(--red)' : spent > budget.monthly * 0.85 ? 'var(--orange)' : undefined }} />
          </div>
        )}
      </Card>

      <Card title="Add spending">
        <form className="stack" onSubmit={add}>
          <div className="form-grid">
            <input type="number" inputMode="decimal" step="0.01" placeholder="£ amount" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">{cats.map((c) => <option key={c}>{c}</option>)}</select>
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          </div>
          <button className="btn primary" disabled={!amount}>Add</button>
        </form>
      </Card>

      {byCat.length > 0 && (
        <Card title="By category">
          {byCat.map(({ c, v }) => (
            <div className="cat-bar" key={c}>
              <span className="ellipsis">{c}</span>
              <div className="track"><div className="fill" style={{ width: `${(v / maxCat) * 100}%` }} /></div>
              <b className="num">{money(v)}</b>
            </div>
          ))}
        </Card>
      )}

      <Card title={`Spending (${expenses.length})`}>
        {!expenses.length && <div className="empty">Nothing logged for this month.</div>}
        <div className="list">
          {expenses.map((e) => (
            <div className="list-row" key={e.id}>
              <span className="ico">{e.category.split(' ')[0]}</span>
              <div className="grow" style={{ minWidth: 0 }}><div className="bold ellipsis">{e.note || e.category.split(' ').slice(1).join(' ')}</div><div className="small muted">{fmtDay(e.date)}</div></div>
              <b className="num">{money(e.amount)}</b>
              <button className="icon-btn" onClick={() => put('expenses', e.id, null)} aria-label="Delete">✕</button>
            </div>
          ))}
        </div>
      </Card>

      {editBudget && (
        <Sheet title="Monthly budget" onClose={() => setEditBudget(false)}>
          <div className="field"><label>Budget per month (£)</label><input type="number" inputMode="decimal" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} autoFocus /></div>
          <label className="row small"><input type="checkbox" checked={budget.includeBills} onChange={(e) => saveSettings({ budget: { ...budget, categories: cats, includeBills: e.target.checked } })} /> Count paid bills as spending</label>
          <div className="field"><label>Categories (one per line, emoji first)</label>
            <textarea rows={6} defaultValue={cats.join('\n')} id="cats" />
          </div>
          <button className="btn primary" onClick={() => {
            const list = ((document.getElementById('cats') as HTMLTextAreaElement).value).split('\n').map((s) => s.trim()).filter(Boolean);
            saveSettings({ budget: { ...budget, monthly: parseFloat(budgetInput) || 0, categories: list.length ? list : DEFAULT_CATEGORIES } });
            setEditBudget(false);
          }}>Save</button>
        </Sheet>
      )}
    </>
  );
}

export default function MoneyPage() {
  const [tab, setTab] = useState<'bills' | 'budget'>(() => (location.hash === '#budget' ? 'budget' : 'bills'));
  return (
    <>
      <PageHead title="Money" />
      <div className="tabs">
        <button className={tab === 'bills' ? 'on' : ''} onClick={() => setTab('bills')}>🧾 Bills</button>
        <button className={tab === 'budget' ? 'on' : ''} onClick={() => setTab('budget')}>📊 Budget</button>
      </div>
      {tab === 'bills' ? <BillsTab /> : <BudgetTab />}
    </>
  );
}
