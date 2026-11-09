import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { legacyWrites, markMigrated } from './lib/migrate';
import { useStore } from './lib/store';
import BoardPage from './pages/Board';
import CalendarPage from './pages/Calendar';
import HealthPage from './pages/Health';
import LoginPage from './pages/Login';
import MoneyPage from './pages/Money';
import SettingsPage from './pages/Settings';
import TodayPage from './pages/Today';
import TodosPage from './pages/Todos';

export default function App() {
  const { status, data, putMany, error, retry, signOut } = useStore();

  useEffect(() => {
    if (status !== 'ready') return;
    const writes = legacyWrites(data);
    if (writes.length) putMany(writes);
    markMigrated();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'signed-out') return <LoginPage />;
  if (status === 'loading') {
    return (
      <div className="login">
        {error ? (
          <div className="card">
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div className="bold">Couldn't load your dashboard</div>
            <div className="error-banner">{error}</div>
            <button className="btn primary" onClick={retry}>Try again</button>
            <button className="btn" onClick={signOut}>Sign out</button>
          </div>
        ) : <div className="muted">Loading…</div>}
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/board" element={<BoardPage />} />
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
