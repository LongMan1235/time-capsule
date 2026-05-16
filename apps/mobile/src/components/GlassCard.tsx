import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, gradients, radii } from "../design/theme";

interface Props extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  tone?: "neutral" | "warm";
  border?: boolean;
}

export function GlassCard({ children, style, intensity = 28, radius = radii.lg, tone = "neutral", border = true }: Props) {
  const sheen = tone === "warm" ? gradients.glassWarm : gradients.glassDark;
  return (
    <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(20,16,26,0.78)" }]} />
      )}
      <LinearGradient
        colors={sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {border ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: colors.line }]} /> : null}
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  );
}
