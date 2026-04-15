"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  toggleMode: () => void;
}

const Ctx = createContext<ThemeContextValue>({ mode: "light", toggleMode: () => {} });

export function useThemeMode() {
  return useContext(Ctx);
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("themeMode") as Mode | null;
    if (saved === "dark" || saved === "light") setMode(saved);
  }, []);

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("themeMode", next);
  }

  return <Ctx.Provider value={{ mode, toggleMode }}>{children}</Ctx.Provider>;
}
