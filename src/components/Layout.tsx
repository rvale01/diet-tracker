import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../lib/store';

const LINKS = [
  { to: '/', ico: '🏠', label: 'Today' },
  { to: '/money', ico: '💷', label: 'Money' },
  { to: '/calendar', ico: '📅', label: 'Calendar' },
  { to: '/health', ico: '🥋', label: 'Health' },
  { to: '/todos', ico: '✅', label: 'To-dos' },
  { to: '/settings', ico: '⚙️', label: 'Settings' },
];

export default function Layout() {
  const { error } = useStore();
  return (
    <div className="app">
      <nav className="nav">
        <div className="brand"><img src="/icon.svg" alt="" width={28} height={28} style={{ borderRadius: 8 }} />Dashboard</div>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}><span className="ico">{l.ico}</span>{l.label}</NavLink>
        ))}
      </nav>
      <main className="page">
        {error && <div className="error-banner">⚠️ {error}</div>}
        <Outlet />
      </main>
    </div>
  );
}
