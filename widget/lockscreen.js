// ── Dashboard · Lock Screen widget (Scriptable) ──────────────
// Today's appointments, your tube lines and the weather, on your Lock Screen.
//
// 1. In Scriptable tap +, paste this whole file and name it "Dashboard".
// 2. Tap ▶ once: it asks for your dashboard password (stored in the iOS Keychain).
// 3. Lock Screen → long-press → Customise → Lock Screen → tap the widget area →
//    Scriptable → pick the wide (rectangular) one → tap it → Script: Dashboard.
//    The round one shows the weather; the one-line one (above the clock) shows a summary.
// Lines and weather location come from the app's Settings (default: Elizabeth line + DLR, London).
// Tapping the widget opens the dashboard. iOS refreshes Lock Screen widgets every ~15–30 minutes.
// ─────────────────────────────────────────────────────────────

const SITE = 'https://diet-tracker-hazel.vercel.app';
const KEY = 'dashboard.token';
const DEFAULT_LINES = ['elizabeth', 'dlr'];
const DEFAULT_PLACE = { name: 'London', lat: 51.5074, lon: -0.1278 };
const SHORT = { elizabeth: 'Elizabeth', dlr: 'DLR', 'hammersmith-city': 'H&C', 'waterloo-city': 'W&C' };

// ── Sign-in and requests ─────────────────────────────────────
async function signIn() {
  const a = new Alert();
  a.title = 'Dashboard';
  a.message = 'Enter your dashboard password. It is only used to get a sign-in token, which is kept in the iOS Keychain.';
  a.addSecureTextField('Password', '');
  a.addAction('Sign in');
  a.addCancelAction('Cancel');
  if ((await a.presentAlert()) === -1) return false;
  const r = new Request(`${SITE}/api/login`);
  r.method = 'POST';
  r.headers = { 'content-type': 'application/json' };
  r.body = JSON.stringify({ password: a.textFieldValue(0) });
  const res = await r.loadJSON();
  if (!res.token) {
    const e = new Alert(); e.title = 'Could not sign in'; e.message = res.error || 'Try again.'; e.addAction('OK'); await e.presentAlert();
    return false;
  }
  Keychain.set(KEY, res.token);
  return true;
}

class SignedOut extends Error {}

async function api(path, body) {
  const r = new Request(`${SITE}${path}`);
  r.headers = { 'content-type': 'application/json', authorization: `Bearer ${Keychain.get(KEY)}` };
  if (body) { r.method = 'POST'; r.body = JSON.stringify(body); }
  r.timeoutInterval = 20;
  const res = await r.loadJSON();
  if (r.response && r.response.statusCode === 401) throw new SignedOut();
  return res;
}

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// ── Weather (Open-Meteo, no key needed) ──────────────────────
const WX = [[[0], '☀️'], [[1], '🌤️'], [[2], '⛅'], [[3], '☁️'], [[45, 48], '🌫️'], [[51, 53, 55, 56, 57], '🌦️'],
  [[61, 63, 66, 80, 81], '🌧️'], [[65, 67, 82], '🌧️'], [[71, 73, 75, 77, 85, 86], '🌨️'], [[95, 96, 99], '⛈️']];
const wxIcon = (code, isDay) => (!isDay && code <= 1 ? '🌙' : (WX.find(([c]) => c.includes(code)) || [0, '🌡️'])[1]);

async function weather(place) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&timezone=auto&forecast_days=1`
    + '&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max';
  const j = await new Request(u).loadJSON();
  return {
    temp: Math.round(j.current.temperature_2m), icon: wxIcon(j.current.weather_code, j.current.is_day),
    max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]),
    rain: j.daily.precipitation_probability_max[0] || 0,
  };
}

// ── Tube lines ───────────────────────────────────────────────
async function lines(ids) {
  const raw = await api(`/api/tfl?path=${encodeURIComponent(`/Line/${ids.join(',')}/Status`)}`);
  return ids.map((id) => {
    const l = (raw || []).find((x) => x.id === id);
    const worst = l ? [...(l.lineStatuses || [])].sort((a, b) => a.statusSeverity - b.statusSeverity)[0] : null;
    return { id, name: SHORT[id] || (l ? l.name : id), good: !worst || worst.statusSeverity >= 10, status: worst ? worst.statusSeverityDescription : '?' };
  });
}

// ── Today's appointments ─────────────────────────────────────
async function appointments(now) {
  const t = keyOf(now);
  const res = await api(`/api/calendar?from=${t}&to=${t}`);
  return (res.events || []).filter((e) => {
    if (e.allDay) return e.start <= t && (!e.end || e.end > t);
    const end = new Date(e.end || e.start);
    return keyOf(new Date(e.start)) <= t && end > now; // still to come or happening now
  }).map((e) => ({ title: e.title, time: e.allDay ? 'All day' : hhmm(new Date(e.start)), allDay: e.allDay }))
    .sort((a, b) => (a.allDay === b.allDay ? a.time.localeCompare(b.time) : a.allDay ? -1 : 1));
}

async function loadAll() {
  if (!Keychain.contains(KEY)) return { error: 'Open Scriptable to sign in' };
  const now = new Date();
  try {
    const all = await api('/api/data', { op: 'all' });
    const settings = (all.data && all.data.settings && all.data.settings.main) || {};
    const ids = settings.tfl && settings.tfl.lines && settings.tfl.lines.length ? settings.tfl.lines : DEFAULT_LINES;
    const [wx, tube, events] = await Promise.all([
      weather(settings.weather || DEFAULT_PLACE).catch(() => null),
      lines(ids).catch(() => null),
      appointments(now).catch(() => null),
    ]);
    return { wx, tube, events, place: (settings.weather || DEFAULT_PLACE).name.split(',')[0] };
  } catch (e) {
    if (e instanceof SignedOut) { Keychain.remove(KEY); return { error: 'Open Scriptable to sign in' }; }
    return { error: 'Offline' };
  }
}

// ── Text helpers ─────────────────────────────────────────────
function text(stack, str, font, opacity = 1) {
  const t = stack.addText(str);
  t.font = font;
  t.textOpacity = opacity;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}
const wxLine = (wx) => (wx ? `${wx.icon} ${wx.temp}°` : '🌡️ –');
function tubeLine(tube) {
  if (!tube) return '🚇 TfL unavailable';
  const bad = tube.filter((l) => !l.good);
  if (!bad.length) return `🚇 ${tube.map((l) => l.name).join(' & ')} good`;
  return `⚠️ ${bad.map((l) => `${l.name}: ${l.status}`).join(' · ')}`;
}
const eventLine = (e) => `${e.time === 'All day' ? '📌' : e.time} ${e.title}`;

// ── Layouts ──────────────────────────────────────────────────
function rectangular(w, d) {
  text(w, `${wxLine(d.wx)} · ${tubeLine(d.tube)}`, Font.boldSystemFont(13));
  if (!d.events) text(w, 'Calendar unavailable', Font.systemFont(12), 0.85);
  else if (!d.events.length) text(w, 'No more appointments today', Font.systemFont(12), 0.85);
  else {
    d.events.slice(0, 2).forEach((e) => text(w, eventLine(e), Font.systemFont(12), 0.9));
    if (d.events.length > 2) text(w, `+${d.events.length - 2} more today`, Font.systemFont(11), 0.7);
  }
}

function circular(w, d) {
  w.addAccessoryWidgetBackground = true;
  w.addSpacer();
  const r1 = w.addStack(); r1.addSpacer(); text(r1, d.wx ? d.wx.icon : '🌡️', Font.systemFont(16)); r1.addSpacer();
  const r2 = w.addStack(); r2.addSpacer(); text(r2, d.wx ? `${d.wx.temp}°` : '–', Font.boldSystemFont(15)); r2.addSpacer();
  w.addSpacer();
}

function inline(w, d) {
  const bad = d.tube ? d.tube.filter((l) => !l.good).length : 0;
  const ev = d.events ? (d.events.length ? `${d.events.length} today` : 'free day') : '';
  text(w, `${wxLine(d.wx)} · ${d.tube ? (bad ? `⚠️ ${bad} line${bad > 1 ? 's' : ''}` : '🚇 ✓') : ''} · ${ev}`, Font.systemFont(12));
}

function homeScreen(w, d, family) {
  w.backgroundColor = new Color('#0b1120');
  const white = (t) => { t.textColor = Color.white(); return t; };
  white(text(w, d.wx ? `${d.wx.icon} ${d.wx.temp}°  ${d.place}` : `🌡️ ${d.place}`, Font.boldSystemFont(15)));
  if (d.wx) white(text(w, `↑${d.wx.max}° ↓${d.wx.min}° · ☔ ${d.wx.rain}%`, Font.systemFont(11), 0.75));
  w.addSpacer(5);
  if (d.tube) d.tube.forEach((l) => white(text(w, `${l.good ? '🟢' : '🟠'} ${l.name}: ${l.status}`, Font.systemFont(11), 0.9)));
  else white(text(w, '🚇 TfL unavailable', Font.systemFont(11), 0.75));
  w.addSpacer(5);
  const max = family === 'small' ? 2 : family === 'large' ? 8 : 3;
  if (!d.events) white(text(w, 'Calendar unavailable', Font.systemFont(11), 0.75));
  else if (!d.events.length) white(text(w, 'No more appointments today', Font.systemFont(11), 0.75));
  else d.events.slice(0, max).forEach((e) => white(text(w, eventLine(e), Font.systemFont(11), 0.95)));
}

async function build(family = config.widgetFamily || 'accessoryRectangular') {
  const w = new ListWidget();
  w.url = SITE;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const d = await loadAll();
  if (d.error) {
    if (!family.startsWith('accessory')) w.backgroundColor = new Color('#0b1120');
    const t = text(w, d.error, Font.systemFont(12));
    if (!family.startsWith('accessory')) t.textColor = Color.white();
    return w;
  }
  if (family === 'accessoryInline') inline(w, d);
  else if (family === 'accessoryCircular') circular(w, d);
  else if (family === 'accessoryRectangular') rectangular(w, d);
  else homeScreen(w, d, family);
  return w;
}

// ── Run ──────────────────────────────────────────────────────
if (!config.runsInWidget && !Keychain.contains(KEY)) await signIn();
if (config.runsInWidget) {
  Script.setWidget(await build());
} else {
  const menu = new Alert();
  menu.title = 'Preview';
  menu.addAction('Lock Screen – wide');
  menu.addAction('Lock Screen – round');
  menu.addAction('Home Screen – medium');
  menu.addDestructiveAction('Sign out');
  menu.addCancelAction('Done');
  const i = await menu.presentAlert();
  if (i === 0) await (await build('accessoryRectangular')).presentAccessoryRectangular();
  if (i === 1) await (await build('accessoryCircular')).presentAccessoryCircular();
  if (i === 2) await (await build('medium')).presentMedium();
  if (i === 3) Keychain.remove(KEY);
}
Script.complete();
