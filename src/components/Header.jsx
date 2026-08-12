import { Link } from "react-router-dom";
import { LayoutGrid, Search, Sun, Moon } from "lucide-react";
import { MONTH_NAMES } from "../lib/utils";
import { useTheme } from "../hooks/useTheme";
import { useSettingsStore } from "../store/useSettingsStore";
import { useAuthStore } from "../store/useAuthStore";
import LiveClock from "./LiveClock";

export default function Header({ year, month, setYear, setMonth, search, setSearch, onMenu }) {
  const { theme, setTheme } = useTheme();
  const profile = useSettingsStore((s) => s.profile);
  const user = useAuthStore((s) => s.currentUser());
  const years = [year - 1, year, year + 1];
  const isDark = theme === "dark";
  const initial = user?.profile?.name?.[0]?.toUpperCase() || profile.name?.[0]?.toUpperCase() || "A";
  const avatarImage = user?.profile?.avatar_image;

  return (
    <header className="header">
      <button className="menu-btn" onClick={onMenu}>
        <LayoutGrid size={20} />
      </button>

      <div className="flex gap-2">
        <select className="select-input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
        <select className="select-input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="search-wrap">
        <Search size={15} />
        <input
          className="text-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search habits..."
        />
      </div>

      <div className="header-actions">
        <LiveClock />
        <button className="icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <Link to="/profile" className="avatar" style={{ textDecoration: "none", overflow: "hidden", padding: 0 }}>
          {avatarImage ? <img src={avatarImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
        </Link>
      </div>
    </header>
  );
}
