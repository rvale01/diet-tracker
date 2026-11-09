// ── Diet Chronicles · Round 3 – Scriptable Widget ────────────
// 1. Install the free "Scriptable" app from the App Store
// 2. Open Scriptable, tap + and paste this entire file
// 3. Name it "Diet Chronicles"
// 4. Long-press your home screen → + → Scriptable → pick size
// ─────────────────────────────────────────────────────────────

const START = new Date(2026, 10, 9);   // Mon Nov 9
const TOTAL_DAYS = 29;                 // → Mon Dec 7

const PHRASES = [
  "Day 1 of the Winter Arc. Sugar evicted. Gluten on probation.",
  "A croissant made eye contact. You did not blink.",
  "Withdrawal is just another opponent. Oss.",
  "Your protein shake: the most reliable relationship you have.",
  "More water than a houseplant. Hydrated. Dangerous.",
  "Weekend boss fight. Eggs are allies. Syrup is a traitor.",
  "WEEK 1 DONE. Belt didn't change colour, your soul did.",
  "Week 2. Gluten grace period OVER. Bye, bread.",
  "More kata than biscuits this month. Historic ratio.",
  "DOUBLE DIGITS. Dramatic bow recommended.",
  "7 hours of sleep. On purpose. Scientists baffled.",
  "Pasta sent a letter. Return to sender.",
  "The fridge whispers your name. 'Not today, buddy.'",
  "TWO WEEKS. Halfway. You are a threat.",
  "Most mortals perish in week 3. Not you.",
  "Saying no to sugar is muscle memory now. Like a good block.",
  "Your gym bag has seen more action than your sofa.",
  "Fruit tastes like candy now. Firmware updated.",
  "Everything is healing. Main character recovery arc.",
  "So hydrated that clouds ask you for tips.",
  "THREE WEEKS. Not a diet. Just who you are.",
  "Final week. The 'can't quit now' zone. That's maths.",
  "Day 1 you would be losing it right now.",
  "Christmas sweets in shops. You walk past like a ninja.",
  "Your sensei would nod slowly. Maybe half-smile.",
  "Quitting now would be a crime. We don't do crimes.",
  "Finish line is close enough to lick. Don't. Gluten.",
  "FOUR WEEKS. One more sunrise. Sleep like a champion.",
  "DEC 7. YOU ABSOLUTE LEGEND. Weigh in. Hall of fame.",
];

const today = new Date();
const mid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const rawDay = Math.round((mid - START) / 86400000) + 1;

let big, sub, phrase, pct;
if (rawDay < 1) {
  big = `T−${1 - rawDay}`;
  sub = 'until Day 1';
  phrase = 'The Winter Arc begins Monday. Stock up on protein & water.';
  pct = 0;
} else {
  const day = Math.min(rawDay, TOTAL_DAYS);
  big = rawDay > TOTAL_DAYS ? 'DONE' : `Day ${day}`;
  sub = `${TOTAL_DAYS - day} to go`;
  phrase = PHRASES[day - 1];
  pct = Math.round((day / TOTAL_DAYS) * 100);
}

const filled = Math.round(pct / 10);
const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

// ── Widget ───────────────────────────────────────────────────
const w = new ListWidget();
const grad = new LinearGradient();
grad.colors = [new Color('#0f172a'), new Color('#1e293b')];
grad.locations = [0, 1];
w.backgroundGradient = grad;
w.setPadding(14, 16, 14, 16);
w.url = 'https://diet-tracker-hazel.vercel.app';   // tap to open the tracker

const title = w.addText('🥋 Winter Arc');
title.font = Font.boldSystemFont(13);
title.textColor = new Color('#60a5fa');

w.addSpacer(6);

const row = w.addStack();
row.layoutHorizontally();
row.centerAlignContent();
const dayNum = row.addText(big);
dayNum.font = Font.boldSystemFont(32);
dayNum.textColor = new Color('#60a5fa');
row.addSpacer();
const right = row.addStack();
right.layoutVertically();
const ofText = right.addText(`of ${TOTAL_DAYS} days`);
ofText.font = Font.mediumSystemFont(11);
ofText.textColor = new Color('#94a3b8');
const leftText = right.addText(sub);
leftText.font = Font.boldSystemFont(13);
leftText.textColor = new Color('#f472b6');

w.addSpacer(6);
const barText = w.addText(`${bar}  ${pct}%`);
barText.font = new Font('Menlo', 11);
barText.textColor = new Color('#2dd4bf');

w.addSpacer(8);
const p = w.addText(phrase);
p.font = Font.italicSystemFont(11);
p.textColor = new Color('#cbd5e1');
p.minimumScaleFactor = 0.7;
p.lineLimit = 3;

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
