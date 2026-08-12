import { useState } from "react";
import { Flame, MoreHorizontal, Trash2 } from "lucide-react";
import AnimatedCheckbox from "./AnimatedCheckbox";
import { cx, currentStreak, dayStatusByKey } from "../lib/utils";
import { useDragScroll } from "../hooks/useDragScroll";

export default function HabitRow({ habit, weeks, now, todayKey, endKey, onToggle, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { ref, dragHandlers } = useDragScroll();
  const streak = currentStreak(habit.logs, now.getFullYear(), now.getMonth(), now.getDate(), now);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirming(false);
  };

  const handleDeleteClick = () => {
    if (confirming) {
      onDelete(habit.id);
    } else {
      setConfirming(true);
    }
  };

  return (
    <div className="habit-row">
      <div className="habit-info">
        <div className="habit-icon" style={{ backgroundColor: habit.color + "22" }}>
          <span>{habit.emoji}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="habit-name">
            {habit.name}
            {streak > 2 && (
              <span className="habit-streak">
                <Flame size={11} />
                {streak}
              </span>
            )}
          </div>
          <div className="habit-meta">
            <span className="dot" style={{ backgroundColor: habit.color }} />
            {habit.category} · {habit.frequency}
          </div>
        </div>

        <button className={cx("row-menu-btn", menuOpen && "force-visible")} onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}>
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div className="row-menu">
            {!confirming ? (
              <button onClick={handleDeleteClick} style={{ color: "var(--state-missed)" }}>
                <Trash2 size={12} /> Delete
              </button>
            ) : (
              <button onClick={handleDeleteClick} className="row-menu-confirm">
                <Trash2 size={12} /> Confirm delete?
              </button>
            )}
          </div>
        )}
      </div>

      <div className="week-days" ref={ref} {...dragHandlers}>
        {weeks.map((week, wi) => {
          const visibleDays = week.filter((k) => (!habit.createdAt || k >= habit.createdAt) && k <= endKey);
          if (visibleDays.length === 0) return null;
          return (
            <div key={wi} className="week-block">
              {visibleDays.map((k) => {
                const state = dayStatusByKey(habit.logs, k, todayKey, habit.createdAt);
                return (
                  <AnimatedCheckbox
                    key={k}
                    size={28}
                    state={state}
                    onToggle={() => k === todayKey && onToggle(habit.id, k)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
