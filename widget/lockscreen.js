// ── Dashboard · Lock Screen widget (Scriptable) ──────────────
// Today's appointments and your tube lines, on your Lock Screen.
//
// 1. In Scriptable tap +, paste this whole file and name it "Dashboard".
// 2. Tap ▶ once: it asks for your dashboard password (stored in the iOS Keychain).
// 3. Lock Screen → long-press → Customise → Lock Screen → tap the widget area →
//    Scriptable → pick the wide (rectangular) one → tap it → Script: Dashboard.
//    The round one shows your next appointment; the one-line one (above the clock) shows a summary.
// Lines come from the app's Settings (default: Elizabeth line + DLR).
// Tapping the widget opens the dashboard. iOS refreshes Lock Screen widgets every ~15–30 minutes.
// ─────────────────────────────────────────────────────────────

const SITE = 'https://diet-tracker-hazel.vercel.app';
const KEY = 'dashboard.token';
const DEFAULT_LINES = ['elizabeth', 'dlr'];
const SHORT = { elizabeth: 'Elizabeth', dlr: 'DLR', 'hammersmith-city': 'H&C', 'waterloo-city': 'W&C' };
// Bright white text so it reads over a busy wallpaper.
const INK = Color.white();
const BG = new Color('#0b1120');

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
    const [tube, events] = await Promise.all([
      lines(ids).catch(() => null),
      appointments(now).catch(() => null),
    ]);
    return { tube, events };
  } catch (e) {
    if (e instanceof SignedOut) { Keychain.remove(KEY); return { error: 'Open Scriptable to sign in' }; }
    return { error: 'Offline' };
  }
}

// ── Text helpers ─────────────────────────────────────────────
function text(stack, str, font) {
  const t = stack.addText(str);
  t.font = font;
  t.textColor = INK;
  t.textOpacity = 1;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}
function tubeLine(tube) {
  if (!tube) return '🚇 TfL unavailable';
  const bad = tube.filter((l) => !l.good);
  if (!bad.length) return `🚇 ${tube.map((l) => l.name).join(' & ')} good`;
  return `⚠️ ${bad.map((l) => `${l.name}: ${l.status}`).join(' · ')}`;
}
const eventLine = (e) => `${e.time === 'All day' ? '📌' : e.time} ${e.title}`;

// ── Layouts ──────────────────────────────────────────────────
function rectangular(w, d) {
  // Three bold white lines spread over the whole widget height.
  w.setPadding(0, 0, 0, 0);
  text(w, tubeLine(d.tube), Font.heavySystemFont(16));
  w.addSpacer();
  if (!d.events) text(w, 'Calendar unavailable', Font.boldSystemFont(16));
  else if (!d.events.length) text(w, 'No more appointments today', Font.boldSystemFont(16));
  else {
    const extra = d.events.length - 2;
    d.events.slice(0, 2).forEach((e, i) => {
      if (i) w.addSpacer();
      text(w, eventLine(e) + (i === 1 && extra > 0 ? `  +${extra}` : ''), Font.boldSystemFont(16));
    });
    if (d.events.length === 1) { w.addSpacer(); text(w, 'Nothing else today', Font.semiboldSystemFont(14)); }
  }
}

function circular(w, d) {
  // Next appointment time, or ✓ when the day is free.
  w.addAccessoryWidgetBackground = true;
  const next = d.events && d.events.find((e) => !e.allDay);
  w.addSpacer();
  const r1 = w.addStack(); r1.addSpacer(); text(r1, next ? next.time : '✓', Font.heavySystemFont(next ? 15 : 22)); r1.addSpacer();
  const r2 = w.addStack(); r2.addSpacer(); text(r2, next ? 'next' : 'free', Font.boldSystemFont(10)); r2.addSpacer();
  w.addSpacer();
}

function inline(w, d) {
  const bad = d.tube ? d.tube.filter((l) => !l.good).length : 0;
  const tube = d.tube ? (bad ? `⚠️ ${bad} line${bad > 1 ? 's' : ''} delayed` : '🚇 Lines good') : '🚇 –';
  const next = d.events && d.events[0];
  text(w, `${tube} · ${next ? eventLine(next) : 'Free day'}`, Font.boldSystemFont(14));
}

function homeScreen(w, d, family) {
  w.backgroundColor = BG;
  if (d.tube) d.tube.forEach((l) => text(w, `${l.good ? '🟢' : '🟠'} ${l.name}: ${l.status}`, Font.boldSystemFont(15)));
  else text(w, '🚇 TfL unavailable', Font.boldSystemFont(15));
  w.addSpacer();
  const max = family === 'small' ? 3 : family === 'large' ? 9 : 4;
  if (!d.events) text(w, 'Calendar unavailable', Font.semiboldSystemFont(15));
  else if (!d.events.length) text(w, 'No more appointments today', Font.semiboldSystemFont(15));
  else d.events.slice(0, max).forEach((e) => text(w, eventLine(e), Font.semiboldSystemFont(15)));
  w.addSpacer();
}

async function build(family = config.widgetFamily || 'accessoryRectangular') {
  const w = new ListWidget();
  w.url = SITE;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const d = await loadAll();
  if (d.error) {
    if (!family.startsWith('accessory')) w.backgroundColor = BG;
    text(w, d.error, Font.boldSystemFont(15));
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
