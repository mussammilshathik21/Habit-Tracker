import { useEffect } from "react";
import { useSettingsStore } from "../store/useSettingsStore";

export const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "yellow", label: "Yellow" },
  { id: "red", label: "Red" },
  { id: "yellowdark", label: "Yellow Black" },
];

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  useEffect(() => {
    let applied = theme;
    if (theme === "system") {
      applied = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", applied);
  }, [theme]);

  return { theme, setTheme };
}
