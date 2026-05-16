import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface Props {
  opacity?: number;
}

export function FilmGrain({ opacity = 0.05 }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true })
      ])
    ).start();
  }, [shimmer]);

  const translateY = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#fbf5e8", opacity, transform: [{ translateX }, { translateY }] }
        ]}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.vignette]} />
    </View>
  );
}

const styles = StyleSheet.create({
  vignette: {
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 }
  }
});
