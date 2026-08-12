export function cx(...args) {
  return args.filter(Boolean).join(" ");
}

/** Collision-proof id — Date.now() alone can repeat if two items are created
 *  in the same millisecond, which was silently merging unrelated habits. */
export const uid = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const pad = (n) => String(n).padStart(2, "0");

export const dateKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

/** Parse a "YYYY-MM-DD" key into a local Date (midnight). */
export function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateKeyFromDate(d) {
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDaysToKey(key, n) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return dateKeyFromDate(d);
}

export function daysBetweenKeys(a, b) {
  return Math.round((parseDateKey(b) - parseDateKey(a)) / 86400000);
}

/** Inclusive list of "YYYY-MM-DD" keys from startKey to endKey, crossing month/year boundaries freely. */
export function keyRange(startKey, endKey) {
  const out = [];
  const cur = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  while (cur <= end) {
    out.push(dateKeyFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Same day-state logic as dayStatus, but keyed by date string instead of
 *  year/month/day — used by the continuous (cross-month) tracker view. */
export function dayStatusByKey(logs, key, todayKey, createdAt = null) {
  if (createdAt && key < createdAt) return "inactive";
  if (key > todayKey) return "future";
  if (logs[key]) return "done";
  return key === todayKey ? "pending" : "missed";
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const CATEGORY_COLOR = {
  Health: "#34d399",
  Fitness: "#fb923c",
  Mind: "#a78bfa",
  Work: "#38bdf8",
  Learning: "#fbbf24",
  Other: "#94a3b8",
};

export const MOODS = [
  { v: 5, e: "😀", label: "Great" },
  { v: 4, e: "🙂", label: "Good" },
  { v: 3, e: "😐", label: "Okay" },
  { v: 2, e: "😔", label: "Low" },
  { v: 1, e: "😭", label: "Rough" },
];

/**
 * A day's tracking state, driven by the live clock rather than a static snapshot:
 *  - "inactive" → before the habit existed (createdAt), nothing to show
 *  - "future"   → date hasn't happened yet, locked
 *  - "pending"  → it's today and not logged yet (yellow)
 *  - "done"     → logged complete, green (today or locked-in past)
 *  - "missed"   → day is over and it was never logged, red (permanently locked)
 */
export function dayStatus(logs, year, month, day, now = new Date(), createdAt = null) {
  const k = dateKey(year, month, day);
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  if (createdAt && k < createdAt) return "inactive";
  if (k > todayKey) return "future";
  if (logs[k]) return "done";
  return k === todayKey ? "pending" : "missed";
}

/** Current streak ending at (or before) the given day, walking backwards.
 *  If `now` is passed and the most recent day is today-and-unlogged, that day
 *  is skipped rather than treated as a break, since it isn't locked in yet. */
export function currentStreak(logs, year, month, upToDay, now = null) {
  let streak = 0;
  let d = upToDay, m = month, y = year;
  const todayKey = now ? dateKey(now.getFullYear(), now.getMonth(), now.getDate()) : null;
  let first = true;
  while (streak < 400) {
    const k = dateKey(y, m, d);
    if (logs[k]) {
      streak++;
    } else if (first && k === todayKey) {
      // today isn't over yet — don't count it as a break
    } else {
      break;
    }
    first = false;
    d--;
    if (d < 1) {
      m--;
      if (m < 0) { m = 11; y--; }
      d = daysInMonth(y, m);
    }
  }
  return streak;
}

export function longestStreak(logs) {
  const keys = Object.keys(logs).sort();
  let best = 0, cur = 0, prevDate = null;
  for (const k of keys) {
    if (!logs[k]) { cur = 0; prevDate = null; continue; }
    const d = new Date(k);
    cur = prevDate && (d - prevDate) / 86400000 === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prevDate = d;
  }
  return best;
}
