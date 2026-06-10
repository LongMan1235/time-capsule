import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../design/ThemeProvider";
import { radii } from "../design/themes";
import type { IconComponent } from "../design/icons";
import { AnimatedPressable } from "./AnimatedPressable";

interface Props extends PropsWithChildren {
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconComponent;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * The button system has two visuals only:
 *   • primary — ink filled, cream label (light) / cream filled, ink label (dark)
 *   • ghost   — hairline border on canvas, ink label
 *   • danger  — soft rose tint
 *
 * The "look" inverts between marble + obsidian automatically so it always
 * reads as the bolder option on whichever surface we're sitting on.
 */
export function PrimaryButton({ children, onPress, variant = "primary", icon: Icon, loading = false, disabled = false }: Props) {
  const { theme, shadows } = useTheme();

  const palette = paletteFor(variant, theme);
  const fg = textColorFor(variant, theme);
  const border = borderFor(variant, theme);
  const isGhost = variant === "ghost";

  const inner = (
    <View style={[styles.fill, { borderWidth: isGhost ? 1 : 0, borderColor: border, backgroundColor: isGhost ? "transparent" : "transparent" }]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.inner}>
          {Icon ? <Icon color={fg} size={17} /> : null}
          <Text style={[styles.text, { color: fg }]}>{children}</Text>
        </View>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={loading || disabled ? () => undefined : onPress}
      style={[styles.shell, shadows.soft, disabled ? styles.disabled : null]}
    >
      {isGhost ? (
        inner
      ) : (
        <LinearGradient
          colors={palette}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {isGhost ? null : (
        <View style={styles.fill}>
          {loading ? (
            <ActivityIndicator color={fg} />
          ) : (
            <View style={styles.inner}>
              {Icon ? <Icon color={fg} size={17} /> : null}
              <Text style={[styles.text, { color: fg }]}>{children}</Text>
            </View>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

function paletteFor(variant: NonNullable<Props["variant"]>, theme: ReturnType<typeof useTheme>["theme"]) {
  switch (variant) {
    case "danger":
      return ["#E8A294", "#B5523E"] as const;
    case "primary":
    default:
      return theme.name === "marble"
        ? [theme.bg.inverse, "#0A0610"] as const // deep ink on cream
        : [theme.ink.primary, "#E0D9C9"] as const; // warm cream on dark
  }
}

function textColorFor(variant: NonNullable<Props["variant"]>, theme: ReturnType<typeof useTheme>["theme"]) {
  switch (variant) {
    case "ghost":
      return theme.ink.primary;
    case "danger":
      return "#3A1B16";
    case "primary":
    default:
      return theme.name === "marble" ? theme.bg.canvas : theme.bg.canvas;
  }
}

function borderFor(variant: NonNullable<Props["variant"]>, theme: ReturnType<typeof useTheme>["theme"]) {
  if (variant === "ghost") return theme.line.hard;
  return "transparent";
}

const styles = StyleSheet.create({
  shell: { borderRadius: radii.pill, overflow: "hidden" },
  fill: { minHeight: 54, paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  inner: { flexDirection: "row", gap: 10, alignItems: "center" },
  text: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  disabled: { opacity: 0.45 }
});
