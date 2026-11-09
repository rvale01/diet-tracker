import { billsNeedingAttention, type MonthBill } from '../lib/bills';
import { money, relDay } from '../lib/dates';
import { useStore } from '../lib/store';
import { Check } from './ui';

export function BillRow({ mb, onToggle, hideAmount }: { mb: MonthBill; onToggle: () => void; hideAmount?: boolean }) {
  const { bill, state, date } = mb;
  const chip = state === 'paid' ? <span className="chip green">{mb.auto ? 'Paid · auto' : 'Paid'}</span>
    : state === 'overdue' ? <span className="chip red">Overdue</span>
    : state === 'today' ? <span className="chip orange">Today</span>
    : state === 'soon' ? <span className="chip blue">{relDay(date)}</span>
    : <span className="chip">{relDay(date)}</span>;
  return (
    <div className="list-row bill-row">
      <Check on={!!mb.paid} onClick={() => !mb.auto && onToggle()} label={`Mark ${bill.name} as paid`} />
      <span className="ico">{bill.icon}</span>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className={`bold ellipsis ${mb.paid ? 'done-text' : ''}`}>{bill.name}</div>
        <div className="row small muted">{chip}{bill.method === 'dd' && <span className="tiny faint">Direct debit</span>}</div>
      </div>
      {!hideAmount && <div className="amount">{money(bill.amount)}</div>}
    </div>
  );
}

export function useToggleBill() {
  const { put } = useStore();
  return (mb: MonthBill) => put('billPayments', mb.payId, mb.paid ? null : { paidAt: Date.now(), amount: mb.bill.amount });
}

export default function BillsDue({ days = 7, hideAmount }: { days?: number; hideAmount?: boolean }) {
  const { data } = useStore();
  const toggle = useToggleBill();
  const due = billsNeedingAttention(Object.values(data.bills), data.billPayments, days);
  if (!Object.keys(data.bills).length) return <div className="empty">No bills yet. Add them in Money.</div>;
  if (!due.length) return <div className="empty">✅ Nothing due in the next {days} days</div>;
  return <div className="list">{due.map((mb) => <BillRow key={mb.payId} mb={mb} onToggle={() => toggle(mb)} hideAmount={hideAmount} />)}</div>;
}
