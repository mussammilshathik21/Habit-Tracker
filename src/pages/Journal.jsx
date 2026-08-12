import { useEffect, useRef, useState } from "react";
import { Plus, Save } from "lucide-react";
import Card from "../components/Card";
import { useJournalStore } from "../store/useSettingsStore";
import { cx } from "../lib/utils";

export default function Journal() {
  const entries = useJournalStore((s) => s.entries);
  const addEntry = useJournalStore((s) => s.addEntry);
  const updateEntry = useJournalStore((s) => s.updateEntry);

  const [activeId, setActiveId] = useState(entries[0]?.id ?? null);
  const [content, setContent] = useState(entries[0]?.content ?? "");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef();

  useEffect(() => {
    const active = entries.find((e) => e.id === activeId);
    setContent(active?.content ?? "");
  }, [activeId]);

  const onChange = (value) => {
    setContent(value);
    setSaving(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateEntry(activeId, value);
      setSaving(false);
    }, 500);
  };

  const newEntry = () => {
    const id = addEntry();
    setActiveId(id);
  };

  return (
    <div className="page stack">
      <div className="flex items-center justify-between">
        <h1 className="title-lg">Journal</h1>
        <button className="btn btn-primary btn-sm" onClick={newEntry}>
          <Plus size={14} /> New entry
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        <Card style={{ padding: 8, height: "fit-content" }}>
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => setActiveId(e.id)}
              className="w-full text-sm"
              style={{
                textAlign: "left", padding: "8px 12px", borderRadius: 10, marginBottom: 4, border: "none",
                background: activeId === e.id ? "var(--active-nav-bg)" : "transparent",
                color: activeId === e.id ? "var(--active-nav-text)" : "var(--idle-nav-text)",
              }}
            >
              {e.date}
            </button>
          ))}
        </Card>
        <Card style={{ padding: 16 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sub2">Markdown supported</span>
            <span className={cx("text-xs flex items-center gap-1")} style={{ color: saving ? "#10b981" : "var(--text-sub2)" }}>
              <Save size={12} /> {saving ? "Saving..." : "Saved"}
            </span>
          </div>
          <textarea
            className="text-input w-full"
            style={{ fontFamily: "monospace" }}
            rows={16}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write today's thoughts..."
          />
          <p className="text-xs text-sub2 mt-1">Image upload attaches here once a backend/storage is connected.</p>
        </Card>
      </div>
    </div>
  );
}
