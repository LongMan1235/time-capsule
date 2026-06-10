import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../design/ThemeProvider";
import { radii } from "../design/themes";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip key={option.value} active={option.value === value} option={option} onPress={() => onChange(option.value)} />
      ))}
    </View>
  );
}

function Chip<T extends string>({ option, active, onPress }: { option: FilterOption<T>; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  Animated.timing(progress, { toValue: active ? 1 : 0, duration: 220, useNativeDriver: false }).start();

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.bg.surface, theme.bg.inverse]
  });
  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.line.soft, theme.bg.inverse]
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.chip, { backgroundColor, borderColor }]}>
        <Text style={[styles.label, { color: active ? theme.ink.onInverse : theme.ink.primary }]}>
          {option.label}
        </Text>
        {typeof option.count === "number" ? (
          <Text style={[styles.count, { color: active ? theme.ink.onInverse : theme.ink.muted, opacity: active ? 0.7 : 1 }]}>
            {option.count}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1
  },
  label: { fontWeight: "700", fontSize: 13, letterSpacing: 0.2 },
  count: { fontSize: 12, fontWeight: "700" }
});
