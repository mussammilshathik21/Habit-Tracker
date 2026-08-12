import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "../lib/utils";

const jsonStorage = createJSONStorage(() => ({
  getItem: (key) => localStorage.getItem(`habitus:${key}`),
  setItem: (key, value) => localStorage.setItem(`habitus:${key}`, value),
  removeItem: (key) => localStorage.removeItem(`habitus:${key}`),
}));

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: "system", // light | dark | system
      profile: { name: "Alex Morgan", email: "alex@example.com" },
      notifications: { morning: true, evening: false, custom: "" },

      setTheme: (theme) => set({ theme }),
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setNotifications: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),
    }),
    { name: "settings", storage: jsonStorage }
  )
);

/** Per-day extra data: mood (1-5), sleep hours, free-text notes. Keyed by "YYYY-MM-DD". */
export const useDayLogStore = create(
  persist(
    (set, get) => ({
      dayLogs: {}, // { "2026-07-24": { mood: 4, sleep: 7.5, notes: "..." } }

      updateDay: (dateStr, patch) =>
        set((s) => ({
          dayLogs: {
            ...s.dayLogs,
            [dateStr]: { ...(s.dayLogs[dateStr] || {}), ...patch },
          },
        })),

      getDay: (dateStr) => get().dayLogs[dateStr] || { mood: null, sleep: "", notes: "" },
    }),
    { name: "day-logs", storage: jsonStorage }
  )
);

/** Journal entries, one per date, markdown content with autosave. */
export const useJournalStore = create(
  persist(
    (set, get) => ({
      entries: [
        {
          id: "seed-entry",
          date: new Date().toISOString().slice(0, 10),
          content: "# Today\n\nStarted the day with a run and a clear head.",
        },
      ],

      addEntry: () => {
        const id = uid("j");
        const date = new Date().toISOString().slice(0, 10);
        set((s) => ({ entries: [{ id, date, content: "" }, ...s.entries] }));
        return id;
      },

      updateEntry: (id, content) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, content } : e)),
        })),
    }),
    { name: "journal", storage: jsonStorage }
  )
);
