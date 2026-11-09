// The Winter Arc (Round 3): Mon 9 Nov – Mon 7 Dec 2026.
import { addDays, keyOf, parseKey, todayKey } from './dates';
import type { DietDay } from './types';

export const START_KEY = '2026-11-09';
export const TOTAL_DAYS = 29;
export const WATER_GOAL = 8;        // glasses of 250 ml = 2 L
export const SLEEP_GOAL = 7;
export const WEEKLY_TRAINING = 3;   // gym sessions per week (karate counts)
export const GLUTEN_FROM = 8;       // gluten allowed in week 1 (days 1-7)

export const PHRASES: { text: string; emoji: string }[] = [
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

export const ACTS: Record<string, string> = { gym: '🏋️ Gym', karate: '🥋 Karate', kickboxing: '🥊 Kickboxing', cardio: '🏃 Cardio' };

export const dateOfDay = (n: number) => addDays(START_KEY, n - 1);
export const dayNumOf = (key: string) => Math.round((parseKey(key).getTime() - parseKey(START_KEY).getTime()) / 86400000) + 1;
export const todayNum = () => dayNumOf(todayKey());
export const clampDay = (n: number) => Math.min(Math.max(n, 1), TOTAL_DAYS);
export const glutenFree = (n: number) => n >= GLUTEN_FROM;
export const maxScore = (n: number) => (glutenFree(n) ? 5 : 4);

export function scoreOf(d: DietDay | undefined, n: number) {
  if (!d) return 0;
  let s = 0;
  if (d.sugar) s++;
  if (d.gluten && glutenFree(n)) s++;
  if (d.protein) s++;
  if ((d.water ?? 0) >= WATER_GOAL) s++;
  if ((d.sleep ?? 0) >= SLEEP_GOAL) s++;
  return s;
}

export function statusText(s: number, max: number) {
  if (s === max) return '⭐ PERFECT DAY. Flawless. Your sensei is proud. Oss! ⭐';
  if (max - s === 1) return "One more and it's a PERFECT DAY. Go go go! ⚡";
  if (s === 0) return "Fresh day. Fresh start. Let's get it. 🌅";
  if (s === 1) return 'One down! The momentum has begun. 🔥';
  if (s === 2) return 'Two quests done. Keep stacking. 🧱';
  return "Over halfway through today's quests. Don't stop now. 💪";
}

export function phraseFor(n: number) {
  if (n < 1) return { text: n === 0 ? 'Tomorrow it begins. Stock up on protein, fruit and water. Rest up. 🌙' : 'The Winter Arc begins Monday. Enjoy your last weekend as a civilian. 🫡', emoji: '⏳' };
  return PHRASES[Math.min(n, TOTAL_DAYS) - 1];
}

export const weekOf = (n: number) => Math.min(Math.ceil(n / 7), 5);
export const weekRange = (w: number): [number, number] => { const a = (w - 1) * 7 + 1; return [a, Math.min(a + 6, TOTAL_DAYS)]; };

export function streak(days: Record<string, DietDay>, key: 'sugar' | 'gluten') {
  const t = Math.min(todayNum(), TOTAL_DAYS);
  if (t < 1) return 0;
  let n = days[dateOfDay(t)]?.[key] ? t : t - 1;
  const first = key === 'gluten' ? GLUTEN_FROM : 1;
  let c = 0;
  while (n >= first && days[dateOfDay(n)]?.[key]) { c++; n--; }
  return c;
}

export function trainedInWeek(days: Record<string, DietDay>, w: number) {
  const [a, b] = weekRange(w);
  let gym = 0, karate = 0, trained = 0;
  for (let n = a; n <= b; n++) {
    const d = days[dateOfDay(n)];
    if (!d) continue;
    if (d.gym) gym++;
    if (d.karate) karate++;
    if (d.gym || d.karate) trained++;
  }
  return { gym, karate, trained };
}

export const dietActive = () => { const t = todayNum(); return t >= 1 && t <= TOTAL_DAYS; };
export { keyOf };
