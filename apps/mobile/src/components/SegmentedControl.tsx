import { useEffect, useRef } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../design/theme";

interface Props<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const widthRef = useRef(0);
  const indicator = useRef(new Animated.Value(0)).current;
  const index = options.findIndex((option) => option.value === value);

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: Math.max(0, index),
      useNativeDriver: false,
      friction: 9,
      tension: 160,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001
    }).start();
  }, [indicator, index]);

  const onLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
  };

  const translateX = indicator.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => (i * (widthRef.current || 1)) / options.length)
  });

  const segmentWidth = (widthRef.current || 0) / options.length;

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.indicator,
          { width: segmentWidth - 6, transform: [{ translateX }] }
        ]}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} style={styles.segment} onPress={() => onChange(option.value)}>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.line,
    position: "relative"
  },
  indicator: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.fog
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  label: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  labelActive: { color: colors.ink }
});
