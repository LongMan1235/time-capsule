import { forwardRef, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
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
  { children, style, scaleTo = 0.965, pressOpacity = 0.92, duration = 110, onPressIn, onPressOut, ...rest },
  ref
) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      ref={ref}
      onPressIn={(event) => {
        Animated.parallel([
          Animated.timing(scale, {
            toValue: scaleTo,
            duration,
            easing: Easing.bezier(0.32, 0.72, 0.36, 0.94),
            useNativeDriver: true
          }),
          Animated.timing(opacity, { toValue: pressOpacity, duration, useNativeDriver: true })
        ]).start();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 240, friction: 7, restSpeedThreshold: 0.001 }),
          Animated.timing(opacity, { toValue: 1, duration: duration + 40, useNativeDriver: true })
        ]).start();
        onPressOut?.(event);
      }}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>{children}</Animated.View>
    </Pressable>
  );
});
