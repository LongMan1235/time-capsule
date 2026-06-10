import { forwardRef, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../design/ThemeProvider";
import { radii, type } from "../design/themes";
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
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  Animated.timing(progress, { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: false }).start();

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.line.soft, theme.accent.gold]
  });
  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.bg.surface, theme.bg.elevated]
  });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.ink.muted }]}>{label}</Text>
      <Animated.View style={[styles.field, { borderColor, backgroundColor }]}>
        {Icon ? <Icon color={focused ? theme.accent.gold : theme.ink.muted} size={17} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.ink.faint}
          style={[styles.input, { color: theme.ink.primary }, style]}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          selectionColor={theme.accent.gold}
          {...rest}
        />
      </Animated.View>
      {hint ? <Text style={[styles.hint, { color: theme.ink.muted }]}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...type.micro },
  field: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  input: { ...type.subtitle, flex: 1, paddingVertical: 12 },
  hint: { ...type.caption }
});
