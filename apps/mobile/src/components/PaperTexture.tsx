import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../design/theme";

interface Props {
  intensity?: number;
}

const FLECK_COUNT = 28;

export function PaperTexture({ intensity = 0.06 }: Props) {
  const flecks = useMemo(() => {
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: FLECK_COUNT }, () => ({
      top: `${rand() * 100}%`,
      left: `${rand() * 100}%`,
      size: rand() * 1.6 + 0.6,
      opacity: rand() * 0.4 + 0.6
    }));
  }, []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
      {flecks.map((fleck, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            top: fleck.top as `${number}%`,
            left: fleck.left as `${number}%`,
            width: fleck.size,
            height: fleck.size,
            borderRadius: fleck.size / 2,
            backgroundColor: colors.fog,
            opacity: fleck.opacity
          }}
        />
      ))}
    </View>
  );
}
