import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { byFavourite, fetchArrivals, fetchStatuses, FAVOURITE_LINES, lineColor, usePoll, type Arrival } from '../lib/tfl';
import { Card } from './ui';

function StopArrivals({ id, name, limit }: { id: string; name: string; limit: number }) {
  const { data, error } = usePoll(() => fetchArrivals(id), 30_000, [id]);
  // Next few per line + direction
  const groups = new Map<string, Arrival[]>();
  for (const a of data ?? []) {
    const k = `${a.lineId}|${a.platform || a.towards}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(a);
  }
  const rows = [...groups.values()].sort((a, b) => a[0].mins - b[0].mins).slice(0, limit);
  return (
    <div style={{ marginTop: '0.7rem' }}>
      <div className="bold small">{name}</div>
      {error && <div className="empty">{error}</div>}
      {data && !rows.length && <div className="empty">No departures right now</div>}
      {rows.map((g) => (
        <div className="arr" key={g[0].lineId + g[0].platform + g[0].towards}>
          <div className="row" style={{ minWidth: 0 }}>
            <span className="dot" style={{ background: lineColor(g[0].lineId) }} />
            <span className="ellipsis">{g[0].mode === 'bus' ? <b>{g[0].line} </b> : null}{g[0].towards || g[0].platform}</span>
          </div>
          <div className="mins">{g.slice(0, 3).map((a) => (a.mins === 0 ? 'due' : a.mins)).join(', ')}{g[0].mins ? <span className="faint small"> min</span> : null}</div>
        </div>
      ))}
    </div>
  );
}

export default function TflCard({ compact }: { compact?: boolean }) {
  const { settings } = useStore();
  const chosen = settings.tfl?.lines?.length ? settings.tfl.lines : FAVOURITE_LINES;
  const stops = settings.tfl?.stops ?? [];
  const { data, error } = usePoll(fetchStatuses, 120_000, []);
  const lines = data ?? [];
  const mine = byFavourite(lines.filter((l) => chosen.includes(l.id)));
  const problems = lines.filter((l) => l.severity < 10 && !chosen.includes(l.id));
  const shown = [...mine, ...(compact ? [] : problems)];
  const hiddenProblems = problems.filter((l) => !shown.includes(l)).map((l) => l.name);
  const goodOthers = lines.filter((l) => !shown.includes(l) && l.severity >= 10).length;

  return (
    <Card title="TfL" action={<Link to="/settings#tfl">Edit →</Link>}>
      {error && <div className="empty">{error}</div>}
      {!data && !error && <div className="empty">Loading…</div>}
      {shown.map((l) => (
        <div className="line-row" key={l.id} title={l.reason ?? ''}>
          <span className="line-badge" style={{ background: lineColor(l.id) }} />
          <span className="grow bold">{l.name}</span>
          <span className={`line-status ${l.severity >= 10 ? 'good' : l.severity <= 5 ? 'severe' : 'bad'}`}>{l.status}</span>
        </div>
      ))}
      {data && hiddenProblems.length > 0 && (
        <div className="small" style={{ paddingTop: '0.3rem', color: 'var(--orange)' }}>⚠️ Problems on {hiddenProblems.join(', ')}</div>
      )}
      {data && goodOthers > 0 && (
        <div className="small muted" style={{ paddingTop: '0.3rem' }}>✅ Good service on {problems.length ? 'the other' : 'all other'} {goodOthers} lines</div>
      )}
      {stops.slice(0, compact ? 2 : 6).map((s) => <StopArrivals key={s.id} id={s.id} name={s.name} limit={compact ? 3 : 6} />)}
    </Card>
  );
}
