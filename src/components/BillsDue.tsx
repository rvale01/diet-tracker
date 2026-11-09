import { useEffect, useRef, useState } from 'react';
import { groupBills, monthBills, paidTotal, parseMoney, thisMonth, type MonthBill } from '../lib/bills';
import { fmtDay, money, relDay } from '../lib/dates';
import { useStore } from '../lib/store';
import { Check } from './ui';

/** One bill for one month: type what you paid, tick it. Ticks reset every month by themselves. */
export function BillRow({ mb, onEdit }: { mb: MonthBill; onEdit?: () => void }) {
  const { put } = useStore();
  const { bill, paid, auto, state, suggested } = mb;
  const [val, setVal] = useState(paid ? String(paid.amount) : '');
  const [needAmount, setNeedAmount] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { setVal(paid ? String(paid.amount) : ''); }, [paid?.amount, !!paid]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = () => {
    const amount = parseMoney(val) ?? suggested;
    if (amount === null) { setNeedAmount(true); input.current?.focus(); return; }
    setNeedAmount(false);
    put('billPayments', mb.payId, { paidAt: Date.now(), amount });
  };
  const toggle = () => {
    if (paid && !auto) { put('billPayments', mb.payId, null); return; }
    if (!paid) pay();
  };
  const commit = () => {
    if (!paid || auto) return;
    const amount = parseMoney(val);
    if (amount !== null && amount !== paid.amount) put('billPayments', mb.payId, { ...paid, amount });
    else if (amount === null) setVal(String(paid.amount));
  };

  const sub = paid
    ? <span className="chip green">{auto ? 'Paid · auto' : `Paid ${fmtDay(new Date(paid.paidAt).toISOString().slice(0, 10), { day: 'numeric', month: 'short' })}`}</span>
    : needAmount ? <span className="chip orange">Enter the amount</span>
    : state === 'overdue' ? <span className="chip red">Overdue</span>
    : state === 'today' ? <span className="chip orange">Due today</span>
    : bill.dueDay ? <span className={`chip ${state === 'soon' ? 'blue' : ''}`}>Due {relDay(mb.date)}</span>
    : suggested !== null ? <span className="tiny faint">Last: {money(suggested)}</span> : null;

  return (
    <div className="list-row bill-row">
      <Check on={!!paid} onClick={toggle} label={`${paid ? 'Unmark' : 'Mark'} ${bill.name} as paid`} />
      <span className="ico">{bill.icon}</span>
      <button className="grow" style={{ minWidth: 0, textAlign: 'left' }} onClick={onEdit} disabled={!onEdit}>
        <div className={`bold ellipsis ${paid ? 'done-text' : ''}`}>{bill.name}</div>
        <div className="row small muted">{sub}</div>
      </button>
      <label className={`amount-input ${needAmount ? 'need' : ''} ${paid ? 'paid' : ''}`}>
        <span>£</span>
        <input ref={input} inputMode="decimal" value={val} disabled={auto}
          placeholder={suggested !== null ? String(suggested) : '0.00'}
          onChange={(e) => { setVal(e.target.value); setNeedAmount(false); }}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (paid) commit(); else pay(); (e.target as HTMLInputElement).blur(); } }}
          aria-label={`Amount paid for ${bill.name}`} />
      </label>
    </div>
  );
}

/** Compact view for Today and the kitchen board: progress plus what's still to pay. */
export default function BillsSummary({ hideAmount }: { hideAmount?: boolean }) {
  const { data } = useStore();
  const { y, m } = thisMonth();
  const list = monthBills(Object.values(data.bills), data.billPayments, y, m);
  if (!list.length) return <div className="empty">No bills yet. Add them in Money.</div>;
  const paid = list.filter((x) => x.paid).length;
  const unpaid = groupBills(list.filter((x) => !x.paid));
  return (
    <div className="stack" style={{ gap: '0.7rem' }}>
      <div className="between">
        <span><b className="num">{paid}/{list.length}</b> <span className="muted">paid this month</span></span>
        {!hideAmount && <b className="num">{money(paidTotal(list))}</b>}
      </div>
      <div className="bar-outer"><div className="bar-inner" style={{ width: `${(paid / list.length) * 100}%`, background: 'var(--green)' }} /></div>
      {unpaid.length === 0 ? <div className="small" style={{ color: 'var(--green)' }}>✅ All bills paid this month</div> : unpaid.map(([g, items]) => (
        <div key={g} className="small">
          <span className="bold">{g}:</span>{' '}
          <span className="muted">{items.map((x) => `${x.bill.icon} ${x.bill.name}${x.state === 'overdue' ? ' (overdue)' : ''}`).join(' · ')}</span>
        </div>
      ))}
    </div>
  );
}
