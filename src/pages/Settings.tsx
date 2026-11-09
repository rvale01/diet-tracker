import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, PageHead } from '../components/ui';
import { clearCalendarCache, useCalendar } from '../lib/calendar';
import { todayKey, uid } from '../lib/dates';
import { useStore } from '../lib/store';
import { byFavourite, expandStop, fetchStatuses, FAVOURITE_LINES, lineColor, searchStops, usePoll } from '../lib/tfl';
import type { CalendarFeed, TflStop } from '../lib/types';
import { searchPlaces } from '../lib/weather';

const COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#fb923c'];

function CalendarsCard() {
  const { settings, saveSettings } = useStore();
  const feeds = settings.calendars ?? [];
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const t = todayKey();
  const { data: cal } = useCalendar(t, t, 10 * 60_000, feeds.length);
  const save = (list: CalendarFeed[]) => { saveSettings({ calendars: list }); clearCalendarCache(); };
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(https?|webcals?):\/\//i.test(url.trim())) return;
    save([...feeds, { id: uid(), name: name.trim() || 'Calendar', url: url.trim(), color: COLORS[feeds.length % COLORS.length], enabled: true }]);
    setName(''); setUrl('');
  };
  const update = (id: string, patch: Partial<CalendarFeed>) => save(feeds.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  return (
    <Card title="Calendars">
      <div className="stack">
        <div className="list">
          <div className="list-row">
            <i className="dot" style={{ background: '#2dd4bf' }} />
            <div className="grow"><div className="bold">Family (HomeHub)</div>
              <div className="small muted">{cal?.familyBills ? 'Connected · events and bills' : cal?.errors.some((e) => e.source === 'homehub') ? '⚠️ Could not reach HomeHub' : 'Not connected yet (set up on the server)'}</div>
            </div>
          </div>
          {feeds.map((f) => {
            const err = cal?.errors.find((e) => e.source === f.id);
            return (
              <div className="list-row" key={f.id} style={{ opacity: f.enabled ? 1 : 0.5 }}>
                <input type="color" value={f.color} onChange={(e) => update(f.id, { color: e.target.value })} style={{ width: '2rem', height: '2rem', padding: 0, border: 'none', background: 'none' }} aria-label="Colour" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="bold">{f.name}</div>
                  <div className="tiny faint ellipsis">{err ? `⚠️ ${err.error}` : f.url.replace(/^(https?|webcals?):\/\//, '').slice(0, 40) + '…'}</div>
                </div>
                <button className="btn small" onClick={() => update(f.id, { enabled: !f.enabled })}>{f.enabled ? 'Hide' : 'Show'}</button>
                <button className="icon-btn" onClick={() => confirm(`Remove ${f.name}?`) && save(feeds.filter((x) => x.id !== f.id))} aria-label="Remove">✕</button>
              </div>
            );
          })}
        </div>
        <form className="stack" onSubmit={add} style={{ gap: '0.5rem' }}>
          <input placeholder="Name (e.g. Google, iCloud, Work)" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Calendar link (https://… or webcal://…)" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoCapitalize="off" autoCorrect="off" />
          <button className="btn primary" disabled={!url.trim()}>Add calendar</button>
        </form>
        <details className="small">
          <summary className="bold" style={{ cursor: 'pointer' }}>How do I get the link?</summary>
          <div className="stack muted" style={{ marginTop: '0.6rem', gap: '0.5rem' }}>
            <div><b>Google Calendar</b> (on a computer): calendar.google.com → ⚙️ Settings → click your calendar on the left → <b>Integrate calendar</b> → copy <b>“Secret address in iCal format”</b>. Repeat for each calendar you want.</div>
            <div><b>iCloud</b> (on iPhone): Calendar app → <b>Calendars</b> → tap ⓘ next to a calendar → turn on <b>Public Calendar</b> → <b>Share Link</b> → Copy. It starts with webcal://.</div>
            <div>Links are stored privately on your server, never in the code. Calendars are read-only here and refresh every few minutes.</div>
          </div>
        </details>
      </div>
    </Card>
  );
}

function TflSettings() {
  const { settings, saveSettings } = useStore();
  const saved = settings.tfl ?? { lines: [], stops: [] };
  const tfl = { ...saved, lines: saved.lines?.length ? saved.lines : FAVOURITE_LINES };
  const { data: lines } = usePoll(fetchStatuses, 600_000, []);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TflStop[] | null>(null);
  const [busy, setBusy] = useState(false);
  const toggleLine = (id: string) => saveSettings({ tfl: { ...tfl, lines: tfl.lines.includes(id) ? tfl.lines.filter((l) => l !== id) : [...tfl.lines, id] } });
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    try { setResults(await searchStops(q.trim())); } catch { setResults([]); } finally { setBusy(false); }
  };
  const addStop = async (s: TflStop) => {
    setBusy(true);
    const expanded = await expandStop(s);
    setBusy(false);
    if (expanded.length > 1) { setResults(expanded); return; }
    saveSettings({ tfl: { ...tfl, stops: [...tfl.stops.filter((x) => x.id !== expanded[0].id), expanded[0]] } });
    setResults(null); setQ('');
  };
  return (
    <Card title="TfL">
      <div id="tfl" className="stack">
        <div className="small muted">Pick the lines you use. Others only show when they have problems.</div>
        <div className="row wrap" style={{ gap: '0.35rem' }}>
          {byFavourite(lines ?? []).map((l) => (
            <button key={l.id} className={`chip ${tfl.lines.includes(l.id) ? 'blue' : ''}`} onClick={() => toggleLine(l.id)} style={{ padding: '0.35rem 0.65rem' }}>
              <i className="dot" style={{ background: lineColor(l.id) }} />{l.name}
            </button>
          ))}
          {!lines && <span className="empty">Loading lines…</span>}
        </div>
        <div className="small muted" style={{ marginTop: '0.4rem' }}>Stations and bus stops for live departures:</div>
        <div className="list">
          {tfl.stops.map((s) => (
            <div className="list-row" key={s.id}>
              <span className="ico">{s.modes.includes('bus') ? '🚌' : '🚇'}</span><span className="grow">{s.name}</span>
              <button className="icon-btn" onClick={() => saveSettings({ tfl: { ...tfl, stops: tfl.stops.filter((x) => x.id !== s.id) } })} aria-label="Remove">✕</button>
            </div>
          ))}
        </div>
        <form className="row" onSubmit={search}>
          <input placeholder="Search a station or bus stop" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" disabled={busy}>{busy ? '…' : 'Search'}</button>
        </form>
        {results && (
          <div className="list">
            {!results.length && <div className="empty">No matches.</div>}
            {results.map((r) => (
              <button className="list-row" key={r.id} onClick={() => addStop(r)} style={{ width: '100%', textAlign: 'left' }}>
                <span className="ico">{r.modes.includes('bus') && r.modes.length === 1 ? '🚌' : '🚇'}</span>
                <span className="grow">{r.name}<div className="tiny faint">{r.modes.join(', ')}</div></span><span className="chip blue">Add</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function WeatherSettings() {
  const { settings, saveSettings } = useStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ name: string; lat: number; lon: number }[] | null>(null);
  return (
    <Card title="Weather location">
      <div className="stack">
        <div>📍 {settings.weather?.name ?? 'London (default)'}</div>
        <form className="row" onSubmit={async (e) => { e.preventDefault(); if (q.trim()) setResults(await searchPlaces(q.trim()).catch(() => [])); }}>
          <input placeholder="Search a town or postcode area" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn">Search</button>
        </form>
        {results && (
          <div className="list">
            {!results.length && <div className="empty">No matches.</div>}
            {results.map((r) => (
              <button key={`${r.lat},${r.lon}`} className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => { saveSettings({ weather: r }); setResults(null); setQ(''); }}>{r.name}</button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const { settings, saveSettings, signOut } = useStore();
  const [name, setName] = useState(settings.name ?? '');
  useEffect(() => { if (location.hash) document.querySelector(location.hash)?.scrollIntoView(); }, []);
  const board = settings.board ?? { nightFrom: 23, nightTo: 6 };
  return (
    <>
      <PageHead title="Settings" />
      <Card title="You">
        <form className="row" onSubmit={(e) => { e.preventDefault(); saveSettings({ name: name.trim() }); }}>
          <input placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" disabled={name.trim() === (settings.name ?? '')}>Save</button>
        </form>
      </Card>
      <div id="calendars"><CalendarsCard /></div>
      <TflSettings />
      <WeatherSettings />
      <Card title="Kitchen board">
        <div className="stack">
          <div className="small muted">Open this on the kitchen screen (a converted photo frame or a tablet) and sign in once. It stays on, refreshes by itself and dims at night.</div>
          <Link className="btn" to="/board">🖥️ Open the board</Link>
          <a className="small" href="https://github.com/rvale01/diet-tracker/blob/claude/diet-tracker-website-g5ldM/docs/kitchen-frame.md" target="_blank" rel="noreferrer">📖 How to turn a £50 photo frame into the board →</a>
          <div className="form-grid">
            <div className="field"><label>Dim from</label>
              <select value={board.nightFrom} onChange={(e) => saveSettings({ board: { ...board, nightFrom: Number(e.target.value) } })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select>
            </div>
            <div className="field"><label>Until</label>
              <select value={board.nightTo} onChange={(e) => saveSettings({ board: { ...board, nightTo: Number(e.target.value) } })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select>
            </div>
          </div>
        </div>
      </Card>
      <Card title="Account">
        <div className="stack">
          <div className="small muted">Everything syncs between your phone and the board. To change the password, change DASHBOARD_PASSWORD in Vercel; every device is then signed out.</div>
          <button className="btn danger" onClick={signOut}>Sign out of this device</button>
        </div>
      </Card>
    </>
  );
}
