import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import Card from "../components/Card";
import WeekHeader from "../components/WeekHeader";
import HabitRow from "../components/HabitRow";
import HabitFormModal from "../components/HabitFormModal";
import { useHabits } from "../hooks/useHabits";
import { useNow } from "../hooks/useNow";
import { dateKey, keyRange, addDaysToKey, daysBetweenKeys } from "../lib/utils";
import { QUOTES } from "../lib/quotes";

function quoteOfTheDay(now) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// A habit's row keeps extending day by day forever (no cutoff at the 30th/31st
// of a month) as long as it's still active. If it's gone a full month with
// zero completions, the row stops growing further instead of trailing off
// into an ever-longer wall of red — frozen 30 days past its last check-in.
const STALE_AFTER_DAYS = 30;

export default function Dashboard() {
  const { search } = useOutletContext();
  const { habits, addHabit, removeHabit, toggleDay } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);
  const now = useNow(30000); // ticks every 30s — enough to catch the midnight lock rollover
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const filtered = habits.filter((h) => !h.archived && h.name.toLowerCase().includes(search.toLowerCase()));

  // Per-habit end date: today, unless it's been stale for a month — then frozen.
  const endKeyFor = (habit) => {
    const doneDates = Object.keys(habit.logs).filter((k) => habit.logs[k]).sort();
    const lastDone = doneDates.length ? doneDates[doneDates.length - 1] : habit.createdAt;
    if (!lastDone) return todayKey;
    const idle = daysBetweenKeys(lastDone, todayKey);
    return idle >= STALE_AFTER_DAYS ? addDaysToKey(lastDone, STALE_AFTER_DAYS) : todayKey;
  };

  const globalStart = useMemo(() => {
    const starts = filtered.map((h) => h.createdAt).filter(Boolean).sort();
    return starts[0] || todayKey;
  }, [filtered, todayKey]);

  const globalEnd = useMemo(() => {
    const ends = filtered.map(endKeyFor).sort();
    return ends.length ? ends[ends.length - 1] : todayKey;
  }, [filtered, todayKey]);

  const weeks = useMemo(() => {
    const all = keyRange(globalStart, globalEnd);
    const chunks = [];
    for (let i = 0; i < all.length; i += 7) chunks.push(all.slice(i, i + 7));
    return chunks;
  }, [globalStart, globalEnd]);

  return (
    <div className="page stack">
      <div className="page-header-row">
        <div>
          <h1 className="quote-heading">{quoteOfTheDay(now)}</h1>
          <p className="text-sm text-sub mt-1">{filtered.length} active habits</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New habit
        </button>
      </div>

      <Card className="page habit-tracker-card" style={{ padding: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="title-sm">Habit tracker</h2>
          <span className="text-xs text-sub2">Click a cell to mark complete</span>
        </div>
        <WeekHeader weeks={weeks} />
        <div>
          {filtered.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              weeks={weeks}
              now={now}
              todayKey={todayKey}
              endKey={endKeyFor(h)}
              onToggle={toggleDay}
              onDelete={removeHabit}
            />
          ))}
          {filtered.length === 0 && <p className="text-sm text-sub2 center-text py-6">No habits yet — add your first one above.</p>}
        </div>
      </Card>

      <HabitFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addHabit}
        initial={null}
      />
    </div>
  );
}
