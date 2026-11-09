// Kitchen board: landscape, glanceable, no navigation. Stays awake, refreshes itself, dims at night.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Agenda from '../components/Agenda';
import BillsDue from '../components/BillsDue';
import { MiniQuests } from '../components/Diet';
import TflCard from '../components/Tfl';
import TodoPreview from '../components/Todos';
import WeatherCard from '../components/Weather';
import { Card } from '../components/ui';
import { useAgenda } from '../lib/agenda';
import { addDays, todayKey } from '../lib/dates';
import { dietActive } from '../lib/diet';
import { useStore } from '../lib/store';

export default function BoardPage() {
  const { settings, error } = useStore();
  const [now, setNow] = useState(new Date());
  const t = todayKey();
  const { byDay } = useAgenda(t, addDays(t, 2), 5 * 60_000);
  const night = settings.board ?? { nightFrom: 23, nightTo: 6 };
  const h = now.getHours();
  const isNight = night.nightFrom > night.nightTo ? h >= night.nightFrom || h < night.nightTo : h >= night.nightFrom && h < night.nightTo;

  useEffect(() => {
    document.title = 'Board';
    const tick = setInterval(() => setNow(new Date()), 15_000);
    const reload = setTimeout(() => location.reload(), 6 * 3600_000); // keeps long-running tablets healthy
    let lock: any = null;
    const wake = async () => { try { lock = await (navigator as any).wakeLock?.request('screen'); } catch { /* not supported */ } };
    wake();
    const onVis = () => document.visibilityState === 'visible' && wake();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(tick); clearTimeout(reload); lock?.release?.(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return (
    <div className={`board ${isNight ? 'night' : ''}`}>
      <Link to="/" className="board-exit btn small" aria-label="Back to the app">✕</Link>
      <div className="board-clock">
        <div>
          <div className="time">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="date">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        {error && <div className="error-banner">⚠️ {error}</div>}
      </div>
      <Card title="Coming up"><div className="scroll"><Agenda days={[t, addDays(t, 1), addDays(t, 2)]} byDay={byDay} /></div></Card>
      <WeatherCard big />
      {dietActive() ? <Card title="🥋 Winter Arc" className="diet-hero"><MiniQuests /></Card> : <Card title="To-dos"><div className="scroll"><TodoPreview limit={6} /></div></Card>}
      <Card title="Bills due"><div className="scroll"><BillsDue days={10} hideAmount /></div></Card>
      {dietActive() && <Card title="To-dos"><div className="scroll"><TodoPreview limit={6} /></div></Card>}
      <TflCard compact />
    </div>
  );
}
