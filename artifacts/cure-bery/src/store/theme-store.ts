import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

const saved = localStorage.getItem("cureberry_theme") === "dark";
applyTheme(saved);

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: saved,
  toggle: () =>
    set((s) => {
      const next = !s.isDark;
      localStorage.setItem("cureberry_theme", next ? "dark" : "light");
      applyTheme(next);
      return { isDark: next };
    }),
}));
