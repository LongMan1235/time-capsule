import { Canvas, RadialGradient, Rect, Turbulence, vec } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, type PropsWithChildren } from "react";
import { Dimensions, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useTheme } from "../design/ThemeProvider";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props extends PropsWithChildren {
  edges?: Edge[];
  /** When true (default), render the marble veining / paper grain backdrop. */
  textured?: boolean;
  /** Legacy alias for `textured`. */
  texture?: boolean;
  /** Force a tone independent of the active theme. Rarely used. */
  forceTone?: "marble" | "obsidian";
  /** Legacy prop — ignored; theme is now global. */
  tone?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The base canvas every screen draws on. Renders the active theme's gradient
 * + a tasteful Skia turbulence overlay so light mode reads like real Italian
 * marble (warm cream with subtle gold veining) and dark mode reads like
 * polished obsidian with a faint warm grain.
 */
export function Screen({ children, edges = ["top", "left", "right"], textured, texture, forceTone, style }: Props) {
  const showTexture = (textured ?? texture) !== false;
  const { theme: active } = useTheme();
  const tokens = useMemo(() => {
    if (forceTone) {
      // Just rebuild a tiny shim — only the bits Screen needs.
      const t = forceTone === "marble" ? require("../design/themes").themes.marble : require("../design/themes").themes.obsidian;
      return t as typeof active;
    }
    return active;
  }, [active, forceTone]);

  return (
    <View style={[styles.fill, { backgroundColor: tokens.bg.canvas }]}>
      <LinearGradient
        colors={tokens.gradients.canvas as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {showTexture ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Soft radial sheen from upper-left so the surface has light direction */}
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
            <RadialGradient
              c={vec(SCREEN_W * 0.18, SCREEN_H * 0.12)}
              r={SCREEN_W * 1.05}
              colors={
                tokens.name === "marble"
                  ? ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]
                  : ["rgba(232,194,107,0.06)", "rgba(0,0,0,0)"]
              }
              positions={[0, 1]}
            />
          </Rect>

          {/* Procedural veining / grain */}
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} opacity={tokens.veining.opacity}>
            <Turbulence
              freqX={tokens.name === "marble" ? 0.012 : 0.024}
              freqY={tokens.name === "marble" ? 0.022 : 0.024}
              octaves={tokens.name === "marble" ? 2 : 1}
              seed={tokens.name === "marble" ? 11 : 7}
            />
          </Rect>

          {/* Subtle warm wash from bottom up — grounds the page */}
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} opacity={tokens.name === "marble" ? 0.16 : 0.22}>
            <RadialGradient
              c={vec(SCREEN_W * 0.5, SCREEN_H * 1.1)}
              r={SCREEN_W * 0.9}
              colors={
                tokens.name === "marble"
                  ? ["rgba(155,110,40,0.18)", "rgba(155,110,40,0)"]
                  : ["rgba(78,46,86,0.30)", "rgba(78,46,86,0)"]
              }
              positions={[0, 1]}
            />
          </Rect>
        </Canvas>
      ) : null}

      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1 }
});
