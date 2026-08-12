import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "../store/useAuthStore";
import { useHabitStore } from "../store/useHabitStore";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [search, setSearch] = useState("");

  const session = useAuthStore((s) => s.session);
  const fetchHabits = useHabitStore((s) => s.fetchHabits);

  // Re-fetch habits from Supabase whenever the signed-in session changes.
  useEffect(() => {
    fetchHabits();
  }, [session?.user?.id, fetchHabits]);

  return (
    <div className="app">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main">
        <Header
          year={year}
          month={month}
          setYear={setYear}
          setMonth={setMonth}
          search={search}
          setSearch={setSearch}
          onMenu={() => setMobileOpen(true)}
        />
        <Outlet context={{ year, month, search }} />
      </div>
    </div>
  );
}
