import { useNow } from "../hooks/useNow";
import { cx } from "../lib/utils";

function msUntilMidnight(now) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return end - now;
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LiveClock() {
  const now = useNow(1000);
  const remaining = msUntilMidnight(now);
  const urgent = remaining < 60 * 60 * 1000; // under 1 hour left

  return (
    <div className="live-clock-wrap">
      <div className="live-clock">
        <span className="dot-live" />
        {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className={cx("day-deadline", urgent && "urgent")} title="Time left to complete today's habits">
        ⏳ {formatCountdown(remaining)} left today
      </div>
    </div>
  );
}
