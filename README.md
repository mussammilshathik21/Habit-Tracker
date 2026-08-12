# Habitus — Frontend-only Habit Tracker

Pure React + JavaScript + plain CSS. All data lives in the browser's
localStorage via Zustand's `persist` middleware — no backend required yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 — a few starter habits are seeded automatically
on first load.

## Structure

```
src/
  components/   Sidebar, Header, Card, AnimatedCheckbox, ProgressBar,
                HabitRow, WeekHeader, HabitFormModal, DayModal, AppLayout
  pages/        Dashboard, Calendar, Analytics, Journal, Statistics, Settings
  lib/          utils.js (dates/streaks), storage.js (localStorage helpers), mockData.js (seed data)
  store/        useHabitStore.js, useSettingsStore.js (theme/profile/notifications/day-logs/journal)
  hooks/        useHabits.js, useTheme.js
  routes/       AppRoutes.jsx (route table)
  App.jsx       root component
  main.jsx      entry point
  index.css     full plain-CSS design system (light/dark via [data-theme])
```

## How data persists right now

Everything is stored under `localStorage` keys prefixed `habitus:` —
`habitus:habits`, `habitus:settings`, `habitus:day-logs`, `habitus:journal`.
Clearing browser storage (or Settings → Delete all local data) resets the app.

## Swapping in a backend later

Each store (`useHabitStore`, `useSettingsStore`, `useDayLogStore`, `useJournalStore`)
is the single place data flows through. When you're ready to add Supabase (or
anything else), replace the `persist` middleware's read/writes with API calls —
the components never talk to storage directly, so the UI code doesn't change.
