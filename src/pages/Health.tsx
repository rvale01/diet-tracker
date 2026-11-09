import { useMemo, useState } from 'react';
import { fmtDur, Quests, TrainingTimer } from '../components/Diet';
import { Card, PageHead } from '../components/ui';
import WeightChart from '../components/WeightChart';
import { fmtDay, fmtTime, keyOf, todayKey } from '../lib/dates';
import {
  ACTS, clampDay, dateOfDay, dayNumOf, maxScore, phraseFor, scoreOf, streak, todayNum, TOTAL_DAYS, trainedInWeek, weekOf, weekRange, WEEKLY_TRAINING,
} from '../lib/diet';
import { useStore } from '../lib/store';

function WeightCard() {
  const { data, put } = useStore();
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(todayKey());
  const weights = Object.values(data.weights);
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0], last = sorted[sorted.length - 1];
  const diff = first && last && first !== last ? Math.round((last.kg - first.kg) * 10) / 10 : null;
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(kg.replace(',', '.'));
    if (!v || v < 20 || v > 400) return;
    put('weights', date, { date, kg: Math.round(v * 10) / 10 });
    setKg('');
  };
  return (
    <Card title="Weight" action={diff !== null && <span className={`chip ${diff < 0 ? 'green' : diff > 0 ? 'orange' : ''}`}>{diff > 0 ? '+' : ''}{diff} kg since {fmtDay(first.date, { day: 'numeric', month: 'short' })}</span>}>
      <div className="stack">
        <WeightChart weights={weights} />
        <form className="row" onSubmit={add}>
          <input type="number" step="0.1" inputMode="decimal" placeholder="kg" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Weight in kg" />
          <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <button className="btn primary" disabled={!kg}>Log</button>
        </form>
        {sorted.length > 0 && (
          <details>
            <summary className="small muted" style={{ cursor: 'pointer' }}>All weigh-ins ({sorted.length})</summary>
            <div className="list">
              {[...sorted].reverse().map((w) => (
                <div className="list-row" key={w.date}>
                  <span className="grow">{fmtDay(w.date)}</span><b className="num">{w.kg} kg</b>
                  <button className="icon-btn" onClick={() => put('weights', w.date, null)} aria-label="Delete weigh-in">✕</button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
}

export default function HealthPage() {
  const { data, put } = useStore();
  const t = todayNum();
  const [selected, setSelected] = useState(clampDay(t));
  const locked = t < 1;
  const done = Math.min(Math.max(t, 0), TOTAL_DAYS);
  const phrase = phraseFor(t > TOTAL_DAYS ? TOTAL_DAYS : t);
  const w = weekOf(Math.min(Math.max(selected <= t ? selected : t, 1), TOTAL_DAYS));
  const [a, b] = weekRange(w);
  const tw = trainedInWeek(data.dietDays, w);
  const sessions = Object.values(data.sessions);
  const weekMs = sessions.filter((s) => { const n = dayNumOf(keyOf(new Date(s.start))); return n >= a && n <= b; }).reduce((x, s) => x + s.end - s.start, 0);
  const totalMs = sessions.reduce((x, s) => x + s.end - s.start, 0);
  const daySessions = sessions.filter((s) => keyOf(new Date(s.start)) === dateOfDay(selected)).sort((x, y) => x.start - y.start);
  const perfect = useMemo(() => Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).filter((n) => scoreOf(data.dietDays[dateOfDay(n)], n) === maxScore(n)).length, [data.dietDays]);

  return (
    <>
      <PageHead title="Health" sub="Round 3 · The Winter Arc · 9 Nov → 7 Dec" />
      <Card className="diet-hero">
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="diet-day">{t < 1 ? `T−${1 - t}` : t > TOTAL_DAYS ? 'DONE' : `DAY ${t}`}</div>
            <div className="muted bold">{t < 1 ? 'days to go' : `of ${TOTAL_DAYS}`}</div>
          </div>
          <div style={{ fontSize: '2rem' }}>{phrase.emoji}</div>
        </div>
        <p className="phrase" style={{ margin: '0.9rem 0' }}>{phrase.text}</p>
        <div className="between small muted" style={{ marginBottom: '0.4rem' }}><span>Progress</span><span>{Math.round((done / TOTAL_DAYS) * 100)}%</span></div>
        <div className="bar-outer"><div className="bar-inner" style={{ width: `${(done / TOTAL_DAYS) * 100}%` }} /></div>
      </Card>

      <Card title="The journey" action={<span className="tiny faint">Tap a day to edit</span>}>
        <div className="day-grid">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((n) => {
            const s = scoreOf(data.dietDays[dateOfDay(n)], n);
            const cls = n > t ? 'future' : s === maxScore(n) ? 'perfect' : s > 0 ? 'partial' : n < t ? 'missed' : 'empty';
            return (
              <button key={n} className={`day-dot ${cls} ${n === t ? 'today' : ''} ${n === selected ? 'selected' : ''}`} disabled={n > t}
                onClick={() => setSelected(n)} title={fmtDay(dateOfDay(n))}>{n === TOTAL_DAYS ? '🏆' : n}</button>
            );
          })}
        </div>
      </Card>

      <Card title={selected === t ? 'Today’s quests' : `Day ${selected} quests`}>
        {locked && <div className="info-banner small" style={{ marginBottom: '0.8rem' }}>🔒 Quests unlock on Monday 9 Nov.</div>}
        <Quests n={selected} locked={locked} />
      </Card>

      <div className="grid-2">
        <Card title="Training timer"><TrainingTimer />
          {daySessions.length > 0 && (
            <div className="list" style={{ marginTop: '0.8rem' }}>
              {daySessions.map((s) => (
                <div className="list-row" key={s.id}>
                  <span className="grow">{ACTS[s.act] ?? s.act}</span><span className="muted small">{fmtTime(s.start)}</span>
                  <b style={{ color: 'var(--pink)' }}>{fmtDur(s.end - s.start)}</b>
                  <button className="icon-btn" onClick={() => confirm('Delete this session?') && put('sessions', s.id, null)} aria-label="Delete session">✕</button>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={w === 5 ? 'Finish line' : `Week ${w}`} action={<b style={{ color: 'var(--pink)' }}>{fmtDur(weekMs)}</b>}>
          <div className="row"><span className="bold" style={{ width: '4.5rem' }}>🏋️ Gym</span>
            <div className="pips">{Array.from({ length: Math.max(WEEKLY_TRAINING, tw.trained) }, (_, i) => <i key={i} className={`pip ${i < tw.trained ? 'on' : ''} ${i >= WEEKLY_TRAINING ? 'bonus' : ''}`} />)}</div>
            <span className="muted">{tw.trained}/{WEEKLY_TRAINING}</span>
          </div>
          <div className="small muted" style={{ marginTop: '0.5rem' }}>{tw.trained ? `🏋️ ${tw.gym} gym · 🥋 ${tw.karate} karate` : 'Karate counts as a gym session 🥋'}</div>
          <div className="small muted" style={{ marginTop: '0.6rem', fontStyle: 'italic' }}>
            {w === 5 ? 'Last day. Make it count. 🏁' : tw.trained >= 5 ? 'Beast week. Make sure you take a rest day. 🛌' : tw.trained >= WEEKLY_TRAINING ? 'Weekly goal smashed ✅' : `${WEEKLY_TRAINING - tw.trained} session${WEEKLY_TRAINING - tw.trained === 1 ? '' : 's'} left this week.`}
          </div>
        </Card>
      </div>

      <Card>
        <div className="stats">
          <div><div className="stat-num">{streak(data.dietDays, 'sugar')}</div><div className="stat-label">🚫🍬 Sugar-free streak</div></div>
          <div><div className="stat-num">{streak(data.dietDays, 'gluten')}</div><div className="stat-label">🚫🍞 Gluten-free streak</div></div>
          <div><div className="stat-num">{perfect}</div><div className="stat-label">⭐ Perfect days</div></div>
          <div><div className="stat-num">{Math.max(TOTAL_DAYS - Math.max(t, 0), 0)}</div><div className="stat-label">⏳ Days to glory</div></div>
          <div><div className="stat-num">{(totalMs / 3600000).toFixed(1)}h</div><div className="stat-label">⏱️ Total training</div></div>
          <div><div className="stat-num">{(() => { const v = Object.values(data.dietDays).filter((d) => (d.water ?? 0) > 0); return v.length ? (v.reduce((x, d) => x + (d.water ?? 0), 0) / v.length * 0.25).toFixed(1) : '–'; })()}</div><div className="stat-label">💧 Avg water (L)</div></div>
        </div>
      </Card>

      <WeightCard />
      <p className="tiny faint" style={{ textAlign: 'center' }}><a href="/spring-2026/">🌸 Spring 2026 archive</a></p>
    </>
  );
}
