import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, gradients } from "../design/theme";
import { AmbientOrbs } from "./AmbientOrbs";
import { FilmGrain } from "./FilmGrain";

interface Props extends PropsWithChildren {
  edges?: Edge[];
  tone?: "default" | "warm";
  ambient?: boolean;
  grain?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  edges = ["top", "left", "right"],
  tone = "default",
  ambient = true,
  grain = true,
  style
}: Props) {
  const palette = tone === "warm" ? gradients.appWarm : gradients.app;

  return (
    <LinearGradient colors={palette} style={styles.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {ambient ? <AmbientOrbs /> : null}
      {grain ? <FilmGrain opacity={0.025} /> : null}
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.ink },
  safe: { flex: 1 }
});
