// ── Config ──────────────────────────────────────────────────
const START = new Date(2026, 10, 9);   // Mon Nov 9, 2026
const END   = new Date(2026, 11, 7);   // Mon Dec 7, 2026
const TOTAL_DAYS = 29;
const WATER_GOAL = 8;                  // glasses of 250 ml = 2 L
const SLEEP_GOAL = 7;
const WEEKLY_TRAINING = 3;             // gym sessions per week (karate counts)
const GLUTEN_FROM = 8;                 // gluten allowed in week 1 (days 1–7)
const STORE_KEY = 'dietChronicles.round3';

const PHRASES = [
  // Week 1
  { text: "Day 1 of the Winter Arc. Sugar and your old self have been served eviction notices. Gluten gets a one-week grace period.", emoji: "🌱" },
  { text: "Day 2: a croissant made eye contact with you today. You did not blink. Terrifying.", emoji: "🥐" },
  { text: "Day 3: the sugar withdrawal is real. You are a karateka. Withdrawal is just another opponent. Oss.", emoji: "🥋" },
  { text: "Day 4: your protein shake is now your most reliable relationship. It shows up every morning. No drama.", emoji: "🥤" },
  { text: "Day 5: you've had more water this week than a medium-sized houseplant. Hydrated. Glowing. Dangerous.", emoji: "💧" },
  { text: "Day 6: weekend boss fight. Brunch pastries are the enemy. Eggs are your allies. Syrup is a traitor.", emoji: "🍳" },
  { text: "WEEK 1 COMPLETE. Seven days of discipline. Your belt didn't change colour, but your soul did.", emoji: "🥇" },
  // Week 2
  { text: "Week 2: gluten's grace period is OVER. Bread, we had a good run. The cravings are scared of you now.", emoji: "🔓" },
  { text: "Day 9: you've done more kata than you've eaten biscuits this month. That ratio is historic.", emoji: "📈" },
  { text: "Day 10! DOUBLE DIGITS. Celebrate with a ceremony (non-edible). Maybe a dramatic bow.", emoji: "🎉" },
  { text: "Day 11: you slept 7 hours on purpose. As an adult. Scientists are baffled.", emoji: "😴" },
  { text: "Day 12: pasta has sent you a heartfelt letter. Return to sender. No forwarding address.", emoji: "📮" },
  { text: "Day 13: the fridge is whispering your name. Whisper back: 'not today, buddy.'", emoji: "🙅" },
  { text: "TWO WEEKS DOWN. Halfway there. You are no longer a beginner. You are a threat.", emoji: "🦋" },
  // Week 3
  { text: "Week 3: the point where most mortals perish. Not you. You are feral. You are FOCUSED.", emoji: "⚡" },
  { text: "Day 16: you've said no to sugar so many times your mouth does it on autopilot. Muscle memory, like a good block.", emoji: "🛡️" },
  { text: "Day 17: your gym bag has seen more action than your sofa. The sofa is jealous. Let it be.", emoji: "🎒" },
  { text: "Day 18: fruit tastes like candy now. Your taste buds have been fully rebooted. Firmware updated.", emoji: "🍓" },
  { text: "Day 19: your nose is healing, your habits are healing, everything is healing. Main character recovery arc.", emoji: "🩹" },
  { text: "Day 20: you are so hydrated that clouds are asking you for tips.", emoji: "☁️" },
  { text: "THREE WEEKS. This isn't a diet anymore. It's just who you are. Disgusting. Iconic.", emoji: "🎖️" },
  // Week 4
  { text: "FINAL WEEK STARTS. The 'can't quit now' zone. This is not a threat. This is maths.", emoji: "🌄" },
  { text: "Day 23: remember Day 1 you? They'd be absolutely losing it if they could see you now.", emoji: "🪞" },
  { text: "Day 24: Christmas sweets are appearing in shops. You walk past them like a ninja. Unbothered.", emoji: "🥷" },
  { text: "Day 25: five days left. Your sensei would nod at you slowly. Maybe even a half-smile.", emoji: "🙇" },
  { text: "Day 26: four days. Quitting now would be a crime against your past 25 days. We don't do crimes.", emoji: "🚔" },
  { text: "Day 27: two days. The finish line is close enough to lick. Don't. It might contain gluten.", emoji: "🏁" },
  { text: "Day 28: FOUR FULL WEEKS. One more sunrise. Tonight, sleep like the champion you are.", emoji: "🌙" },
  { text: "DAY 29. DECEMBER 7. YOU ABSOLUTE LEGEND. You said you would, and then you DID. Weigh in. Take the photo. Hall of fame.", emoji: "🏆" },
];

const PRE_PHRASES = [
  "The Winter Arc begins Monday. Enjoy your last weekend as a civilian. 🫡",
  "Tomorrow it begins. Stock up on protein, fruit and water. Rest up. 🌙",
];

const QUEST_KEYS = ['sugar', 'gluten', 'protein'];
const ACT_LABELS = { gym: '🏋️ Gym', karate: '🥋 Karate', kickboxing: '🥊 Kickboxing', cardio: '🏃 Cardio' };

// ── Storage ──────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign({ days: {}, sessions: [], timer: null, measures: {}, act: 'gym' }, JSON.parse(raw));
  } catch (e) {}
  return { days: {}, sessions: [], timer: null, measures: {}, act: 'gym' };
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}
const state = load();

// ── Date helpers ─────────────────────────────────────────────
const DAY_MS = 86400000;
function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function keyOf(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dateOfDay(n) { return new Date(START.getFullYear(), START.getMonth(), START.getDate() + n - 1); }
function dayNumOf(d) { return Math.round((midnight(d) - START) / DAY_MS) + 1; }
function todayNum() { return dayNumOf(new Date()); }
function fmt(d, opts) { return d.toLocaleDateString('en-GB', opts || { weekday: 'long', day: 'numeric', month: 'long' }); }

function dayData(n) {
  const k = keyOf(dateOfDay(n));
  if (!state.days[k]) state.days[k] = { sugar: false, gluten: false, protein: false, water: 0, sleep: 0, gym: false, karate: false, rest: false };
  return state.days[k];
}
function peekDay(n) { return state.days[keyOf(dateOfDay(n))]; }

function glutenFree(n) { return n >= GLUTEN_FROM; }
function maxScore(n) { return glutenFree(n) ? 5 : 4; }
function scoreOf(d, n) {
  if (!d) return 0;
  let s = 0;
  QUEST_KEYS.forEach(k => { if (d[k] && (k !== 'gluten' || glutenFree(n))) s++; });
  if (d.water >= WATER_GOAL) s++;
  if (d.sleep >= SLEEP_GOAL) s++;
  return s;
}

// ── Stars ────────────────────────────────────────────────────
function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--dur:${Math.random() * 4 + 2}s;--op:${Math.random() * 0.5 + 0.2};animation-delay:${Math.random() * 4}s;`;
    container.appendChild(star);
  }
}

// ── State for UI ─────────────────────────────────────────────
let selected = Math.min(Math.max(todayNum(), 1), TOTAL_DAYS);

// ── Header / phrase / progress ───────────────────────────────
function renderHeader() {
  const t = todayNum();
  const badge = document.getElementById('day-badge');
  const total = document.getElementById('total-days');
  const phraseEl = document.getElementById('daily-phrase');
  const emojiEl = document.getElementById('phrase-emoji');

  if (t < 1) {
    const until = 1 - t;
    badge.textContent = `T−${until}`;
    total.textContent = until === 1 ? 'day to go' : 'days to go';
    phraseEl.textContent = PRE_PHRASES[Math.min(until, 2) === 1 ? 1 : 0];
    emojiEl.textContent = '⏳';
  } else if (t > TOTAL_DAYS) {
    badge.textContent = 'DONE';
    total.textContent = `${TOTAL_DAYS} days conquered`;
    phraseEl.textContent = PHRASES[TOTAL_DAYS - 1].text;
    emojiEl.textContent = '🏆';
  } else {
    badge.textContent = `DAY ${t}`;
    total.textContent = `of ${TOTAL_DAYS}`;
    phraseEl.textContent = PHRASES[t - 1].text;
    emojiEl.textContent = PHRASES[t - 1].emoji;
  }
  document.getElementById('date-display').innerHTML = fmt(new Date()) + '<br><span class="small">Nov 9 → Dec 7</span>';

  const done = Math.min(Math.max(t, 0), TOTAL_DAYS);
  const pct = Math.round((done / TOTAL_DAYS) * 100);
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('days-left').textContent = Math.max(TOTAL_DAYS - Math.max(t, 0), 0);
}

function renderGrid() {
  const grid = document.getElementById('weeks-grid');
  grid.innerHTML = '';
  const t = todayNum();
  for (let n = 1; n <= TOTAL_DAYS; n++) {
    const b = document.createElement('button');
    b.className = 'day-dot';
    b.textContent = n === TOTAL_DAYS ? '🏆' : n;
    const s = scoreOf(peekDay(n), n);
    if (n > t) b.classList.add('future');
    else if (s === maxScore(n)) b.classList.add('perfect');
    else if (s > 0) b.classList.add('partial');
    else if (n < t) b.classList.add('missed');
    else b.classList.add('empty');
    if (n === t) b.classList.add('today');
    if (n === selected) b.classList.add('selected');
    b.title = fmt(dateOfDay(n), { weekday: 'short', day: 'numeric', month: 'short' });
    b.disabled = n > t;
    b.addEventListener('click', () => { selected = n; renderAll(); document.querySelector('.check-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    grid.appendChild(b);
  }
}

// ── Checklist ────────────────────────────────────────────────
function statusText(s, max) {
  if (s === max) return "⭐ PERFECT DAY. Flawless. Your sensei is proud. Oss! ⭐";
  if (max - s === 1) return "One more and it's a PERFECT DAY. Go go go! ⚡";
  if (s === 0) return "Fresh day. Fresh start. Let's get it. 🌅";
  if (s === 1) return "One down! The momentum has begun. 🔥";
  if (s === 2) return "Two quests done. Keep stacking. 🧱";
  return "Over halfway through today's quests. Don't stop now. 💪";
}

function renderChecklist() {
  const t = todayNum();
  const locked = t < 1;
  const lockEl = document.getElementById('check-locked');
  const body = document.getElementById('check-body');
  const title = document.getElementById('check-title');

  if (locked) {
    lockEl.classList.remove('hidden');
    lockEl.textContent = `🔒 Quests unlock on Monday, Nov 9. ${1 - t} day${1 - t > 1 ? 's' : ''} to prepare.`;
    body.classList.add('disabled');
  } else {
    lockEl.classList.add('hidden');
    body.classList.remove('disabled');
  }

  const n = selected;
  const d = peekDay(n) || { water: 0, sleep: 0 };
  title.textContent = (n === t ? 'Today · ' : '') + `Day ${n} · ` + fmt(dateOfDay(n), { weekday: 'short', day: 'numeric', month: 'short' });

  document.querySelectorAll('.quest').forEach(q => q.classList.toggle('on', !!d[q.dataset.key]));

  // Gluten is allowed in week 1
  const gq = document.querySelector('.quest[data-key=gluten]');
  const graceful = !glutenFree(n);
  gq.classList.toggle('grace', graceful);
  gq.querySelector('.q-ico').textContent = graceful ? '🍞' : '🚫🍞';
  gq.querySelector('.q-txt').innerHTML = graceful
    ? 'Gluten allowed this week<small>No-gluten starts Mon 16 Nov</small>'
    : 'No gluten<small>Bread, pasta, pastries: banished</small>';

  const w = d.water || 0;
  document.getElementById('water-val').textContent = w;
  document.getElementById('water-sub').textContent = `${w} / ${WATER_GOAL} glasses · ${(w * 0.25).toFixed(2).replace(/0$/, '')} L`;
  document.getElementById('water-row').classList.toggle('on', w >= WATER_GOAL);
  const gl = document.getElementById('glasses');
  gl.innerHTML = '';
  for (let i = 1; i <= Math.max(WATER_GOAL, w); i++) {
    const g = document.createElement('span');
    g.className = 'glass' + (i <= w ? ' full' : '');
    g.textContent = '💧';
    gl.appendChild(g);
  }

  const sl = d.sleep || 0;
  document.getElementById('sleep-val').textContent = sl;
  document.getElementById('sleep-sub').textContent = sl >= SLEEP_GOAL ? `${sl}h · goal reached 🌙` : `Goal: ${SLEEP_GOAL}+ hours`;
  document.getElementById('sleep-row').classList.toggle('on', sl >= SLEEP_GOAL);

  const s = scoreOf(d, n), max = maxScore(n);
  const scoreEl = document.getElementById('day-score');
  scoreEl.textContent = `${s}/${max}`;
  scoreEl.classList.toggle('perfect', s === max);
  const st = document.getElementById('day-status');
  st.textContent = locked ? '' : statusText(s, max);
  st.classList.toggle('perfect', s === max);
}

function bindChecklist() {
  document.querySelectorAll('.quest').forEach(q => {
    q.addEventListener('click', () => {
      if (todayNum() < 1) return;
      const d = dayData(selected);
      const k = q.dataset.key;
      if (k === 'gluten' && !glutenFree(selected)) return;
      d[k] = !d[k];
      if (k === 'rest' && d.rest) { d.gym = false; d.karate = false; }
      if ((k === 'gym' || k === 'karate') && d[k]) d.rest = false;
      save(); renderAll();
    });
  });
  document.querySelectorAll('.step').forEach(b => {
    b.addEventListener('click', () => {
      if (todayNum() < 1) return;
      const d = dayData(selected);
      const k = b.dataset.step;
      const delta = parseFloat(b.dataset.d);
      const max = k === 'water' ? 16 : 12;
      d[k] = Math.min(Math.max(Math.round(((d[k] || 0) + delta) * 2) / 2, 0), max);
      save(); renderAll();
    });
  });
}

// ── Weekly ───────────────────────────────────────────────────
function weekOf(n) { return Math.min(Math.ceil(n / 7), 5); }
function weekRange(w) { const a = (w - 1) * 7 + 1; return [a, Math.min(a + 6, TOTAL_DAYS)]; }

function renderWeek() {
  const t = Math.min(Math.max(todayNum(), 1), TOTAL_DAYS);
  const w = weekOf(selected <= t ? selected : t);
  const [a, b] = weekRange(w);
  let gym = 0, karate = 0, trained = 0;
  for (let n = a; n <= b; n++) {
    const d = peekDay(n);
    if (!d) continue;
    if (d.gym) gym++;
    if (d.karate) karate++;
    if (d.gym || d.karate) trained++;
  }
  const startD = dateOfDay(a), endD = dateOfDay(b);
  document.getElementById('week-title').textContent =
    w === 5 ? 'Finish line · Dec 7' : `Week ${w} · ${fmt(startD, { day: 'numeric', month: 'short' })} – ${fmt(endD, { day: 'numeric', month: 'short' })}`;

  const pips = (id, count, goal) => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    for (let i = 0; i < Math.max(goal, count); i++) {
      const p = document.createElement('i');
      p.className = 'pip' + (i < count ? ' on' : '') + (i >= goal ? ' bonus' : '');
      el.appendChild(p);
    }
  };
  pips('train-pips', trained, WEEKLY_TRAINING);
  document.getElementById('train-count').textContent = `${trained}/${WEEKLY_TRAINING}`;
  document.getElementById('train-split').textContent =
    trained ? `🏋️ ${gym} gym · 🥋 ${karate} karate` : 'Karate counts as a gym session 🥋';

  const ms = state.sessions
    .filter(s => { const n = dayNumOf(new Date(s.start)); return n >= a && n <= b; })
    .reduce((sum, s) => sum + (s.end - s.start), 0);
  document.getElementById('week-mins').textContent = fmtDur(ms);

  let note;
  const left = WEEKLY_TRAINING - trained;
  if (w === 5) note = "Last day. Make it count. 🏁";
  else if (trained >= 5) note = "Beast week. Make sure you take a rest day. 🛌";
  else if (left <= 0) note = "Weekly goal smashed ✅ Anything else is a bonus.";
  else note = `${left} session${left === 1 ? '' : 's'} left this week.`;
  document.getElementById('week-note').textContent = note;
}

// ── Timer ────────────────────────────────────────────────────
let tick = null;

function fmtClock(ms) {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, '0')).join(':');
}
function fmtDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

function renderTimer() {
  const running = !!state.timer;
  const act = running ? state.timer.act : state.act;
  document.querySelectorAll('.act').forEach(b => {
    b.classList.toggle('on', b.dataset.act === act);
    b.disabled = running && b.dataset.act !== act;
  });
  document.getElementById('nose-note').classList.toggle('hidden', act !== 'kickboxing');
  const btn = document.getElementById('timer-btn');
  btn.textContent = running ? '■ Stop & save' : '▶ Start';
  btn.classList.toggle('running', running);
  document.getElementById('timer-display').classList.toggle('running', running);
  document.getElementById('timer-display').textContent = fmtClock(running ? Date.now() - state.timer.start : 0);

  if (running && !tick) {
    tick = setInterval(() => {
      document.getElementById('timer-display').textContent = fmtClock(Date.now() - state.timer.start);
    }, 1000);
  } else if (!running && tick) { clearInterval(tick); tick = null; }

  // Sessions for selected day
  const key = keyOf(dateOfDay(selected));
  const list = state.sessions.filter(s => keyOf(new Date(s.start)) === key);
  const el = document.getElementById('sessions');
  el.innerHTML = '';
  if (list.length) {
    const h = document.createElement('div');
    h.className = 'sessions-head';
    h.textContent = `Sessions · Day ${selected}`;
    el.appendChild(h);
  }
  list.forEach(s => {
    const row = document.createElement('div');
    row.className = 'session';
    const time = new Date(s.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    row.innerHTML = `<span>${ACT_LABELS[s.act] || s.act}</span><span class="muted">${time}</span><span class="s-dur">${fmtDur(s.end - s.start)}</span>`;
    const del = document.createElement('button');
    del.className = 's-del';
    del.textContent = '✕';
    del.title = 'Delete session';
    del.addEventListener('click', () => {
      if (!confirm('Delete this session?')) return;
      state.sessions = state.sessions.filter(x => x.id !== s.id);
      save(); renderAll();
    });
    row.appendChild(del);
    el.appendChild(row);
  });

  const total = state.sessions.reduce((sum, s) => sum + (s.end - s.start), 0);
  const hrs = total / 3600000;
  document.getElementById('total-hours').textContent = hrs < 10 ? hrs.toFixed(1) + 'h' : Math.round(hrs) + 'h';
}

function bindTimer() {
  document.querySelectorAll('.act').forEach(b => {
    b.addEventListener('click', () => {
      if (state.timer) return;
      state.act = b.dataset.act;
      save(); renderTimer();
    });
  });
  document.getElementById('timer-btn').addEventListener('click', () => {
    if (!state.timer) {
      state.timer = { act: state.act, start: Date.now() };
    } else {
      const end = Date.now();
      const s = { id: end, act: state.timer.act, start: state.timer.start, end };
      state.timer = null;
      if (end - s.start >= 60000) {
        state.sessions.push(s);
        // Tick the matching training box for that day
        const n = dayNumOf(new Date(s.start));
        if (n >= 1 && n <= TOTAL_DAYS && (s.act === 'gym' || s.act === 'karate')) {
          const d = dayData(n);
          d[s.act] = true;
          d.rest = false;
        }
      }
    }
    save(); renderAll();
  });
}

// ── Stats ────────────────────────────────────────────────────
function streak(key) {
  const t = Math.min(todayNum(), TOTAL_DAYS);
  if (t < 1) return 0;
  let n = t;
  const td = peekDay(t);
  if (!(td && td[key])) n = t - 1;   // today not ticked yet: count up to yesterday
  const first = key === 'gluten' ? GLUTEN_FROM : 1;
  let c = 0;
  while (n >= first) {
    const d = peekDay(n);
    if (d && d[key]) { c++; n--; } else break;
  }
  return c;
}

function renderStats() {
  document.getElementById('streak-sugar').textContent = streak('sugar');
  document.getElementById('streak-gluten').textContent = streak('gluten');
  let perfect = 0, waterSum = 0, waterDays = 0;
  for (let n = 1; n <= TOTAL_DAYS; n++) {
    const d = peekDay(n);
    if (!d) continue;
    if (scoreOf(d, n) === maxScore(n)) perfect++;
    if (d.water > 0) { waterSum += d.water; waterDays++; }
  }
  document.getElementById('perfect-days').textContent = perfect;
  document.getElementById('avg-water').textContent = waterDays ? (waterSum / waterDays * 0.25).toFixed(1) : '–';
}

// ── Measurements ─────────────────────────────────────────────
function renderMeasures() {
  const m = state.measures;
  document.querySelectorAll('[data-m]').forEach(i => {
    if (document.activeElement !== i) i.value = m[i.dataset.m] ?? '';
  });
  const delta = (a, b, unit) => {
    if (!a || !b) return '–';
    const d = Math.round((b - a) * 10) / 10;
    return (d > 0 ? '+' : '') + d + ' ' + unit;
  };
  const dw = document.getElementById('d-w'), dc = document.getElementById('d-c');
  dw.textContent = delta(m.w1, m.w2, 'kg');
  dc.textContent = delta(m.c1, m.c2, 'cm');
  dw.classList.toggle('good', m.w1 && m.w2 && m.w2 < m.w1);
  dc.classList.toggle('good', m.c1 && m.c2 && m.c2 < m.c1);
}

function bindMeasures() {
  document.querySelectorAll('[data-m]').forEach(i => {
    i.addEventListener('input', () => {
      const v = parseFloat(i.value);
      if (isNaN(v)) delete state.measures[i.dataset.m];
      else state.measures[i.dataset.m] = v;
      save(); renderMeasures();
    });
  });
}

// ── Init ─────────────────────────────────────────────────────
function renderAll() {
  renderHeader();
  renderGrid();
  renderChecklist();
  renderTimer();
  renderWeek();
  renderStats();
  renderMeasures();
}

function init() {
  createStars();
  bindChecklist();
  bindTimer();
  bindMeasures();
  renderAll();
  // Refresh when the app is reopened (e.g. the next morning)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      selected = Math.min(Math.max(todayNum(), 1), TOTAL_DAYS);
      renderAll();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
