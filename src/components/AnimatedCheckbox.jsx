import { Check, X } from "lucide-react";
import { cx } from "../lib/utils";

/** state: "inactive" | "pending" | "done" | "missed" | "future" */
export default function AnimatedCheckbox({ state = "pending", onToggle, size = 32 }) {
  const editable = state === "pending" || state === "done";

  return (
    <button
      onClick={editable ? onToggle : undefined}
      disabled={!editable}
      aria-pressed={state === "done"}
      title={
        state === "done" ? "Completed" :
        state === "missed" ? "Day ended without logging — locked" :
        state === "future" ? "Not open yet" :
        state === "inactive" ? "Habit didn't exist yet" :
        "Today — tap to mark done"
      }
      onKeyDown={(e) => {
        if (editable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{ width: size, height: size }}
      className={cx("checkbox", `state-${state}`)}
    >
      {state === "done" && <Check size={16} strokeWidth={3} />}
      {state === "missed" && <X size={14} strokeWidth={3} />}
    </button>
  );
}
