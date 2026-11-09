import { relDay } from '../lib/dates';
import type { AgendaItem } from '../lib/agenda';

export function EventRow({ it }: { it: AgendaItem }) {
  return (
    <div className="event">
      <div className="time">{it.time ?? (it.kind === 'event' ? 'All day' : 'Due')}</div>
      <div className="bar" style={{ background: it.color }} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="title">{it.title}</div>
        {it.location && <div className="loc ellipsis">📍 {it.location}</div>}
      </div>
    </div>
  );
}

export default function Agenda({ days, byDay, emptyText = 'Nothing planned', showEmptyDays = true }: {
  days: string[]; byDay: Map<string, AgendaItem[]>; emptyText?: string; showEmptyDays?: boolean;
}) {
  const visible = showEmptyDays ? days : days.filter((d) => byDay.get(d)?.length);
  if (!visible.length) return <div className="empty">{emptyText}</div>;
  return (
    <div>
      {visible.map((d) => (
        <div key={d}>
          <div className="day-label">{relDay(d)}</div>
          {byDay.get(d)?.length ? byDay.get(d)!.map((it) => <EventRow key={it.key} it={it} />) : <div className="empty">{emptyText}</div>}
        </div>
      ))}
    </div>
  );
}
