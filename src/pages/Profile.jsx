import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, Check, Download, Upload, FileText, Sparkles, Camera, X, KeyRound } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Card from "../components/Card";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme, THEME_OPTIONS } from "../hooks/useTheme";
import { useHabitStore } from "../store/useHabitStore";
import { useDayLogStore, useJournalStore } from "../store/useSettingsStore";
import { currentStreak, daysInMonth, dateKey } from "../lib/utils";
import { supabase } from "../lib/supabaseClient";

export default function Profile() {
  const user = useAuthStore((s) => s.currentUser());
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [form, setForm] = useState(user?.profile || {});
  const [saved, setSaved] = useState(false);
  const photoRef = useRef(null);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null); // { ok, text }

  const { theme, setTheme } = useTheme();

  const habits = useHabitStore((s) => s.habits);
  const importHabits = useHabitStore((s) => s.importHabits);
  const dayLogs = useDayLogStore((s) => s.dayLogs);
  const journalEntries = useJournalStore((s) => s.entries);
  const fileRef = useRef(null);

  if (!user) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const onSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setForm((f) => ({ ...f, avatar_image: dataUrl }));
      await updateProfile({ avatar_image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    setForm((f) => ({ ...f, avatar_image: null }));
    await updateProfile({ avatar_image: null });
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    const res = await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
    if (!res.ok) {
      setPwMsg({ ok: false, text: res.error });
    } else {
      setPwMsg({ ok: true, text: "Password updated." });
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwMsg(null), 2500);
    }
  };

  const doExportJson = () => {
    const data = { habits, dayLogs, journalEntries, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "habit-tracker-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doExportPdf = () => {
    const now = new Date();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 54;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Habitus", marginX, y);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110);
    doc.text("Habit Tracking Report", marginX, y + 16);
    doc.setTextColor(160);
    doc.setFontSize(9);
    doc.text(`Generated ${now.toLocaleString()}`, pageWidth - marginX, y, { align: "right" });
    doc.setTextColor(0);
    y += 34;
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 22;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Account", marginX, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(140);
    doc.text("Name", marginX, y);
    doc.setTextColor(0);
    doc.text(String(user?.profile?.name || "-"), marginX + 60, y);
    doc.setTextColor(140);
    doc.text("Email", marginX + 260, y);
    doc.setTextColor(0);
    doc.text(String(user?.email || "-"), marginX + 260 + 45, y);
    y += 26;

    const activeHabits = habits.filter((h) => !h.archived);
    const totalCompletions = habits.reduce((s, h) => s + Object.values(h.logs).filter(Boolean).length, 0);
    const totalLogged = habits.reduce((s, h) => s + Object.keys(h.logs).length, 0) || 1;
    const overallRate = Math.round((totalCompletions / totalLogged) * 100);
    const earliest = habits.map((h) => h.createdAt).filter(Boolean).sort()[0];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Summary", marginX, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const summaryLines = [
      ["Active habits", String(activeHabits.length)],
      ["Total habits", String(habits.length)],
      ["Overall completion rate", `${overallRate}%`],
      ["Tracking since", earliest || "-"],
    ];
    summaryLines.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      doc.setTextColor(140);
      doc.text(label, marginX + col * 260, y + row * 16);
      doc.setTextColor(0);
      doc.text(String(value), marginX + col * 260 + 130, y + row * 16);
    });
    y += Math.ceil(summaryLines.length / 2) * 16 + 20;

    const dim = daysInMonth(now.getFullYear(), now.getMonth());
    const rows = habits.map((h) => {
      const streak = currentStreak(h.logs, now.getFullYear(), now.getMonth(), Math.min(now.getDate(), dim), now);
      const total = Object.keys(h.logs).length;
      const done = Object.values(h.logs).filter(Boolean).length;
      const rate = total ? Math.round((done / total) * 100) : 0;
      return [
        h.name, h.category, h.frequency, h.createdAt || "-",
        `${done}/${total}`, `${rate}%`, `${streak}d`, h.archived ? "Archived" : "Active",
      ];
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Habits", marginX, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Habit", "Category", "Frequency", "Created", "Completed", "Rate", "Streak", "Status"]],
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 6, textColor: [30, 30, 30] },
      headStyles: { fillColor: [23, 23, 23], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: marginX, right: marginX },
    });

    y = doc.lastAutoTable.finalY + 30;
    const pageHeight = doc.internal.pageSize.getHeight();
    const ensureSpace = (needed) => {
      if (y + needed > pageHeight - 40) { doc.addPage(); y = 54; }
    };

    const calendarEntries = Object.entries(dayLogs || {})
      .filter(([, v]) => v && (v.notes || v.mood || v.sleep))
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (calendarEntries.length) {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text("Calendar", marginX, y);
      y += 20;

      calendarEntries.forEach(([date, v]) => {
        ensureSpace(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), marginX, y);
        y += 14;
        const metaBits = [];
        if (v.mood) metaBits.push(`Mood: ${v.mood}/5`);
        if (v.sleep) metaBits.push(`Sleep: ${v.sleep}h`);
        if (metaBits.length) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120);
          doc.text(metaBits.join("    "), marginX, y); y += 14;
        }
        if (v.notes) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(30);
          const lines = doc.splitTextToSize(v.notes, pageWidth - marginX * 2);
          lines.forEach((line) => { ensureSpace(14); doc.text(line, marginX, y); y += 14; });
        }
        y += 10;
        ensureSpace(4);
        doc.setDrawColor(235);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 16;
      });
    }

    const journalSorted = [...(journalEntries || [])]
      .filter((e) => e.content && e.content.trim())
      .sort((a, b) => a.date.localeCompare(b.date));

    if (journalSorted.length) {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text("Journal", marginX, y);
      y += 20;

      journalSorted.forEach((entry) => {
        ensureSpace(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(new Date(entry.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), marginX, y);
        y += 16;
        const plain = entry.content.replace(/^#+\s*/gm, "").replace(/\*\*/g, "").trim();
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(30);
        const lines = doc.splitTextToSize(plain, pageWidth - marginX * 2);
        lines.forEach((line) => { ensureSpace(14); doc.text(line, marginX, y); y += 14; });
        y += 10;
        ensureSpace(4);
        doc.setDrawColor(235);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 16;
      });
    }

    ensureSpace(20);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text("Generated by Habitus — local device data.", marginX, y);
    doc.save(`habitus-report-${dateKey(now.getFullYear(), now.getMonth(), now.getDate())}.pdf`);
  };

  const doImport = (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.habits) await importHabits(data.habits);
      } catch (err) {
        alert("Could not read that file — make sure it's a valid export.");
      }
    };
    reader.readAsText(file);
  };

  const deleteAllHabits = async () => {
    if (!confirm("This permanently deletes every habit in your account. Continue?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabase.from("habits").delete().eq("user_id", session.user.id);
    window.location.reload();
  };

  return (
    <div className="page stack max-w-2xl">
      <div className="page-header-row">
        <h1 className="title-lg">Profile</h1>
      </div>

      <Card className="chart-card">
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            <button type="button" className="profile-avatar-btn" onClick={() => photoRef.current?.click()} title="Change photo">
              {form.avatar_image
                ? <img src={form.avatar_image} alt="" />
                : <span>{form.name?.[0]?.toUpperCase() || form.email?.[0]?.toUpperCase() || "?"}</span>}
            </button>
            <button type="button" className="profile-avatar-camera" onClick={() => photoRef.current?.click()} title="Change photo">
              <Camera size={13} />
            </button>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhotoChange} />
          </div>
          <div className="profile-identity-info">
            <div className="font-semibold" style={{ fontSize: 16 }}>{form.name || "Unnamed"}</div>
            <div className="text-sm text-sub2">{form.email}</div>
            {form.avatar_image && (
              <button type="button" onClick={removePhoto} className="profile-remove-link">
                <X size={11} /> Remove photo
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card className="chart-card">
        <h3 className="title-sm mb-3">Personal details</h3>
        <form className="stack" style={{ gap: 12 }} onSubmit={onSave}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Full name</label>
              <input className="text-input w-full" value={form.name || ""} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Email</label>
              <input className="text-input w-full" value={form.email || ""} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Phone</label>
              <input className="text-input w-full" value={form.phone || ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 90000 00000" />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Date of birth</label>
              <input className="text-input w-full" type="date" value={form.dob || ""} onChange={(e) => set({ dob: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Height (cm)</label>
              <input className="text-input w-full" type="number" min="0" step="0.1" value={form.height || ""} onChange={(e) => set({ height: e.target.value })} placeholder="175" />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Weight (kg)</label>
              <input className="text-input w-full" type="number" min="0" step="0.1" value={form.weight || ""} onChange={(e) => set({ weight: e.target.value })} placeholder="70" />
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Location</label>
            <input className="text-input w-full" value={form.location || ""} onChange={(e) => set({ location: e.target.value })} placeholder="City, Country" />
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Bio</label>
            <textarea
              className="text-input w-full" rows={3} style={{ resize: "vertical", paddingTop: 8 }}
              value={form.bio || ""} onChange={(e) => set({ bio: e.target.value })}
              placeholder="A short line about what you're working on."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save changes"}
          </button>
        </form>
      </Card>

      <Card className="chart-card">
        <h3 className="title-sm mb-3 flex items-center gap-2"><KeyRound size={14} /> Change password</h3>
        <form className="stack" style={{ gap: 12 }} onSubmit={onChangePassword}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Current password</label>
            <input className="text-input w-full" type="password" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} required />
          </div>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>New password</label>
              <input className="text-input w-full" type="password" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} required />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="text-xs text-sub2 mb-1" style={{ display: "block" }}>Confirm new password</label>
              <input className="text-input w-full" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required />
            </div>
          </div>
          {pwMsg && (
            <p className="text-xs" style={{ color: pwMsg.ok ? "var(--state-done)" : "var(--danger)" }}>{pwMsg.text}</p>
          )}
          <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            <KeyRound size={14} /> Update password
          </button>
        </form>
      </Card>

      <Card className="chart-card">
        <h3 className="title-sm mb-2">Theme</h3>
        <div className="theme-grid">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`theme-swatch-btn theme-swatch-${t.id}${theme === t.id ? " selected" : ""}`}
            >
              <span className="theme-swatch-preview" />
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="chart-card stack" style={{ gap: 8 }}>
        <h3 className="title-sm flex items-center gap-2"><Sparkles size={14} />Habit Tracker working method :</h3>
        <p className="text-sm text-sub">
          Habit Tracker works like mark today done, watch the streak build, and let
          yesterday lock itself in — yellow while it's still today, green once it's done, red if
          the day ends without you.
        </p>
        {/* <p className="text-xs text-sub2">
          Your account, habits, and profile are stored securely in Supabase and sync to any device
          you log into. (Calendar notes and journal entries are still device-local for now.)
          Export a PDF report or a JSON backup anytime from the Data section below.
        </p> */}
        <p className="text-xs text-sub2" style={{ paddingTop: 6, borderTop: "1px solid var(--hairline)", marginTop: 4 }}>
          Built by the developer —{" "}
          <a href="https://portfolio-ms2.vercel.app/" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>
            portfolio-ms2.vercel.app
          </a>
        </p>
      </Card>

      <Card className="chart-card">
        <h3 className="title-sm mb-2">Data</h3>
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary" style={{ flex: 1, minWidth: 160 }} onClick={doExportPdf}><FileText size={14} /> Export PDF report</button>
          <button className="btn" style={{ flex: 1, minWidth: 120 }} onClick={() => fileRef.current?.click()}><Upload size={14} /> Import</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); }} />
        </div>
        <button onClick={doExportJson} className="text-xs" style={{ textDecoration: "underline", color: "var(--text-sub2)", background: "none", border: "none", marginTop: 10 }}>
          <Download size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          Also back up raw data (.json)
        </button>
      </Card>

      <Card className="chart-card stack" style={{ gap: 10 }}>
        <button className="btn btn-block" onClick={onLogout}>
          <LogOut size={14} /> Log out
        </button>
        <button className="btn btn-danger btn-block" onClick={deleteAllHabits}>Delete all my habits</button>
      </Card>
    </div>
  );
}
