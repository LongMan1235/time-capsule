import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../design/theme";

interface OrbConfig {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  delay?: number;
  range?: number;
}

const orbs: OrbConfig[] = [
  { size: 320, color: colors.plum, top: -80, left: -120, delay: 0, range: 24 },
  { size: 260, color: colors.roseDeep, top: 280, right: -110, delay: 1200, range: 18 },
  { size: 280, color: colors.moss, bottom: -120, left: -60, delay: 600, range: 30 }
];

export function AmbientOrbs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {orbs.map((orb, index) => (
        <Orb key={index} {...orb} />
      ))}
    </View>
  );
}

function Orb({ size, color, top, left, right, bottom, delay = 0, range = 24 }: OrbConfig) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 6400, delay, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 6400, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [drift, delay]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, range] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -range / 1.5] });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.32,
        transform: [{ translateX }, { translateY }]
      }}
    />
  );
}
