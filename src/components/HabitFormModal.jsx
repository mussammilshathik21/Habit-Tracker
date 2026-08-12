import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_COLOR, cx } from "../lib/utils";

const COLORS = [
  "#34d399", "#fb923c", "#a78bfa", "#38bdf8", "#fbbf24", "#f472b6", "#94a3b8",
  "#f87171", "#60a5fa", "#facc15", "#4ade80", "#c084fc",
];

const ICONS = [
  "✨", "🏃", "💪", "🧘", "📚", "💻", "💧", "🥗", "🚭", "🎨", "🎯", "💰",
  "😴", "🧹", "📝", "🎵", "🚶", "📖", "🎧", "🖊️", "🌿", "☀️", "❤️", "🔥",
  "⭐", "🎮", "🚴", "🍎", "🧠", "🙏",
];

const DEFAULTS = { name: "", emoji: "✨", category: "Health", frequency: "Daily", color: "#34d399" };

function IconPicker({ value, onChange }) {
  const visible = 7;
  const [start, setStart] = useState(() => {
    const idx = ICONS.indexOf(value);
    return idx >= 0 ? Math.max(0, Math.min(idx - 3, ICONS.length - visible)) : 0;
  });
  const canPrev = start > 0;
  const canNext = start + visible < ICONS.length;

  return (
    <div className="icon-picker">
      <button type="button" className="icon-picker-arrow" onClick={() => setStart((s) => Math.max(0, s - visible))} disabled={!canPrev}>
        <ChevronLeft size={16} />
      </button>
      <div className="icon-picker-track">
        {ICONS.slice(start, start + visible).map((ic) => (
          <button
            type="button"
            key={ic}
            onClick={() => onChange(ic)}
            className={cx("icon-picker-item", value === ic && "selected")}
          >
            {ic}
          </button>
        ))}
      </div>
      <button type="button" className="icon-picker-arrow" onClick={() => setStart((s) => Math.min(ICONS.length - visible, s + visible))} disabled={!canNext}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function HabitFormModal({ open, onClose, onSave, initial }) {
  const { register, handleSubmit, watch, setValue, reset } = useForm({ defaultValues: DEFAULTS });

  useEffect(() => {
    reset(initial ? { name: initial.name, emoji: initial.emoji, category: initial.category, frequency: initial.frequency, color: initial.color } : DEFAULTS);
  }, [initial, open, reset]);

  if (!open) return null;
  const color = watch("color");
  const emoji = watch("emoji");

  const submit = (values) => {
    onSave(initial?.id ? { ...values, id: initial.id } : values);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onSubmit={handleSubmit(submit)} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? "Edit habit" : "New habit"}</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </div>

        <input type="hidden" {...register("emoji")} />

        <div className="form-field">
          <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Icon</label>
          <IconPicker value={emoji} onChange={(ic) => setValue("emoji", ic)} />
        </div>

        <input {...register("name", { required: true })} placeholder="Habit name" className="text-input form-field" />

        <select {...register("category")} className="select-input form-field">
          {Object.keys(CATEGORY_COLOR).map((c) => <option key={c}>{c}</option>)}
        </select>

        <select {...register("frequency")} className="select-input form-field">
          {["Daily", "Weekly", "Monthly", "Custom"].map((f) => <option key={f}>{f}</option>)}
        </select>

        <div className="color-swatches">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setValue("color", c)}
              className={cx("color-swatch", color === c && "selected")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-block">Save habit</button>
      </form>
    </div>
  );
}
