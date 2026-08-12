import { dateKey, daysInMonth } from "./utils";

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Generates a handful of starter habits with plausible history, so the app isn't empty on first run. */
export function seedHabits() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const defs = [
    { name: "Morning Run", emoji: "🏃", category: "Fitness", frequency: "Daily", target_days: daysInMonth(year, month), color: "#fb923c", seed: 11 },
    { name: "Read 20 pages", emoji: "📚", category: "Learning", frequency: "Daily", target_days: daysInMonth(year, month), color: "#fbbf24", seed: 22 },
    { name: "Meditate", emoji: "🧘", category: "Mind", frequency: "Daily", target_days: daysInMonth(year, month), color: "#a78bfa", seed: 33 },
    { name: "Deep Work Block", emoji: "💻", category: "Work", frequency: "Weekly", target_days: 20, color: "#38bdf8", seed: 44 },
    { name: "Drink Water 2L", emoji: "💧", category: "Health", frequency: "Daily", target_days: daysInMonth(year, month), color: "#34d399", seed: 55 },
    { name: "No Sugar", emoji: "🍬", category: "Health", frequency: "Custom", target_days: 15, color: "#f472b6", seed: 66 },
  ];

  return defs.map((d, i) => {
    const rnd = seededRandom(d.seed);
    const logs = {};
    for (let day = 1; day <= daysInMonth(year, month); day++) {
      if (new Date(year, month, day) > now) continue;
      logs[dateKey(year, month, day)] = rnd() > 0.32;
    }
    return {
      id: `seed-${i}`,
      name: d.name,
      emoji: d.emoji,
      category: d.category,
      frequency: d.frequency,
      target_days: d.target_days,
      color: d.color,
      logs,
      archived: false,
      sortOrder: i,
      createdAt: dateKey(year, month, 1),
    };
  });
}
