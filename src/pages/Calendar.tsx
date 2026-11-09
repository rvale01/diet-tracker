import { useState } from 'react';
import { Link } from 'react-router-dom';
import Agenda from '../components/Agenda';
import { Card, PageHead } from '../components/ui';
import { rangeDays, useAgenda, useSources } from '../lib/agenda';
import { clearCalendarCache, monthGridStart } from '../lib/calendar';
import { addDays, fmtDay, parseKey, todayKey } from '../lib/dates';
import { useStore } from '../lib/store';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const { settings } = useStore();
  const t = todayKey();
  const [ym, setYm] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });
  const [sel, setSel] = useState(t);
  const [bump, setBump] = useState(0);
  const start = monthGridStart(ym.y, ym.m);
  const days = rangeDays(start, 42);
  const { byDay, errors, loading } = useAgenda(start, days[41], 5 * 60_000, bump);
  const sources = useSources();
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m - 1 + n, 1); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });
  const feeds = settings.calendars ?? [];
  const upcoming = rangeDays(t, 14);
  const { byDay: upByDay } = useAgenda(t, addDays(t, 13));

  return (
    <>
      <PageHead title="Calendar" sub={loading ? 'Updating…' : undefined}
        action={<button className="btn small" onClick={() => { clearCalendarCache(); setBump((b) => b + 1); }}>↻ Refresh</button>} />
      {!feeds.length && <div className="info-banner">Add your Google and iCloud calendars in <Link to="/settings#calendars">Settings</Link> to see them here.</div>}
      {errors.map((e) => <div key={e.source} className="error-banner">⚠️ {sources[e.source]?.name ?? e.source}: {e.error}</div>)}
      <Card>
        <div className="between" style={{ marginBottom: '0.7rem' }}>
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <b>{MONTHS[ym.m - 1]} {ym.y}</b>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
        <div className="cal-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="cal-head">{d}</div>)}
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            const other = parseKey(d).getMonth() + 1 !== ym.m;
            return (
              <button key={d} className={`cal-cell ${other ? 'other' : ''} ${d === t ? 'today' : ''} ${d === sel ? 'sel' : ''}`} onClick={() => setSel(d)}>
                <span className="n">{parseKey(d).getDate()}</span>
                <span className="cal-dots">{items.slice(0, 6).map((it) => <i key={it.key} className="dot" style={{ background: it.color }} />)}</span>
                {items.slice(0, 3).map((it) => <span key={it.key} className="lbl" style={{ background: it.color + '33', color: 'var(--text)' }}>{it.time ? it.time + ' ' : ''}{it.title}</span>)}
                {items.length > 3 && <span className="lbl faint">+{items.length - 3}</span>}
              </button>
            );
          })}
        </div>
        <div className="legend" style={{ marginTop: '0.8rem' }}>
          {Object.entries(sources).map(([id, s]) => <span key={id}><i className="dot" style={{ background: s.color }} />{s.name}</span>)}
        </div>
      </Card>
      <Card title={fmtDay(sel, { weekday: 'long', day: 'numeric', month: 'long' })}>
        <Agenda days={[sel]} byDay={byDay} />
      </Card>
      <Card title="Next 2 weeks">
        <Agenda days={upcoming} byDay={upByDay} showEmptyDays={false} emptyText="Nothing in the next two weeks" />
      </Card>
    </>
  );
}
