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
  card: "rgba(255,255,255,0.06)",
  cardElevated: "rgba(255,255,255,0.10)",
  line: "rgba(255,255,255,0.10)",
  lineBright: "rgba(255,255,255,0.18)",
  scrim: "rgba(8,6,12,0.55)",
  scrimSoft: "rgba(8,6,12,0.35)",
  glow: "rgba(232,194,107,0.32)",
  glowSoft: "rgba(232,194,107,0.12)",
  danger: "#E37A6A"
};

export const gradients = {
  app: [colors.ink, "#13111B", "#1B1622"] as const,
  appWarm: ["#1A1218", "#211724", "#2A1B1F"] as const,
  gold: ["#F1D08B", "#E8C26B", "#C29144"] as const,
  rose: ["#F1B0A6", "#E4928A", "#B6685D"] as const,
  glassDark: ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.04)"] as const,
  glassWarm: ["rgba(232,194,107,0.22)", "rgba(232,194,107,0.04)"] as const,
  scrimBottom: ["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"] as const,
  scrimTop: ["rgba(0,0,0,0.65)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0)"] as const
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
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
  display: { fontSize: 44, lineHeight: 50, letterSpacing: -1.2, fontWeight: "800" as const },
  hero: { fontSize: 36, lineHeight: 42, letterSpacing: -0.8, fontWeight: "800" as const },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4, fontWeight: "800" as const },
  heading: { fontSize: 22, lineHeight: 28, letterSpacing: -0.2, fontWeight: "700" as const },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "700" as const, letterSpacing: 1.6 },
  numeric: { fontSize: 92, lineHeight: 96, letterSpacing: -3, fontWeight: "800" as const }
};

export const shadow = {
  card: Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 14 } },
    android: { elevation: 10 },
    default: {}
  }),
  glow: Platform.select({
    ios: { shadowColor: colors.gold, shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
    android: { elevation: 14 },
    default: {}
  }),
  soft: Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 6 },
    default: {}
  })
};

export const motion = {
  fast: 180,
  base: 260,
  slow: 420,
  cinematic: 720
};
