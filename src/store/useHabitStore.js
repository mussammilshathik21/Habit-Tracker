import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import { dateKey } from "../lib/utils";

const rowToHabit = (r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  category: r.category,
  frequency: r.frequency,
  color: r.color,
  logs: r.logs || {},
  archived: r.archived,
  sortOrder: r.sort_order,
  createdAt: r.started_on,
});

const todayKey = () => {
  const now = new Date();
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

export const useHabitStore = create((set, get) => ({
  habits: [],
  loading: false,

  // Called after login/signup/logout so the in-memory list always matches
  // whichever account is signed in (or is empty when signed out).
  fetchHabits: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return set({ habits: [] });

    set({ loading: true });
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("sort_order", { ascending: true });
    set({ habits: error ? [] : data.map(rowToHabit), loading: false });
    if (error) console.error("Habitus: failed to load habits", error);
  },

  addHabit: async (habit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: session.user.id,
        name: habit.name,
        emoji: habit.emoji,
        category: habit.category,
        frequency: habit.frequency,
        color: habit.color,
        logs: {},
        archived: false,
        sort_order: get().habits.length,
        started_on: todayKey(), // tracking starts today, not retroactively
      })
      .select()
      .single();
    if (error) return console.error("Habitus: failed to add habit", error);
    set((s) => ({ habits: [...s.habits, rowToHabit(data)] }));
  },

  removeHabit: async (id) => {
    const prev = get().habits;
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })); // optimistic
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) { console.error("Habitus: failed to delete habit", error); set({ habits: prev }); }
  },

  archiveHabit: async (id) => {
    const { data, error } = await supabase.from("habits").update({ archived: true }).eq("id", id).select().single();
    if (error) return console.error("Habitus: failed to archive habit", error);
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? rowToHabit(data) : h)) }));
  },

  toggleDay: async (habitId, dateStr) => {
    if (dateStr !== todayKey()) return; // past/future days are locked — only today can be logged
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;
    const nextLogs = { ...habit.logs, [dateStr]: !habit.logs[dateStr] };

    set((s) => ({ habits: s.habits.map((h) => (h.id === habitId ? { ...h, logs: nextLogs } : h)) })); // optimistic
    const { error } = await supabase.from("habits").update({ logs: nextLogs }).eq("id", habitId);
    if (error) { console.error("Habitus: failed to save toggle", error); get().fetchHabits(); } // rollback via refetch
  },

  importHabits: async (habits) => {
    for (const h of habits) await get().addHabit(h);
  },
}));
