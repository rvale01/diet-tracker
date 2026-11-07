// ── Diet Chronicles – Scriptable Widget ──────────────────────
// 1. Install the free "Scriptable" app from the App Store
// 2. Open Scriptable, tap + and paste this entire file
// 3. Name it "Diet Chronicles"
// 4. Long-press your home screen → + → Scriptable → pick size
// ─────────────────────────────────────────────────────────────

const START_DATE = new Date('2026-04-06T00:00:00');
const TOTAL_DAYS = 42;

const PHRASES = [
  // Week 1
  "You woke up and chose chaos — healthy chaos. The villain arc is OVER.",
  "Your fridge is judging you approvingly for once. Savor it.",
  "Your body has no idea what's happening. Neither do we. Keep going.",
  "You are officially on a STREAK. A salad streak. Nobody said glory was glamorous.",
  "Your metabolism just sent you a friend request. Accept immediately.",
  "You've outlasted 80% of all diet attempts. You're basically elite.",
  "Week 1 DONE. You survived 7 days of being better than your past self. Disgusting. Iconic.",
  // Week 2
  "New week, same mission, slightly less confused stomach.",
  "Your body is like 'wait… are we doing this for REAL?' Yes. Yes we are.",
  "DOUBLE DIGITS!! Hold a ceremony!! (Not a food ceremony.)",
  "You've said no to temptation more times than a golden retriever near a hot dog cart.",
  "Your willpower has a six-pack. Spiritually, at least.",
  "Bad luck for bad habits, incredible luck for good ones.",
  "TWO WEEKS DOWN. You are no longer a beginner. You are a threat.",
  // Week 3
  "The point where most mortals perish. Not you. You are feral. You are FOCUSED.",
  "Halfway to halfway! Your future body is already posting thirst traps.",
  "You've now eaten more fiber than a Victorian farmer. Incredible.",
  "The fridge is whispering your name. Whisper back: 'not today, buddy.'",
  "You've eaten so many vegetables that squirrels are starting to trust you.",
  "Three weeks done. This has been going long enough that it's basically a personality.",
  "EXACTLY halfway. Standing at the summit of Week 3. Look around. Slay.",
  // Week 4
  "You have entered the 'can't quit now' zone. This is not a threat. This is science.",
  "Your grocery haul now looks like a nature documentary. The glow-up is real.",
  "Almost a full month. Remember when day 42 felt impossible? Look at you.",
  "You have declined 25 opportunities to give up. Statistically unhinged. In the best way.",
  "Your body is like a plant someone finally started watering. Thriving. Glowing.",
  "FOUR WEEKS! The original you is crying proud tears eating a sadness cookie.",
  "Your taste buds have defected to the vegetables. Traitors. Legends.",
  // Week 5
  "One week after this and it's DONE. Victory tastes like cucumber water. Somehow great.",
  "A FULL MONTH. Nod slowly at yourself in a mirror like a movie character.",
  "Your discipline has its own Instagram at this point. 40k followers.",
  "Ten days to go. You're in single-digit territory mentally. Countdown activated.",
  "You've resisted temptation 33 times. That is a Jedi-level skill.",
  "FIVE WEEKS! The finish line is already preparing a speech about you.",
  "Seven days to go. You've been here for FIVE weeks. One more is nothing.",
  // Week 6
  "FINAL WEEK. Six days. You have become the diet.",
  "Quitting now would be a crime against your past 36 days. We will not commit crimes.",
  "Your ancestors are watching going 'they really said no to the pizza huh.'",
  "Three days. The math is embarrassingly favorable. You've got this.",
  "In 48 hours this will be a story you tell. Make it a good one.",
  "ONE. MORE. DAY. Tonight you are the main character. Sleep like one.",
  "YOU ABSOLUTE LEGEND. 6 weeks. 42 days. Hall of fame. Forever.",
];

// ── Logic ────────────────────────────────────────────────────
function getDayNumber() {
  const now = new Date();
  const diff = now - START_DATE;
  const day = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(day, 1), TOTAL_DAYS);
}

const day     = getDayNumber();
const left    = TOTAL_DAYS - day;
const pct     = Math.round((day / TOTAL_DAYS) * 100);
const phrase  = PHRASES[day - 1];

// Progress bar: 10 chars wide
const filled  = Math.round(pct / 10);
const bar     = '█'.repeat(filled) + '░'.repeat(10 - filled);

// ── Widget ───────────────────────────────────────────────────
const w = new ListWidget();

// Background gradient
const grad = new LinearGradient();
grad.colors    = [new Color('#0f172a'), new Color('#1e293b')];
grad.locations = [0, 1];
w.backgroundGradient = grad;
w.setPadding(14, 16, 14, 16);

// Title
const title = w.addText('🥦 Diet Chronicles');
title.font      = Font.boldSystemFont(13);
title.textColor = new Color('#4ade80');
title.minimumScaleFactor = 0.8;

w.addSpacer(6);

// Day counter row
const dayStack = w.addStack();
dayStack.layoutHorizontally();
dayStack.centerAlignContent();

const dayNum = dayStack.addText(`Day ${day}`);
dayNum.font      = Font.boldSystemFont(34);
dayNum.textColor = new Color('#4ade80');

dayStack.addSpacer();

const rightStack = dayStack.addStack();
rightStack.layoutVertically();

const ofText = rightStack.addText(`of ${TOTAL_DAYS} days`);
ofText.font      = Font.mediumSystemFont(11);
ofText.textColor = new Color('#94a3b8');

const leftText = rightStack.addText(`${left} to go`);
leftText.font      = Font.boldSystemFont(13);
leftText.textColor = new Color('#f472b6');

w.addSpacer(6);

// Progress bar
const barText = w.addText(`${bar}  ${pct}%`);
barText.font      = new Font("Menlo", 11);
barText.textColor = new Color('#2dd4bf');

w.addSpacer(8);

// Phrase
const phraseText = w.addText(phrase);
phraseText.font             = Font.italicSystemFont(11);
phraseText.textColor        = new Color('#cbd5e1');
phraseText.minimumScaleFactor = 0.7;
phraseText.lineLimit        = 3;

// ── Preview / Set ────────────────────────────────────────────
if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
