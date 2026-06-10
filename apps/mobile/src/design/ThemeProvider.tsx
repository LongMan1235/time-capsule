import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { themes, shadowsFor, type ThemeName, type ThemeTokens } from "./themes";

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: ThemeName;
  setMode: (mode: ThemeName) => void;
  toggle: () => void;
  shadows: ReturnType<typeof shadowsFor>;
  ready: boolean;
}

const STORAGE_KEY = "time-capsule-theme-mode";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  // Default to marble — the new aesthetic. AsyncStorage may override.
  const [mode, setModeInternal] = useState<ThemeName>("marble");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === "marble" || stored === "obsidian") setModeInternal(stored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeName) => {
    setModeInternal(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    setModeInternal((prev) => {
      const next: ThemeName = prev === "marble" ? "obsidian" : "marble";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = themes[mode];
    return { theme, mode, setMode, toggle, shadows: shadowsFor(theme), ready };
  }, [mode, setMode, toggle, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
