import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, gradients, radii, shadow } from "../design/theme";
import type { IconComponent } from "../design/icons";
import { AnimatedPressable } from "./AnimatedPressable";

interface Props extends PropsWithChildren {
  onPress: () => void;
  variant?: "gold" | "light" | "ghost" | "danger";
  icon?: IconComponent;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ children, onPress, variant = "gold", icon: Icon, loading = false, disabled = false }: Props) {
  const fg = textColorFor(variant);

  if (variant === "ghost") {
    return (
      <AnimatedPressable
        onPress={loading || disabled ? () => undefined : onPress}
        style={[styles.shell, disabled ? styles.disabled : null]}
      >
        <View style={[styles.fill, styles.ghost]}>
          <ButtonContent loading={loading} fg={fg} Icon={Icon}>
            {children}
          </ButtonContent>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={loading || disabled ? () => undefined : onPress}
      style={[styles.shell, disabled ? styles.disabled : null]}
    >
      <LinearGradient
        colors={paletteFor(variant)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <ButtonContent loading={loading} fg={fg} Icon={Icon}>
          {children}
        </ButtonContent>
      </LinearGradient>
    </AnimatedPressable>
  );
}

function ButtonContent({
  children,
  loading,
  fg,
  Icon
}: PropsWithChildren<{ loading: boolean; fg: string; Icon?: IconComponent }>) {
  if (loading) return <ActivityIndicator color={fg} />;
  return (
    <View style={styles.inner}>
      {Icon ? <Icon color={fg} size={17} /> : null}
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

function paletteFor(variant: NonNullable<Props["variant"]>) {
  switch (variant) {
    case "gold":
      return gradients.gold;
    case "danger":
      return gradients.rose;
    case "light":
    default:
      return [colors.fog, colors.bone] as const;
  }
}

function textColorFor(variant: NonNullable<Props["variant"]>) {
  if (variant === "ghost") return colors.fog;
  if (variant === "danger") return "#3A1B16";
  return colors.ink;
}

const styles = StyleSheet.create({
  shell: { borderRadius: radii.md, overflow: "hidden" },
  fill: { minHeight: 50, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  ghost: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  inner: { flexDirection: "row", gap: 8, alignItems: "center" },
  text: { fontSize: 15, fontWeight: "600", letterSpacing: 0.1 },
  disabled: { opacity: 0.45 }
});
