import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../design/theme";

export function AmbientOrbs() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9_000, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9_000, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [drift]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.orb,
          {
            top: -80,
            left: -120,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: colors.plum,
            opacity: 0.16,
            transform: [{ translateX }, { translateY }]
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: { position: "absolute" }
});
