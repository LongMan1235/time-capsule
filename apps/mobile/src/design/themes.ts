import { Platform } from "react-native";

/**
 * Two themes share the same shape so screens can use a single `useTheme()` hook
 * and switch surfaces, ink, and accent tones in one prop change.
 *
 * MARBLE — warm cream backgrounds, deep ink text, subtle gold accent. The new
 *          default aesthetic: a luxury journal printed on Italian paper.
 * OBSIDIAN — warm deep black with gold + cream accents. The cinematic dark
 *            counterpart for nighttime use.
 */

export type ThemeName = "marble" | "obsidian";

export interface ThemeTokens {
  name: ThemeName;
  bg: {
    /** Lowest surface — the page itself */
    canvas: string;
    /** Slightly elevated panels (cards, sheets) */
    surface: string;
    /** Highest elevation (popovers, modals) */
    elevated: string;
    /** Inverse — used for chips/badges that should pop against canvas */
    inverse: string;
  };
  ink: {
    /** Primary text */
    primary: string;
    /** Secondary / meta text */
    muted: string;
    /** Disabled / very subtle */
    faint: string;
    /** Used on accent backgrounds */
    onAccent: string;
    /** Used on inverse backgrounds */
    onInverse: string;
  };
  /** Soft hairline borders between surfaces */
  line: {
    soft: string;
    hard: string;
  };
  accent: {
    /** Gold across both themes — a 24kt accent line */
    gold: string;
    goldSoft: string;
    goldDeep: string;
    danger: string;
  };
  /** Pre-composed gradient stops for backgrounds */
  gradients: {
    canvas: readonly [string, string, ...string[]];
    sheen: readonly [string, string];
    scrim: readonly [string, string, string];
  };
  /** Veining / grain overlay tuning */
  veining: {
    /** Color of the noise overlay */
    color: string;
    /** Opacity of the noise overlay */
    opacity: number;
  };
}

const MARBLE: ThemeTokens = {
  name: "marble",
  bg: {
    canvas: "#F4EFE6",
    surface: "#EBE3D2",
    elevated: "#FAF6EE",
    inverse: "#1A1410"
  },
  ink: {
    primary: "#1A1410",
    muted: "#5F574B",
    faint: "#A8A091",
    onAccent: "#1A1410",
    onInverse: "#F4EFE6"
  },
  line: {
    soft: "rgba(26, 20, 16, 0.08)",
    hard: "rgba(26, 20, 16, 0.16)"
  },
  accent: {
    gold: "#9F7530",
    goldSoft: "#C29144",
    goldDeep: "#7A5520",
    danger: "#B5523E"
  },
  gradients: {
    canvas: ["#FBF7EE", "#F4EFE6", "#E5DCC9"] as const,
    sheen: ["rgba(255,255,255,0.50)", "rgba(255,255,255,0)"] as const,
    scrim: ["rgba(244,239,230,0)", "rgba(244,239,230,0.65)", "rgba(244,239,230,1)"] as const
  },
  veining: {
    color: "#7A5520",
    opacity: 0.085
  }
};

const OBSIDIAN: ThemeTokens = {
  name: "obsidian",
  bg: {
    canvas: "#0B0810",
    surface: "#15101C",
    elevated: "#1F1828",
    inverse: "#F4EFE6"
  },
  ink: {
    primary: "#F4EFE6",
    muted: "#9C95A0",
    faint: "#5F574B",
    onAccent: "#0B0810",
    onInverse: "#1A1410"
  },
  line: {
    soft: "rgba(255, 255, 255, 0.08)",
    hard: "rgba(255, 255, 255, 0.16)"
  },
  accent: {
    gold: "#E8C26B",
    goldSoft: "#F4D88A",
    goldDeep: "#C29144",
    danger: "#E37A6A"
  },
  gradients: {
    canvas: ["#0B0810", "#100B16", "#0F0A14"] as const,
    sheen: ["rgba(255,255,255,0.04)", "rgba(255,255,255,0)"] as const,
    scrim: ["rgba(11,8,16,0)", "rgba(11,8,16,0.55)", "rgba(11,8,16,0.92)"] as const
  },
  veining: {
    color: "#F4D88A",
    opacity: 0.035
  }
};

export const themes: Record<ThemeName, ThemeTokens> = {
  marble: MARBLE,
  obsidian: OBSIDIAN
};

/* ------------------------------------------------------------------ */
/* SHARED — these don't change between themes                         */
/* ------------------------------------------------------------------ */

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

export const type = {
  display: { fontSize: 40, lineHeight: 46, letterSpacing: -1.2, fontWeight: "700" as const },
  hero: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3, fontWeight: "700" as const },
  heading: { fontSize: 19, lineHeight: 26, letterSpacing: -0.1, fontWeight: "600" as const },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const, letterSpacing: 1.6 },
  numeric: { fontSize: 76, lineHeight: 82, letterSpacing: -2.5, fontWeight: "800" as const }
} as const;

export const motion = {
  /** Default ease for everything; out-cubic with a soft tail */
  ease: [0.22, 1, 0.36, 1] as const,
  /** Slightly snappier for press/release */
  pressEase: [0.32, 0.72, 0.36, 0.94] as const,
  /** Used for spring-like settles */
  settle: { friction: 8, tension: 90 },
  durations: {
    instant: 100,
    fast: 220,
    base: 360,
    slow: 540,
    cinematic: 820
  }
} as const;

export function shadowsFor(t: ThemeTokens) {
  const isLight = t.name === "marble";
  return {
    card: Platform.select({
      ios: isLight
        ? { shadowColor: "#1A1410", shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } }
        : { shadowColor: "#000", shadowOpacity: 0.32, shadowRadius: 20, shadowOffset: { width: 0, height: 14 } },
      android: { elevation: isLight ? 4 : 8 },
      default: {}
    }),
    soft: Platform.select({
      ios: isLight
        ? { shadowColor: "#1A1410", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }
        : { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: isLight ? 2 : 4 },
      default: {}
    })
  };
}

/* ------------------------------------------------------------------ */
/* BACKWARDS-COMPAT (old static exports, slowly migrating)            */
/* These re-export the obsidian palette under the old names so existing
 * code that imports `colors`/`gradients` from ./theme keeps working
 * during the migration. */
/* ------------------------------------------------------------------ */

export const legacyDarkColors = {
  ink: OBSIDIAN.bg.canvas,
  night: OBSIDIAN.bg.surface,
  dusk: OBSIDIAN.bg.elevated,
  plum: "#4E2E56",
  moss: "#5B6B4D",
  rose: OBSIDIAN.accent.danger,
  roseDeep: "#C87767",
  gold: OBSIDIAN.accent.gold,
  goldDeep: OBSIDIAN.accent.goldDeep,
  fog: OBSIDIAN.ink.primary,
  bone: "#EFE8DB",
  muted: OBSIDIAN.ink.muted,
  mutedDim: "#615B68",
  card: "rgba(255,255,255,0.04)",
  cardElevated: "rgba(255,255,255,0.07)",
  line: OBSIDIAN.line.soft,
  lineBright: OBSIDIAN.line.hard,
  scrim: "rgba(8,6,12,0.55)",
  scrimSoft: "rgba(8,6,12,0.35)",
  glow: "rgba(232,194,107,0.20)",
  glowSoft: "rgba(232,194,107,0.08)",
  danger: OBSIDIAN.accent.danger
};
