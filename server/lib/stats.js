export const POINTS = { Easy: 10, Medium: 20, Hard: 40 };
export function todayIn(timezone = "Asia/Kolkata", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function shiftDate(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function calculateStats(problems, today) {
  const days = [...new Set(problems.map((p) => p.solvedDate))].sort();
  let longest = 0,
    run = 0,
    previous;
  for (const day of days) {
    run = previous && shiftDate(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  const daySet = new Set(days);
  let current = 0,
    cursor = daySet.has(today) ? today : shiftDate(today, -1);
  while (daySet.has(cursor)) {
    current++;
    cursor = shiftDate(cursor, -1);
  }
  const difficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const topics = {},
    counts = {};
  let points = 0;
  for (const p of problems) {
    difficulty[p.difficulty]++;
    points += POINTS[p.difficulty];
    topics[p.topic] = (topics[p.topic] || 0) + 1;
    counts[p.solvedDate] = (counts[p.solvedDate] || 0) + 1;
  }
  const badges = [
    {
      name: "First step",
      description: "Log your first problem",
      earned: problems.length >= 1,
    },
    {
      name: "Getting started",
      description: "Solve 10 problems",
      earned: problems.length >= 10,
    },
    {
      name: "Half century",
      description: "Solve 50 problems",
      earned: problems.length >= 50,
    },
    {
      name: "Consistent coder",
      description: "Reach a 7-day streak",
      earned: longest >= 7,
    },
    {
      name: "Challenge accepted",
      description: "Solve a hard problem",
      earned: difficulty.Hard >= 1,
    },
    {
      name: "Point collector",
      description: "Earn 1,000 points",
      earned: points >= 1000,
    },
  ];
  const activity = Array.from({ length: 84 }, (_, i) => {
    const date = shiftDate(today, i - 83);
    return { date, count: counts[date] || 0 };
  });
  return {
    total: problems.length,
    points,
    currentStreak: current,
    longestStreak: longest,
    difficulty,
    topics,
    badges,
    activity,
    todayCount: counts[today] || 0,
  };
}
