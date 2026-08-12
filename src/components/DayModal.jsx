import { useEffect, useState } from "react";
import { X, BedDouble } from "lucide-react";
import { MOODS, cx } from "../lib/utils";
import { useDayLogStore } from "../store/useSettingsStore";

export default function DayModal({ open, onClose, dateStr, habits }) {
  const dayLog = useDayLogStore((s) => (dateStr ? s.dayLogs[dateStr] : null)) || { mood: null, sleep: "", notes: "" };
  const updateDay = useDayLogStore((s) => s.updateDay);

  const [notes, setNotes] = useState(dayLog.notes || "");

  useEffect(() => {
    setNotes(dayLog.notes || "");
  }, [dateStr]);

  if (!open || !dateStr) return null;

  const completed = habits.filter((h) => h.logs[dateStr]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dateStr}</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>

        <div className="stack">
          <div>
            <div className="text-xs text-sub2 mb-2">Completed habits</div>
            {completed.length ? (
              completed.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm" style={{ padding: "4px 0" }}>
                  <span>{h.emoji}</span>{h.name}
                </div>
              ))
            ) : (
              <div className="text-sm text-sub2">Nothing logged this day</div>
            )}
          </div>

          <div>
            <div className="text-xs text-sub2 mb-2">Mood</div>
            <div className="mood-row">
              {MOODS.map((m) => (
                <button
                  key={m.v}
                  onClick={() => updateDay(dateStr, { mood: m.v })}
                  className={cx("mood-btn", dayLog.mood === m.v && "selected")}
                >
                  {m.e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-sub2 mb-2 flex items-center gap-1"><BedDouble size={12} /> Sleep (hours)</div>
            <input
              type="number"
              step="0.5"
              className="text-input w-full"
              value={dayLog.sleep ?? ""}
              onChange={(e) => updateDay(dateStr, { sleep: e.target.value })}
              placeholder="7.5"
            />
          </div>

          <div>
            <div className="text-xs text-sub2 mb-2">Notes / Journal</div>
            <textarea
              className="text-input w-full"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => updateDay(dateStr, { notes })}
              placeholder="How did today go?"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
