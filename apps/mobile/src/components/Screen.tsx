import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors } from "../design/theme";
import { PaperTexture } from "./PaperTexture";

interface Props extends PropsWithChildren {
  edges?: Edge[];
  tone?: "default" | "warm" | "paper";
  texture?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  edges = ["top", "left", "right"],
  tone = "default",
  texture = true,
  style
}: Props) {
  const palette = paletteFor(tone);

  return (
    <LinearGradient colors={palette} style={styles.fill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      {texture ? <PaperTexture intensity={0.05} /> : null}
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

function paletteFor(tone: NonNullable<Props["tone"]>) {
  switch (tone) {
    case "warm":
      return ["#1A141C", "#15131A"] as const;
    case "paper":
      return ["#171420", "#0F0D14"] as const;
    case "default":
    default:
      return ["#13111B", "#0B0A10"] as const;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.ink },
  safe: { flex: 1 }
});
