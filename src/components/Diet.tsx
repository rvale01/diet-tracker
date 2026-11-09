import { useEffect, useState } from 'react';
import { fmtDay, todayKey, uid } from '../lib/dates';
import {
  ACTS, dateOfDay, glutenFree, maxScore, phraseFor, scoreOf, SLEEP_GOAL, statusText, todayNum, TOTAL_DAYS, WATER_GOAL,
} from '../lib/diet';
import { useStore } from '../lib/store';
import type { DietDay } from '../lib/types';

const EMPTY: DietDay = { water: 0, sleep: 0 };

export function useDietDay(n: number) {
  const { data, put } = useStore();
  const key = dateOfDay(n);
  const d = data.dietDays[key] ?? EMPTY;
  const update = (patch: Partial<DietDay>) => put('dietDays', key, { ...EMPTY, ...data.dietDays[key], ...patch });
  return { d, update, key };
}

export function Quests({ n, locked }: { n: number; locked?: boolean }) {
  const { d, update } = useDietDay(n);
  const grace = !glutenFree(n);
  const s = scoreOf(d, n), max = maxScore(n);
  const toggle = (k: keyof DietDay) => {
    if (locked) return;
    const patch: Partial<DietDay> = { [k]: !d[k] };
    if (k === 'rest' && !d.rest) Object.assign(patch, { gym: false, karate: false });
    if ((k === 'gym' || k === 'karate') && !d[k]) patch.rest = false;
    update(patch);
  };
  const step = (k: 'water' | 'sleep', delta: number) => {
    if (locked) return;
    update({ [k]: Math.min(Math.max(Math.round(((d[k] ?? 0) + delta) * 2) / 2, 0), k === 'water' ? 16 : 12) });
  };
  const Q = ({ k, ico, title, sub, train }: { k: keyof DietDay; ico: string; title: string; sub: string; train?: boolean }) => (
    <button className={`quest ${train ? 'train' : ''} ${d[k] ? 'on' : ''}`} onClick={() => toggle(k)} aria-pressed={!!d[k]}>
      <span className="q-ico">{ico}</span><span className="q-txt">{title}<small>{sub}</small></span><span className="check" />
    </button>
  );
  const water = d.water ?? 0, sleep = d.sleep ?? 0;
  return (
    <div className="stack" style={locked ? { opacity: .45, pointerEvents: 'none' } : undefined}>
      <div className="between">
        <div className="small muted">Day {n} · {fmtDay(dateOfDay(n))}</div>
        <div className={`score ${s === max ? 'perfect' : ''}`}>{s}/{max}</div>
      </div>
      <div className="quests">
        <Q k="sugar" ico="🚫🍬" title="No refined sugar or sweets" sub="Fruit is allowed 🍓" />
        {grace ? (
          <div className="quest grace"><span className="q-ico">🍞</span><span className="q-txt">Gluten allowed this week<small>No-gluten starts Mon 16 Nov</small></span></div>
        ) : <Q k="gluten" ico="🚫🍞" title="No gluten" sub="Bread, pasta, pastries: banished" />}
        <Q k="protein" ico="🥤" title="Protein breakfast" sub="Shake (+ fruit or yogurt)" />
        <div className={`quest ${water >= WATER_GOAL ? 'on' : ''}`}>
          <span className="q-ico">💧</span>
          <span className="q-txt">Water<small>{water} / {WATER_GOAL} glasses · {(water * 0.25).toFixed(2).replace(/0$/, '')} L</small></span>
          <div className="stepper"><button onClick={() => step('water', -1)} aria-label="Less water">−</button><span className="v">{water}</span><button onClick={() => step('water', 1)} aria-label="More water">+</button></div>
        </div>
        <div className={`quest ${sleep >= SLEEP_GOAL ? 'on' : ''}`}>
          <span className="q-ico">😴</span>
          <span className="q-txt">Sleep last night<small>{sleep >= SLEEP_GOAL ? `${sleep}h · goal reached 🌙` : `Goal: ${SLEEP_GOAL}+ hours`}</small></span>
          <div className="stepper"><button onClick={() => step('sleep', -0.5)} aria-label="Less sleep">−</button><span className="v">{sleep}</span><button onClick={() => step('sleep', 0.5)} aria-label="More sleep">+</button></div>
        </div>
        <div className="day-label" style={{ marginTop: '0.4rem' }}>Training</div>
        <Q k="gym" ico="🏋️" title="Gym" sub="Strength focus" train />
        <Q k="karate" ico="🥋" title="Karate" sub="Counts as a gym session · Oss." train />
        <Q k="rest" ico="🛌" title="Rest day" sub="Recovery is training too" train />
      </div>
      <div className="small" style={{ textAlign: 'center', fontStyle: s === max ? 'normal' : 'italic', fontWeight: s === max ? 800 : 400, color: s === max ? 'var(--green)' : 'var(--muted)' }}>
        {statusText(s, max)}
      </div>
    </div>
  );
}

/** Compact tappable version for the Today page and the kitchen board. */
export function MiniQuests() {
  const n = todayNum();
  const { d, update } = useDietDay(Math.min(Math.max(n, 1), TOTAL_DAYS));
  if (n < 1 || n > TOTAL_DAYS) return null;
  const s = scoreOf(d, n), max = maxScore(n);
  const B = ({ k, label }: { k: keyof DietDay; label: string }) => (
    <button className={d[k] ? 'on' : ''} onClick={() => update({ [k]: !d[k] })} aria-pressed={!!d[k]}>{label}</button>
  );
  return (
    <div className="stack" style={{ gap: '0.6rem' }}>
      <div className="between">
        <div><span className="bold">Day {n}</span><span className="muted"> of {TOTAL_DAYS}</span></div>
        <span className={`score ${s === max ? 'perfect' : ''}`} style={{ fontSize: '1.3rem' }}>{s}/{max}</span>
      </div>
      <div className="phrase small muted">{phraseFor(n).emoji} {phraseFor(n).text}</div>
      <div className="mini-quests">
        <B k="sugar" label="🚫🍬 Sugar" />
        {glutenFree(n) && <B k="gluten" label="🚫🍞 Gluten" />}
        <B k="protein" label="🥤 Protein" />
        <button className={(d.water ?? 0) >= WATER_GOAL ? 'on' : ''} onClick={() => update({ water: Math.min((d.water ?? 0) + 1, 16) })}>💧 {d.water ?? 0}/{WATER_GOAL}</button>
        <button className={(d.sleep ?? 0) >= SLEEP_GOAL ? 'on' : ''} onClick={() => update({ sleep: (d.sleep ?? 0) >= 12 ? 0 : (d.sleep ?? 0) + 0.5 })}>😴 {d.sleep ?? 0}h</button>
        <B k="gym" label="🏋️ Gym" />
        <B k="karate" label="🥋 Karate" />
      </div>
    </div>
  );
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((x) => String(x).padStart(2, '0')).join(':');
};
export const fmtDur = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

export function TrainingTimer() {
  const { data, put, putMany } = useStore();
  const timer = data.meta.timer ?? { act: 'gym', start: null };
  const running = !!timer.start;
  const [, tick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const toggle = () => {
    if (!running) { put('meta', 'timer', { act: timer.act, start: Date.now() }); return; }
    const end = Date.now();
    const writes: any[] = [{ col: 'meta', id: 'timer', value: { act: timer.act, start: null } }];
    if (end - timer.start! >= 60_000) {
      const id = uid();
      writes.push({ col: 'sessions', id, value: { id, act: timer.act, start: timer.start, end } });
      const key = todayKey();
      if (timer.act === 'gym' || timer.act === 'karate') {
        writes.push({ col: 'dietDays', id: key, value: { water: 0, sleep: 0, ...data.dietDays[key], [timer.act]: true, rest: false } });
      }
    }
    putMany(writes);
  };

  return (
    <div className="stack">
      <div className="acts">
        {Object.entries(ACTS).map(([k, label]) => (
          <button key={k} className={timer.act === k ? 'on' : ''} disabled={running && timer.act !== k}
            onClick={() => !running && put('meta', 'timer', { act: k, start: null })}>{label}</button>
        ))}
      </div>
      {timer.act === 'kickboxing' && <div className="info-banner small">👃 Only pads, bag and conditioning until the doctor OKs your nose for contact.</div>}
      <div className={`timer ${running ? 'running' : ''}`}>{clock(running ? Date.now() - timer.start! : 0)}</div>
      <button className={`btn ${running ? 'danger' : 'primary'}`} onClick={toggle}>{running ? '■ Stop & save' : '▶ Start'}</button>
    </div>
  );
}
