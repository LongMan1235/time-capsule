import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../design/theme";

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
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  Animated.timing(progress, { toValue: active ? 1 : 0, duration: 220, useNativeDriver: false }).start();

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.04)", colors.fog]
  });
  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.line, colors.fog]
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.chip, { backgroundColor, borderColor }]}>
        <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
        {typeof option.count === "number" ? (
          <Text style={[styles.count, active ? styles.countActive : null]}>{option.count}</Text>
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
  label: { color: colors.fog, fontWeight: "700", fontSize: 13, letterSpacing: 0.2 },
  labelActive: { color: colors.ink },
  count: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  countActive: { color: colors.mutedDim }
});
