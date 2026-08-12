import { useHabitStore } from "../store/useHabitStore";

export function useHabits() {
  const habits = useHabitStore((s) => s.habits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const toggleDay = useHabitStore((s) => s.toggleDay);

  return {
    habits,
    activeHabits: habits.filter((h) => !h.archived),
    addHabit,
    removeHabit,
    archiveHabit,
    toggleDay,
  };
}
