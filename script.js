// ── Config ──────────────────────────────────────────────────
const START_DATE = new Date('2026-04-06T00:00:00');
const TOTAL_DAYS = 42;

// ── Daily Phrases (42 total, one per day) ───────────────────
const PHRASES = [
  // Week 1
  { text: "Every expert was once a beginner. Day one is the hardest — you just survived it.", emoji: "🌱" },
  { text: "Two days in! Your future self is already sending thank-you notes.", emoji: "💌" },
  { text: "Three days without giving up is a streak. Protect it like it's made of gold.", emoji: "🔥" },
  { text: "Halfway through week one. The couch is calling but your goals are louder.", emoji: "📣" },
  { text: "Five days! At this point your body is genuinely confused — in the best way.", emoji: "🤔" },
  { text: "Six days strong. You've almost outlasted most New Year's resolutions.", emoji: "🎯" },
  { text: "Week one DONE. Pop some sparkling water and act like it's champagne.", emoji: "🥂" },
  // Week 2
  { text: "Week 2 begins! The cravings are loud but you are louder.", emoji: "💪" },
  { text: "Nine days in. Statistically, habits are forming. Science is on your side.", emoji: "🔬" },
  { text: "Ten days! Double digits are a big deal. Don't let anyone tell you otherwise.", emoji: "🔟" },
  { text: "You've now said no to temptation more times than most people say yes to salad.", emoji: "🥗" },
  { text: "Twelve days. Your willpower is doing a full-body workout at this point.", emoji: "🏋️" },
  { text: "Day 13 — unlucky for bad habits, lucky for you.", emoji: "🍀" },
  { text: "Two weeks complete! You're not on a diet, you're becoming a different person.", emoji: "🦋" },
  // Week 3
  { text: "Week 3! This is where most people quit. You are not most people.", emoji: "⚡" },
  { text: "Day 16: halfway to halfway. The math is starting to look good.", emoji: "📐" },
  { text: "Seventeen days. Your discipline is showing up even when you don't feel like it.", emoji: "🏆" },
  { text: "Day 18: the finish line is getting louder than the fridge.", emoji: "🎵" },
  { text: "Three weeks minus one day. You've eaten more vegetables than a rabbit this month.", emoji: "🐰" },
  { text: "Three weeks down! You are officially a veteran of this diet. Act accordingly.", emoji: "🎖️" },
  { text: "Day 21: the sweet spot. Hard enough to be proud, not too far to stop now.", emoji: "🎪" },
  // Week 4
  { text: "Week 4 starts! You've made it past the halfway point. The view from here is great.", emoji: "🌄" },
  { text: "Day 23: your grocery cart now looks completely different. Character development.", emoji: "🛒" },
  { text: "Day 24 — almost a whole month. Remember day one? Look at you now.", emoji: "🪞" },
  { text: "Twenty-five days of choosing yourself. That is genuinely impressive.", emoji: "✨" },
  { text: "Day 26: four weeks completed tomorrow. The end is no longer abstract.", emoji: "🗓️" },
  { text: "Four weeks! The original you would not recognize this person. Hi, new you.", emoji: "👋" },
  { text: "Day 28: your body has officially adapted. This is your new normal.", emoji: "🧬" },
  // Week 5
  { text: "Week 5! One week left after this. You can TASTE the finish line (but not literally, stay on track).", emoji: "😅" },
  { text: "Day 30 — a full month! Only twelve days stand between you and victory.", emoji: "🗓️" },
  { text: "Day 31: eleven days left. You could run a marathon with the mental strength you've built.", emoji: "🏃" },
  { text: "Day 32: ten days to go. Single digits are almost within reach. Almost.", emoji: "🔭" },
  { text: "Day 33: you have now resisted temptation 33 times. That's basically a superpower.", emoji: "🦸" },
  { text: "Five weeks done. If discipline were a currency, you'd be very, very rich.", emoji: "💰" },
  { text: "Day 35: one week to go. This time next week you'll be celebrating. Don't stop now.", emoji: "🎊" },
  // Week 6
  { text: "FINAL WEEK STARTS. Six days. You've made it this far — there is zero reason to stop.", emoji: "🚀" },
  { text: "Day 37: five days left. The finish line can see YOU now.", emoji: "🏁" },
  { text: "Day 38: four days. At this point quitting would just be disrespectful to days 1-37.", emoji: "😤" },
  { text: "Day 39: three days. Your body said thank you. Your future self said thank you. We all said thank you.", emoji: "🙏" },
  { text: "Day 40: two days left. The last two days of anything are always the hardest. And always worth it.", emoji: "⏳" },
  { text: "Day 41: ONE MORE DAY. Tomorrow you finish what you started. Sleep well tonight, champion.", emoji: "🌙" },
  { text: "Day 42: YOU DID IT! 6 weeks. 42 days. Zero regrets. You absolute legend.", emoji: "🏆" },
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

  // Grid
  buildGrid(day);
}

document.addEventListener('DOMContentLoaded', init);
