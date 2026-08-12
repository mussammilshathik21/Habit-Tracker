import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";
import Card from "../components/Card";
import { useHabits } from "../hooks/useHabits";
import { useNow } from "../hooks/useNow";
import { CATEGORY_COLOR, daysInMonth, dateKey, MONTH_NAMES, currentStreak, longestStreak, dayStatus } from "../lib/utils";

const FALLBACK_COLORS = ["#34d399", "#fb923c", "#a78bfa", "#38bdf8", "#fbbf24", "#f472b6", "#94a3b8", "#f87171", "#60a5fa", "#facc15"];

export default function Statistics() {
  const { year, month } = useOutletContext();
  const { activeHabits } = useHabits();
  const now = useNow(30000);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const dim = daysInMonth(year, month);
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const rows = activeHabits
    .map((h) => {
      const completed = Object.values(h.logs).filter(Boolean).length;
      const goal = h.frequency === "Daily" ? dim : h.target_days;
      return {
        id: h.id, name: h.name, emoji: h.emoji, category: h.category,
        goal, completed, remaining: Math.max(0, goal - completed),
        pct: goal ? Math.round((completed / goal) * 100) : 0,
        cur: currentStreak(h.logs, year, month, Math.min(now.getDate(), dim), now),
        longest: longestStreak(h.logs),
      };
    })
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) && (cat === "All" || r.category === cat))
    .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir);

  const cols = [
    ["name", "Habit"], ["goal", "Goal"], ["completed", "Completed"], ["remaining", "Remaining"],
    ["pct", "Completion %"], ["cur", "Current Streak"], ["longest", "Longest Streak"],
  ];

  // ------------------------------------------------------------------
  // Everything below here mirrors the chart logic that used to live on
  // the Dashboard — moved here so Dashboard stays just the tracker.
  // ------------------------------------------------------------------

  const trackingStart = useMemo(() => {
    const starts = activeHabits.map((h) => h.createdAt).filter(Boolean).sort();
    return starts[0] || dateKey(year, month, 1);
  }, [activeHabits, year, month]);

  const trackingStartDate = useMemo(
    () => new Date(Number(trackingStart.slice(0, 4)), Number(trackingStart.slice(5, 7)) - 1, Number(trackingStart.slice(8, 10))),
    [trackingStart]
  );

  const globalWeekIndex = (y, m, d) => {
    const diffDays = Math.round((new Date(y, m, d) - trackingStartDate) / 86400000);
    return Math.floor(diffDays / 7) + 1;
  };

  const weekChunks = useMemo(() => {
    const chunks = [];
    let current = null;
    for (let d = 1; d <= dim; d++) {
      if (dateKey(year, month, d) < trackingStart) continue;
      const idx = globalWeekIndex(year, month, d);
      if (!current || current.index !== idx) {
        current = { index: idx, days: [] };
        chunks.push(current);
      }
      current.days.push(d);
    }
    return chunks;
  }, [dim, year, month, trackingStart, trackingStartDate]);

  const resolvedRate = (habitsList, y, m, day) => {
    let done = 0, resolved = 0;
    habitsList.forEach((h) => {
      const st = dayStatus(h.logs, y, m, day, now, h.createdAt);
      if (st === "done" || st === "missed") {
        resolved++;
        if (st === "done") done++;
      }
    });
    return { done, resolved, rate: resolved ? Math.round((done / resolved) * 100) : null };
  };

  const dailyData = useMemo(() => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const chunk = isCurrentMonth
      ? weekChunks.find((c) => c.days.includes(now.getDate())) || weekChunks[weekChunks.length - 1]
      : weekChunks[weekChunks.length - 1];
    if (!chunk) return [];
    return chunk.days
      .filter((d) => dateKey(year, month, d) <= todayKey)
      .map((d) => {
        const { rate } = resolvedRate(activeHabits, year, month, d);
        const label = new Date(year, month, d).toLocaleDateString(undefined, { weekday: "short" });
        return { day: label, rate: rate ?? 0 };
      });
  }, [activeHabits, year, month, now, weekChunks, todayKey]);

  const weeklyData = weekChunks.map((c) => {
    let done = 0, resolved = 0;
    c.days.forEach((d) => {
      const r = resolvedRate(activeHabits, year, month, d);
      done += r.done; resolved += r.resolved;
    });
    return { week: `W${c.index}`, rate: resolved ? Math.round((done / resolved) * 100) : 0 };
  });

  const totalCompletions = activeHabits.reduce((s, h) => s + Object.values(h.logs).filter(Boolean).length, 0);
  const possible = activeHabits.reduce((s, h) => s + Object.keys(h.logs).length, 0) || 1;
  const overallRate = Math.round((totalCompletions / possible) * 100);

  const yearlyData = useMemo(() => {
    const out = [];
    let y = trackingStartDate.getFullYear();
    let m = trackingStartDate.getMonth();
    while (y < year || (y === year && m <= month)) {
      const dim2 = daysInMonth(y, m);
      let done = 0, resolved = 0;
      activeHabits.forEach((h) => {
        for (let d = 1; d <= dim2; d++) {
          const st = dayStatus(h.logs, y, m, d, now, h.createdAt);
          if (st === "done" || st === "missed") {
            resolved++;
            if (st === "done") done++;
          }
        }
      });
      out.push({
        month: MONTH_NAMES[m].slice(0, 3) + (y !== year ? ` '${String(y).slice(2)}` : ""),
        rate: resolved ? Math.round((done / resolved) * 100) : 0,
      });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return out;
  }, [activeHabits, trackingStartDate, year, month, now]);

  const pieData = activeHabits.map((h, i) => ({
    name: h.name,
    emoji: h.emoji,
    value: Object.values(h.logs).filter(Boolean).length || 1,
    color: h.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));
  const pieTotal = pieData.reduce((s, p) => s + p.value, 0) || 1;

  const streakData = activeHabits.map((h) => ({
    name: h.name,
    emoji: h.emoji,
    streak: currentStreak(h.logs, year, month, Math.min(now.getDate(), dim), now),
  }));

  const momentumData = useMemo(() => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const lastDay = isCurrentMonth ? now.getDate() : dim;
    const firstDay = trackingStart.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`
      ? Number(trackingStart.slice(8, 10))
      : 1;
    let value = 0;
    const out = [];
    for (let day = firstDay; day <= lastDay; day++) {
      let delta = 0, active = 0;
      activeHabits.forEach((h) => {
        const st = dayStatus(h.logs, year, month, day, now, h.createdAt);
        if (st === "inactive") return;
        active += 1;
        if (st === "done") delta += 1;
        else if (st === "missed") delta -= 1;
      });
      value += active ? delta / active : 0;
      out.push({ day, value });
    }
    return out;
  }, [activeHabits, year, month, now, dim, trackingStart]);
  const momentumUp = momentumData.length < 2 || momentumData[momentumData.length - 1].value >= momentumData[0].value;

  return (
    <div className="page stack">
      <h1 className="title-lg">Statistics</h1>

      <div className="filters-row">
        <div className="search-wrap" style={{ maxWidth: 220 }}>
          <Search size={14} />
          <input className="text-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." />
        </div>
        <select className="select-input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>All</option>
          {Object.keys(CATEGORY_COLOR).map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <Card className="table-wrap">
        <table>
          <thead>
            <tr>
              {cols.map(([k, label]) => (
                <th key={k} onClick={() => { setSortKey(k); setSortDir((d) => (sortKey === k ? -d : 1)); }}>
                  <span>{label}<ArrowUpDown size={11} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.emoji} {r.name}</td>
                <td>{r.goal}</td>
                <td>{r.completed}</td>
                <td>{r.remaining}</td>
                <td>{r.pct}%</td>
                <td>{r.cur} 🔥</td>
                <td>{r.longest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid-2">
        <Card className="chart-card">
          <div className="flex items-center justify-between mb-3" style={{ marginBottom: 4 }}>
            <h3 className="chart-title" style={{ marginBottom: 0 }}>Momentum</h3>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: momentumUp ? "var(--state-done)" : "var(--state-missed)" }}>
              {momentumUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </span>
          </div>
          <p className="text-xs text-sub2" style={{ marginBottom: 8 }}>
            Since {trackingStartDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={momentumData}>
              <defs>
                <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={momentumUp ? "var(--state-done)" : "var(--state-missed)"} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={momentumUp ? "var(--state-done)" : "var(--state-missed)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={momentumUp ? "var(--state-done)" : "var(--state-missed)"} strokeWidth={2.5} fill="url(#momentumFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="chart-title">Daily progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} fill="#111827" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="chart-title">Weekly progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="chart-title">Yearly trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8884" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="chart-title">Habit distribution</h3>
          <div className="flex items-center gap-4" style={{ flexWrap: "wrap" }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="stack" style={{ gap: 6, flex: 1, minWidth: 140 }}>
              {pieData.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: e.color, display: "inline-block", flexShrink: 0 }} />
                    <span>{e.emoji} {e.name}</span>
                  </span>
                  <span className="text-sub2 font-medium">{Math.round((e.value / pieTotal) * 100)}%</span>
                </div>
              ))}
              {pieData.length === 0 && <span className="text-xs text-sub2">No habits yet</span>}
            </div>
          </div>
        </Card>

        <Card className="chart-card">
          <h3 className="chart-title">Overall completion</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{ name: "Done", value: overallRate }, { name: "Left", value: 100 - overallRate }]} dataKey="value" innerRadius={55} outerRadius={78} startAngle={90} endAngle={-270}>
                <Cell fill="#111827" />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="center-text" style={{ marginTop: -128, marginBottom: 96, fontSize: 24, fontWeight: 700 }}>{overallRate}%</div>
        </Card>

        <Card className="chart-card">
          <h3 className="chart-title">Current streaks</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, streakData.length * 34)}>
            <BarChart data={streakData} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v} days`, "Streak"]} />
              <Bar dataKey="streak" radius={[0, 6, 6, 0]} fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
