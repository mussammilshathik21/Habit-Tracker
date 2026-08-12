import { NavLink } from "react-router-dom";
import { LayoutGrid, CalendarDays, ListChecks, UserCircle, Sparkles, Mail } from "lucide-react";
import { cx } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/statistics", label: "Statistics", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = useAuthStore((s) => s.currentUser());

  return (
    <>
      <div className={cx("sidebar-overlay", mobileOpen && "open")} onClick={() => setMobileOpen(false)} />
      <aside className={cx("sidebar", mobileOpen && "open")}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Sparkles size={16} />
          </div>
          <span className="sidebar-brand-name">Habitus</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cx("nav-link", isActive && "active")}
            >
              <n.icon size={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {/* {user?.email && (
            <p className="text-xs" style={{ padding: "0 12px 6px", display: "flex", alignItems: "center", gap: 6, color: "var(--text-sub)", fontWeight: 500 }}>
              <Mail size={12} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
            </p>
          )} */}
          <p className="text-xz text-sub1" style={{ padding: "0 12px" }}>
            IF You Improve By 1% Every Day, Within A Year You’ll  Have Improved By 365%.
          </p>
        </div>
      </aside>
    </>
  );
}
