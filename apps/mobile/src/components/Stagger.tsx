import { useEffect, useRef, type PropsWithChildren } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

interface Props extends PropsWithChildren {
  delay?: number;
  duration?: number;
  translate?: number;
  style?: StyleProp<ViewStyle>;
}

export function Stagger({ children, delay = 0, duration = 520, translate = 18, style }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true
    }).start();
  }, [progress, duration, delay]);

  const opacity = progress;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [translate, 0] });

  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}
