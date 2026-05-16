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
      {grain ? <FilmGrain /> : null}
      <View pointerEvents="none" style={styles.topVignette}>
        <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]} style={StyleSheet.absoluteFill} />
      </View>
      <View pointerEvents="none" style={styles.bottomVignette}>
        <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.45)"]} style={StyleSheet.absoluteFill} />
      </View>
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.ink },
  safe: { flex: 1 },
  topVignette: { position: "absolute", top: 0, left: 0, right: 0, height: 140 },
  bottomVignette: { position: "absolute", bottom: 0, left: 0, right: 0, height: 160 }
});
