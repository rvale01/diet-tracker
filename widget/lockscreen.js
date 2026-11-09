// ── Dashboard · Lock Screen widget (Scriptable) ──────────────
// Shows this month's bills (and the Winter Arc day while it runs) on your Lock Screen.
//
// 1. In Scriptable tap +, paste this whole file and name it "Dashboard".
// 2. Tap ▶ once: it asks for your dashboard password (stored in the iOS Keychain).
// 3. Lock Screen → long-press → Customise → Lock Screen → tap the widget area →
//    Scriptable → pick the wide (rectangular) or round one → tap it → Script: Dashboard.
// Tapping the widget opens the Money page. iOS refreshes Lock Screen widgets every ~15–30 minutes.
// ─────────────────────────────────────────────────────────────

const SITE = 'https://diet-tracker-hazel.vercel.app';
const KEY = 'dashboard.token';
const DIET_START = new Date(2026, 10, 9);   // Mon 9 Nov 2026
const DIET_DAYS = 29;

// ── Data ─────────────────────────────────────────────────────
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

async function loadData() {
  if (!Keychain.contains(KEY)) return { error: 'Open Scriptable to sign in' };
  const r = new Request(`${SITE}/api/data`);
  r.method = 'POST';
  r.headers = { 'content-type': 'application/json', authorization: `Bearer ${Keychain.get(KEY)}` };
  r.body = JSON.stringify({ op: 'all' });
  r.timeoutInterval = 20;
  try {
    const res = await r.loadJSON();
    if (r.response && r.response.statusCode === 401) { Keychain.remove(KEY); return { error: 'Open Scriptable to sign in' }; }
    if (!res.data) return { error: res.error || 'No data' };
    return { data: res.data };
  } catch (e) {
    return { error: 'Offline' };
  }
}

// ── Same rules as the app ────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const money = (n) => '£' + Math.round(n).toLocaleString('en-GB');

function bills(data, now) {
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const list = Object.values(data.bills || {}).filter((b) => {
    if (!b.active) return false;
    const made = new Date(b.createdAt);
    if (y * 12 + m < made.getFullYear() * 12 + made.getMonth() + 1) return false;
    if (b.frequency === 'monthly') return true;
    const diff = (m - b.startMonth + 12) % 12;
    return b.frequency === 'quarterly' ? diff % 3 === 0 : diff === 0;
  }).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const payments = data.billPayments || {};
  const paid = list.filter((b) => payments[`${b.id}:${y}-${pad(m)}`]);
  const left = list.filter((b) => !payments[`${b.id}:${y}-${pad(m)}`]);
  const total = paid.reduce((s, b) => s + (payments[`${b.id}:${y}-${pad(m)}`].amount || 0), 0);
  return { count: list.length, paid: paid.length, left, total };
}

function diet(data, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const n = Math.round((today - DIET_START) / 86400000) + 1;
  if (n < 1 || n > DIET_DAYS) return null;
  const d = (data.dietDays || {})[keyOf(today)] || {};
  const glutenFree = n >= 8;
  let s = 0;
  if (d.sugar) s++;
  if (glutenFree && d.gluten) s++;
  if (d.protein) s++;
  if ((d.water || 0) >= 8) s++;
  if ((d.sleep || 0) >= 7) s++;
  return { day: n, score: s, max: glutenFree ? 5 : 4 };
}

// ── Widgets ──────────────────────────────────────────────────
function text(stack, str, font, opacity = 1) {
  const t = stack.addText(str);
  t.font = font;
  t.textOpacity = opacity;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}

function rectangular(w, b, dt) {
  text(w, `💷 Bills ${b.paid}/${b.count} · ${money(b.total)}`, Font.boldSystemFont(14));
  const names = b.left.map((x) => x.name);
  const leftLine = !b.count ? 'No bills yet'
    : !b.left.length ? 'All paid this month ✓'
    : `Left: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` +${names.length - 3}` : ''}`;
  text(w, leftLine, Font.systemFont(12), 0.85);
  if (dt) text(w, `🥋 Day ${dt.day}/${DIET_DAYS} · quests ${dt.score}/${dt.max}`, Font.systemFont(12), 0.85);
}

function circular(w, b) {
  const size = 60, lineW = 5;
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const r = (size - lineW) / 2, c = size / 2;
  const arc = (from, to, alpha) => {
    const p = new Path();
    const steps = Math.max(2, Math.ceil((to - from) * 60));
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + 2 * Math.PI * (from + ((to - from) * i) / steps);
      const pt = new Point(c + r * Math.cos(a), c + r * Math.sin(a));
      i ? p.addLine(pt) : p.move(pt);
    }
    ctx.addPath(p);
    ctx.setStrokeColor(new Color('#ffffff', alpha));
    ctx.setLineWidth(lineW);
    ctx.strokePath();
  };
  arc(0, 1, 0.25);
  if (b.count && b.paid) arc(0, b.paid / b.count, 1);
  w.backgroundImage = ctx.getImage();
  w.addSpacer();
  const row = w.addStack(); row.addSpacer();
  text(row, `${b.paid}/${b.count}`, Font.boldSystemFont(15)).centerAlignText();
  row.addSpacer();
  const row2 = w.addStack(); row2.addSpacer();
  text(row2, 'bills', Font.systemFont(9), 0.8);
  row2.addSpacer();
  w.addSpacer();
}

function homeScreen(w, b, dt, family) {
  // Bonus: also works as a small/medium Home Screen widget.
  w.backgroundColor = new Color('#0b1120');
  const t = text(w, '💷 Bills this month', Font.boldSystemFont(13)); t.textColor = new Color('#2dd4bf');
  w.addSpacer(4);
  const big = text(w, `${b.paid}/${b.count} paid`, Font.boldSystemFont(24)); big.textColor = Color.white();
  const tot = text(w, money(b.total), Font.mediumSystemFont(13), 0.8); tot.textColor = Color.white();
  w.addSpacer(6);
  const groups = {};
  for (const x of b.left) (groups[x.group || 'Other'] = groups[x.group || 'Other'] || []).push(x.name);
  const lines = Object.entries(groups).map(([g, n]) => `${g}: ${n.join(', ')}`);
  for (const l of (lines.length ? lines : ['All paid ✓']).slice(0, family === 'small' ? 2 : 3)) {
    const lt = text(w, l, Font.systemFont(11), 0.85); lt.textColor = Color.white(); lt.lineLimit = 2;
  }
  if (dt) { w.addSpacer(4); const d = text(w, `🥋 Day ${dt.day} · ${dt.score}/${dt.max}`, Font.systemFont(11), 0.85); d.textColor = Color.white(); }
}

async function build(family = config.widgetFamily || 'accessoryRectangular') {
  const w = new ListWidget();
  w.url = `${SITE}/money`;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const { data, error } = await loadData();
  if (error) {
    if (family.startsWith('accessory') || !config.runsInWidget) text(w, `💷 ${error}`, Font.systemFont(12));
    else { w.backgroundColor = new Color('#0b1120'); const t = text(w, error, Font.systemFont(13)); t.textColor = Color.white(); }
    return w;
  }
  const now = new Date();
  const b = bills(data, now), dt = diet(data, now);
  if (family === 'accessoryInline') text(w, `💷 ${b.paid}/${b.count} bills paid · ${b.left.length} left`, Font.systemFont(12));
  else if (family === 'accessoryCircular') { w.addAccessoryWidgetBackground = true; circular(w, b); }
  else if (family === 'accessoryRectangular') rectangular(w, b, dt);
  else homeScreen(w, b, dt, family);
  return w;
}

// ── Run ──────────────────────────────────────────────────────
if (!config.runsInWidget && !Keychain.contains(KEY)) await signIn();
const widget = await build();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  const menu = new Alert();
  menu.title = 'Preview';
  menu.addAction('Lock Screen – wide');
  menu.addAction('Lock Screen – round');
  menu.addAction('Home Screen – medium');
  menu.addDestructiveAction('Sign out');
  menu.addCancelAction('Done');
  const i = await menu.presentAlert();
  if (i === 0) await widget.presentAccessoryRectangular();
  if (i === 1) await (await build('accessoryCircular')).presentAccessoryCircular();
  if (i === 2) await (await build('medium')).presentMedium();
  if (i === 3) { Keychain.remove(KEY); }
}
Script.complete();
