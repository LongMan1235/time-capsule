import { Platform } from "react-native";

export const colors = {
  ink: "#0B0A10",
  night: "#15131D",
  dusk: "#1F1A28",
  plum: "#4E2E56",
  moss: "#5B6B4D",
  rose: "#E4928A",
  roseDeep: "#C87767",
  gold: "#E8C26B",
  goldDeep: "#C29144",
  fog: "#F5F1EA",
  bone: "#EFE8DB",
  muted: "#9C95A0",
  mutedDim: "#615B68",
  card: "rgba(255,255,255,0.04)",
  cardElevated: "rgba(255,255,255,0.07)",
  line: "rgba(255,255,255,0.08)",
  lineBright: "rgba(255,255,255,0.16)",
  scrim: "rgba(8,6,12,0.55)",
  scrimSoft: "rgba(8,6,12,0.35)",
  glow: "rgba(232,194,107,0.20)",
  glowSoft: "rgba(232,194,107,0.08)",
  danger: "#E37A6A"
};

export const gradients = {
  app: [colors.ink, "#13111B", "#1B1622"] as const,
  appWarm: ["#15121A", "#1A141F", "#221821"] as const,
  gold: ["#EFCB7F", "#E8C26B", "#D1A050"] as const,
  rose: ["#F1B0A6", "#E4928A", "#B6685D"] as const,
  glassDark: ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.02)"] as const,
  glassWarm: ["rgba(232,194,107,0.14)", "rgba(232,194,107,0.02)"] as const,
  scrimBottom: ["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"] as const,
  scrimTop: ["rgba(0,0,0,0.55)", "rgba(0,0,0,0.10)", "rgba(0,0,0,0)"] as const
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const type = {
  display: { fontSize: 38, lineHeight: 44, letterSpacing: -0.8, fontWeight: "700" as const },
  hero: { fontSize: 30, lineHeight: 36, letterSpacing: -0.5, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3, fontWeight: "700" as const },
  heading: { fontSize: 20, lineHeight: 26, letterSpacing: -0.1, fontWeight: "600" as const },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const, letterSpacing: 1.4 },
  numeric: { fontSize: 76, lineHeight: 82, letterSpacing: -2, fontWeight: "700" as const }
};

export const shadow = {
  card: Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 6 },
    default: {}
  }),
  glow: Platform.select({
    ios: { shadowColor: colors.gold, shadowOpacity: 0.20, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
    android: { elevation: 6 },
    default: {}
  }),
  soft: Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3 },
    default: {}
  })
};

export const motion = {
  fast: 180,
  base: 260,
  slow: 420,
  cinematic: 720
};
