import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Card from "../components/Card";
import DayModal from "../components/DayModal";
import { useHabits } from "../hooks/useHabits";
import { useDayLogStore } from "../store/useSettingsStore";
import { daysInMonth, dateKey, WEEKDAYS, MOODS, cx } from "../lib/utils";

export default function CalendarPage() {
  const { year, month } = useOutletContext();
  const { habits } = useHabits();
  const dayLogs = useDayLogStore((s) => s.dayLogs);
  const [openDay, setOpenDay] = useState(null);

  const dim = daysInMonth(year, month);
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  return (
    <div className="page stack">
      <h1 className="title-lg">Calendar</h1>
      <Card style={{ padding: 24 }}>
        <div className="calendar-weekdays">
          {WEEKDAYS.map((w) => <div key={w} className="calendar-weekday">{w}</div>)}
        </div>
        <div className="calendar-grid">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const k = dateKey(year, month, day);
            const done = habits.filter((h) => !h.archived && h.logs[k]).length;
            const total = habits.filter((h) => !h.archived).length;
            const mood = dayLogs[k]?.mood;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <button key={i} onClick={() => setOpenDay(k)} className={cx("calendar-cell", isToday && "today")}>
                <span className="calendar-cell-day">{day}</span>
                <div className="calendar-cell-meta">
                  {total > 0 && <span className="chip">{done}/{total}</span>}
                  {mood && <span className="text-xs">{MOODS.find((m) => m.v === mood)?.e}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <DayModal open={!!openDay} onClose={() => setOpenDay(null)} dateStr={openDay} habits={habits} />
    </div>
  );
}
