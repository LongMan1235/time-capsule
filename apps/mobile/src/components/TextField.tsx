import { forwardRef, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radii, type } from "../design/theme";
import type { IconComponent } from "../design/icons";

interface Props extends TextInputProps {
  label: string;
  icon?: IconComponent;
  hint?: string;
}

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, icon: Icon, hint, onFocus, onBlur, style, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  Animated.timing(progress, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.line, colors.gold]
  });
  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.04)", "rgba(232,194,107,0.06)"]
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, { borderColor, backgroundColor }]}>
        {Icon ? <Icon color={focused ? colors.gold : colors.muted} size={18} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedDim}
          style={[styles.input, style]}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          selectionColor={colors.gold}
          {...rest}
        />
      </Animated.View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...type.micro, color: colors.muted },
  field: {
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  input: { ...type.subtitle, color: colors.fog, flex: 1, paddingVertical: 12 },
  hint: { ...type.caption, color: colors.muted }
});
