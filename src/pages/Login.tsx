import { useState } from 'react';
import { login } from '../lib/api';
import { useStore } from '../lib/store';

export default function LoginPage() {
  const { signedIn } = useStore();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await login(pw); signedIn(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in'); }
    finally { setBusy(false); }
  };
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <img src="/icon.svg" alt="" />
        <div><h1 style={{ fontSize: '1.4rem' }}>Dashboard</h1><p className="muted small">Your bills, calendar, health and to-dos.</p></div>
        <input type="password" autoComplete="current-password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus aria-label="Password" />
        {error && <div className="error-banner">{error}</div>}
        <button className="btn primary" disabled={!pw || busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="tiny faint">You stay signed in on this device.</p>
      </form>
    </div>
  );
}
