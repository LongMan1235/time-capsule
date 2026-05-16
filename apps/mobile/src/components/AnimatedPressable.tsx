import { forwardRef, useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

interface Props extends Omit<PressableProps, "children" | "style"> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  pressOpacity?: number;
  duration?: number;
}

export const AnimatedPressable = forwardRef<any, Props>(function AnimatedPressable(
  { children, style, scaleTo = 0.96, pressOpacity = 0.92, duration = 130, onPressIn, onPressOut, ...rest },
  ref
) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      ref={ref}
      onPressIn={(event) => {
        Animated.parallel([
          Animated.timing(scale, { toValue: scaleTo, duration, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: pressOpacity, duration, useNativeDriver: true })
        ]).start();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 240, friction: 8 }),
          Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true })
        ]).start();
        onPressOut?.(event);
      }}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>{children}</Animated.View>
    </Pressable>
  );
});
