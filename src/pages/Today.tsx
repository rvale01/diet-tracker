import { Link } from 'react-router-dom';
import Agenda from '../components/Agenda';
import BillsDue from '../components/BillsDue';
import { MiniQuests } from '../components/Diet';
import TflCard from '../components/Tfl';
import TodoPreview from '../components/Todos';
import WeatherCard from '../components/Weather';
import { Card, More } from '../components/ui';
import { useAgenda } from '../lib/agenda';
import { addDays, greeting, todayKey } from '../lib/dates';
import { dietActive } from '../lib/diet';
import { useStore } from '../lib/store';

export default function TodayPage() {
  const { settings } = useStore();
  const t = todayKey();
  const { byDay, loaded } = useAgenda(t, addDays(t, 1));
  const now = new Date();
  return (
    <>
      <div className="hero between">
        <div>
          <h1>{greeting(now)}{settings.name ? `, ${settings.name}` : ''}</h1>
          <div className="date">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <Link to="/board" className="btn small" title="Open the kitchen board">🖥️ Board</Link>
      </div>
      <div className="grid-2">
        <Card title="Today & tomorrow" action={<More to="/calendar">Calendar</More>}>
          {loaded ? <Agenda days={[t, addDays(t, 1)]} byDay={byDay} /> : <div className="empty">Loading…</div>}
        </Card>
        <WeatherCard />
      </div>
      {dietActive() && <Card title="🥋 Winter Arc" action={<More to="/health">Details</More>} className="diet-hero"><MiniQuests /></Card>}
      <div className="grid-2">
        <Card title="Bills this month" action={<More to="/money">Pay</More>}><BillsDue /></Card>
        <Card title="To-dos" action={<More to="/todos" />}><TodoPreview /></Card>
      </div>
      <TflCard compact />
    </>
  );
}
