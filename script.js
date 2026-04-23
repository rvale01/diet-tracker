// ── Config ──────────────────────────────────────────────────
const START_DATE = new Date('2026-04-06T00:00:00');
const TOTAL_DAYS = 42;

const SUGAR_START  = new Date('2026-04-27T00:00:00');
const SUGAR_DAYS   = 21;
const SUGAR_STATUS = [
  "Day 1: You looked a candy bar in the eye and said no. Legendary.",
  "Day 2: Sugar is frantically texting you. Don't reply.",
  "Day 3: Three days! Your blood sugar is doing a little happy dance.",
  "Day 4: Almost at the halfway point. The candy aisle has never felt so far away.",
  "Day 5: FIVE DAYS SUGAR-FREE. You're basically a different organism at this point.",
  "Day 6: Six days! Sugar has filed a missing persons report. You cannot be found.",
  "Day 7: A full week with no sugar. Your pancreas just sent you a thank-you card.",
  "Day 8: Eight days! At this point sugar is a distant memory, like a bad ex.",
  "Day 9: Nine days in. You are so close to double digits it's basically criminal.",
  "Day 10: TEN DAYS. Double digits. Sugar-free royalty. Bow.",
  "Day 11: Eleven days of pure, unhinged discipline. Your future self is obsessed with you.",
  "Day 12: Twelve days! The halfway point is in the rearview mirror. No looking back.",
  "Day 13: Day 13 of no sugar. At this point your taste buds have gone full Stockholm syndrome for vegetables.",
  "Day 14: TWO WEEKS SUGAR-FREE. This is no longer a challenge. This is a lifestyle.",
  "Day 15: Day 15! Three-quarters of the way there. Sugar WHO? Never heard of her.",
  "Day 16: Sixteen days. Scientists are requesting to study you. You are the anomaly.",
  "Day 17: Day 17: four days left. You have eaten zero grams of sugar for 17 days. That is genuinely unhinged behaviour. Respect.",
  "Day 18: Three days left. At this point your cells are running on pure spite and discipline.",
  "Day 19: TWO DAYS LEFT. The finish line is close enough to lick. Don't. It might be sweet.",
  "Day 20: ONE MORE DAY. Tomorrow you'll have done something most people only talk about doing.",
  "🏆 21 DAYS SUGAR-FREE! You rewired your brain. You reset your palate. You are not the same person who started this. Unreal.",
];

// ── Daily Phrases (42 total, one per day) ───────────────────
const PHRASES = [
  // Week 1
  { text: "Day 1! You woke up and chose chaos — healthy chaos. The villain arc is OVER.", emoji: "🌱" },
  { text: "Two days in and your fridge is judging you approvingly for once. Savor it.", emoji: "🧊" },
  { text: "Day 3: scientifically, your body has no idea what's happening. Neither do we. Keep going.", emoji: "🔬" },
  { text: "Day 4! You are officially on a STREAK. A salad streak. Nobody said glory was glamorous.", emoji: "🥗" },
  { text: "Day 5: your metabolism just sent you a friend request. Accept immediately.", emoji: "📲" },
  { text: "Six days in and you've outlasted 80% of all diet attempts. You're basically elite.", emoji: "🏅" },
  { text: "Week 1: COMPLETE. You survived 7 days of being better than your past self. Disgusting. Iconic.", emoji: "🥂" },
  // Week 2
  { text: "Week 2 unlocked! New week, same mission, slightly less confused stomach.", emoji: "🔓" },
  { text: "Day 9: your body is like 'wait… are we doing this for REAL?' Yes. Yes we are.", emoji: "😤" },
  { text: "Day 10!! Double digits!! Hold a ceremony!! You've earned it (not a food ceremony).", emoji: "🎉" },
  { text: "Day 11: you have now said no to temptation more times than a golden retriever near a hot dog cart.", emoji: "🌭" },
  { text: "Day 12: your willpower has a six-pack at this point. Spiritually, at least.", emoji: "💪" },
  { text: "Day 13: bad luck for bad habits, incredible luck for good ones. The universe is on your side.", emoji: "🍀" },
  { text: "TWO WEEKS DOWN. You are no longer a beginner. You are a threat.", emoji: "🦋" },
  // Week 3
  { text: "Week 3! The point where most mortals perish. Not you. You are different. You are feral. You are FOCUSED.", emoji: "⚡" },
  { text: "Day 16: halfway to halfway! Your future body is already posting thirst traps in anticipation.", emoji: "📐" },
  { text: "Day 17: you have now eaten more fiber than a Victorian farmer. Incredible.", emoji: "🌾" },
  { text: "Day 18: the fridge is whispering your name. Whisper back: 'not today, buddy.'", emoji: "🙅" },
  { text: "Day 19: you've consumed so many vegetables that squirrels are starting to trust you.", emoji: "🐿️" },
  { text: "Three weeks complete! You've been doing this long enough that it's basically a personality now.", emoji: "🎖️" },
  { text: "Day 21: you are EXACTLY halfway through. Standing at the summit of Week 3. Take a moment. Look around. Slay.", emoji: "🏔️" },
  // Week 4
  { text: "WEEK 4! You have entered the 'can't quit now' zone. This is not a threat. This is science.", emoji: "🌄" },
  { text: "Day 23: your grocery haul now looks like a nature documentary. The glow-up is real.", emoji: "🛒" },
  { text: "Day 24: almost a full month. Remember when day 42 felt impossible? Look at you, proving everyone (yourself) wrong.", emoji: "🪞" },
  { text: "Day 25: you have now declined 25 opportunities to give up. You are statistically unhinged in the best way.", emoji: "📊" },
  { text: "Day 26: your body is like a plant that someone finally started watering. Thriving. Photosynthesizing. Glowing.", emoji: "🌿" },
  { text: "FOUR WEEKS! The original you is standing in the past crying proud tears and eating a sadness cookie.", emoji: "🍪" },
  { text: "Day 28: your taste buds have fully betrayed junk food and defected to the vegetables. Traitors. Legends.", emoji: "🧬" },
  // Week 5
  { text: "WEEK 5! One week after this and it's DONE. You can taste victory. (Tastes like cucumber water, somehow great.)", emoji: "😅" },
  { text: "Day 30: A FULL MONTH. Take a bow. Stand in front of a mirror. Nod slowly at yourself like a movie character.", emoji: "🎬" },
  { text: "Day 31: eleven days left. At this point your discipline has its own Instagram and 40k followers.", emoji: "📸" },
  { text: "Day 32: ten days to go. You're in single-digit territory mentally. The countdown is activated.", emoji: "🚀" },
  { text: "Day 33: you've now resisted temptation 33 times. That is a Jedi-level skill. Master Yoda is impressed.", emoji: "🧘" },
  { text: "FIVE WEEKS! One week left! You're so close that the finish line is already preparing a speech about you.", emoji: "🎤" },
  { text: "Day 35: seven days to go. One week. You have BEEN here for FIVE of them. One more is nothing.", emoji: "🎊" },
  // Week 6
  { text: "FINAL WEEK ACTIVATED. Six days. The diet cannot hurt you anymore. You have become the diet.", emoji: "👁️" },
  { text: "Day 37: five days left. At this point, quitting would be a crime against your past 36 days. We will not commit crimes.", emoji: "🚔" },
  { text: "Day 38: four days. Your ancestors are watching from the heavens going 'they really said no to the pizza huh.'", emoji: "🏛️" },
  { text: "Day 39: three days. The math is embarrassingly favorable. You have literally nothing to lose except the habit.", emoji: "🧮" },
  { text: "Day 40: two days left. In 48 hours this will be a story you tell. Make it a good one.", emoji: "📖" },
  { text: "Day 41: ONE. MORE. DAY. Tomorrow you cross the finish line. Tonight you are the main character. Sleep like one.", emoji: "🌙" },
  { text: "Day 42: YOU ABSOLUTE LEGEND. 6 weeks. 42 days. You said you would and then you DID. Hall of fame. Forever.", emoji: "🏆" },
];

// ── Helpers ─────────────────────────────────────────────────
function getDayNumber() {
  const now = new Date();
  const diff = now - START_DATE;
  const day = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(day, 1), TOTAL_DAYS);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── Stars ────────────────────────────────────────────────────
function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      --dur: ${Math.random() * 4 + 2}s;
      --op: ${Math.random() * 0.5 + 0.2};
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(star);
  }
}

// ── Sugar-Free Challenge ─────────────────────────────────────
function buildSugarTracker() {
  const now      = new Date();
  const diff     = now - SUGAR_START;
  const rawDay   = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  const notStarted = rawDay < 1;
  const finished   = rawDay > SUGAR_DAYS;
  const sugarDay   = Math.min(Math.max(rawDay, 1), SUGAR_DAYS);

  const displayDay = notStarted ? 0 : (finished ? SUGAR_DAYS : sugarDay);
  const sugarPct   = notStarted ? 0 : Math.round((displayDay / SUGAR_DAYS) * 100);

  document.getElementById('sugar-day').textContent = notStarted ? '–' : displayDay;
  document.getElementById('sugar-pct').textContent  = sugarPct + '%';
  document.getElementById('sugar-bar').style.width  = sugarPct + '%';

  const container = document.getElementById('sugar-dots');
  const NUMS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21'];
  for (let d = 1; d <= SUGAR_DAYS; d++) {
    const dot = document.createElement('div');
    dot.className = 'sugar-dot';
    dot.textContent = NUMS[d - 1];
    if (notStarted)                    dot.classList.add('future');
    else if (d < sugarDay || finished) dot.classList.add('done');
    else if (d === sugarDay)           dot.classList.add('today');
    else                               dot.classList.add('future');
    container.appendChild(dot);
  }

  const statusEl = document.getElementById('sugar-status');
  if (notStarted) {
    const daysUntil = Math.abs(rawDay - 1);
    statusEl.textContent = daysUntil === 0
      ? "The muffin has been accounted for. Fresh start tomorrow. 🫡"
      : `The muffin has been accounted for. Restarting in ${daysUntil} day${daysUntil > 1 ? 's' : ''}. Enjoy the weekend. 🧁`;
  } else {
    const idx = Math.min(sugarDay, SUGAR_DAYS) - 1;
    statusEl.textContent = SUGAR_STATUS[idx];
    if (finished) statusEl.classList.add('done-all');
  }
}

// ── Weeks Grid ───────────────────────────────────────────────
function buildGrid(currentDay) {
  const grid = document.getElementById('weeks-grid');
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const dot = document.createElement('div');
    dot.className = 'day-dot';
    dot.textContent = d;

    if (d < currentDay)       dot.classList.add('done');
    else if (d === currentDay) dot.classList.add('today');
    else                       dot.classList.add('future');

    // Tooltip
    const phrase = PHRASES[d - 1];
    dot.title = `Day ${d}: ${phrase.text}`;

    grid.appendChild(dot);
  }
}

// ── Init ─────────────────────────────────────────────────────
function init() {
  createStars();

  const day = getDayNumber();
  const phrase = PHRASES[day - 1];
  const pct = Math.round((day / TOTAL_DAYS) * 100);
  const daysLeft = TOTAL_DAYS - day;

  // Day display
  document.getElementById('current-day').textContent = day;
  document.getElementById('date-display').innerHTML =
    formatDate(new Date()) + '<br><span style="font-size:.8rem">Started April 6, 2026</span>';

  // Phrase
  document.getElementById('daily-phrase').textContent = phrase.text;
  document.getElementById('phrase-emoji').textContent = phrase.emoji;

  // Progress
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-bar').style.width = pct + '%';

  // Countdown
  document.getElementById('days-done').textContent = day;
  document.getElementById('days-left').textContent = daysLeft;

  // Sugar-Free Challenge
  buildSugarTracker();

  // Grid
  buildGrid(day);
}

document.addEventListener('DOMContentLoaded', init);
