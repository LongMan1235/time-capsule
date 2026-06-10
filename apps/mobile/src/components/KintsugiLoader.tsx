import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Kintsugi loading screen.
 *
 * White marble background with gold-filled cracks that flow downward like
 * liquid. Each crack reveals via strokeDashoffset animation, staggered top
 * to bottom so the gold cascades through the marble surface.
 *
 * `onComplete` fires when the gold has finished flowing through every crack.
 * `label` shows below the surface (e.g. "Generating your recap…").
 *
 * Use `minDurationMs` to force a minimum show time so the animation reads
 * even on fast data loads.
 */
interface Props {
  label?: string;
  minDurationMs?: number;
  onComplete?: () => void;
}

interface Crack {
  d: string;
  length: number;
  delay: number;
  width: number;
  duration: number;
}

const VIEWBOX_W = 100;
const VIEWBOX_H = 200;

// Hand-tuned cracks. Designed to look like organic fractures branching
// downward through the marble. Each path uses many short segments so the
// strokeDashoffset reveal reads as flowing liquid.
const CRACKS: Crack[] = [
  {
    d: "M48 0 L46 8 L52 18 L44 28 L50 38 L42 50 L48 62 L40 74 L46 86 L38 100 L44 114 L36 128 L42 142 L34 156 L40 170 L32 184 L38 200",
    length: 250,
    delay: 0,
    width: 1.8,
    duration: 2400
  },
  {
    d: "M44 28 L36 32 L28 38 L22 48 L18 58 L26 66 L20 76 L14 88",
    length: 110,
    delay: 350,
    width: 1.2,
    duration: 1300
  },
  {
    d: "M50 38 L58 42 L68 50 L62 60 L74 68 L82 76 L78 86 L86 96",
    length: 120,
    delay: 520,
    width: 1.4,
    duration: 1400
  },
  {
    d: "M20 0 L24 14 L18 28 L26 42 L20 56 L28 70 L22 84 L30 98 L24 114 L32 128 L26 144 L34 158 L28 174 L32 190 L26 200",
    length: 220,
    delay: 220,
    width: 1.6,
    duration: 2100
  },
  {
    d: "M26 42 L18 50 L10 58 L4 68",
    length: 60,
    delay: 700,
    width: 1.0,
    duration: 900
  },
  {
    d: "M78 0 L74 12 L82 24 L76 38 L86 52 L78 66 L88 80 L80 96 L86 112 L78 128 L84 144 L76 160 L82 176 L74 192 L78 200",
    length: 230,
    delay: 140,
    width: 1.5,
    duration: 2200
  },
  {
    d: "M86 52 L94 58 L92 70",
    length: 38,
    delay: 760,
    width: 1.0,
    duration: 700
  },
  {
    d: "M62 60 L60 76 L64 92 L58 106 L66 120 L60 134 L68 148 L62 162 L70 176 L64 190 L70 200",
    length: 170,
    delay: 880,
    width: 1.3,
    duration: 1800
  },
  {
    d: "M40 100 L46 112 L38 126 L44 138",
    length: 60,
    delay: 1100,
    width: 1.0,
    duration: 900
  }
];

// Subtle marble veins (gray, not animated)
const VEINS = [
  "M0 36 C 20 32, 40 44, 60 38 S 100 30, 100 32",
  "M0 110 C 15 116, 35 100, 55 108 S 90 120, 100 114",
  "M14 0 C 16 24, 12 50, 18 72",
  "M62 4 C 66 18, 60 30, 64 44 S 70 70, 64 88",
  "M0 170 C 22 168, 44 178, 70 172 S 96 168, 100 174"
];

export function KintsugiLoader({ label = "Generating your recap…", minDurationMs = 2400, onComplete }: Props) {
  const progressByCrack = useRef(CRACKS.map(() => new Animated.Value(0))).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelOpacity, { toValue: 1, duration: 600, delay: 220, useNativeDriver: true }).start();

    // Animate each crack's "fill progress" from 0 to 1 with staggered start.
    // We interpret 0 to 1 as the gold flowing from the top of the crack to the bottom.
    const animations = CRACKS.map((crack, i) =>
      Animated.sequence([
        Animated.delay(crack.delay),
        Animated.timing(progressByCrack[i], {
          toValue: 1,
          duration: crack.duration,
          easing: Easing.bezier(0.42, 0, 0.2, 1),
          useNativeDriver: false
        })
      ])
    );

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    const start = Date.now();
    Animated.parallel(animations).start(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDurationMs - elapsed);
      setTimeout(() => {
        onComplete?.();
      }, remaining);
    });
  }, [progressByCrack, labelOpacity, shimmer, minDurationMs, onComplete]);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.92] });

  return (
    <View style={styles.root}>
      {/* Marble base: cream-white with a soft radial highlight */}
      <View style={styles.marble} />
      <View style={styles.marbleHighlight} />

      <Svg
        width={SCREEN_W}
        height={SCREEN_H}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="goldStroke" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4D88A" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#E8C26B" stopOpacity="1" />
            <Stop offset="1" stopColor="#9F7530" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4D88A" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#C29144" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>

        {/* Marble veins underneath (static, faint gray) */}
        {VEINS.map((d, i) => (
          <Path
            key={`v-${i}`}
            d={d}
            stroke="rgba(120,114,108,0.18)"
            strokeWidth={0.25}
            fill="none"
          />
        ))}

        {/* Gold glow underlay — wider semi-transparent stroke that reads as the sheen of liquid */}
        {CRACKS.map((crack, i) => {
          const offset = progressByCrack[i].interpolate({
            inputRange: [0, 1],
            outputRange: [crack.length, 0]
          });
          return (
            <AnimatedPath
              key={`g-${i}`}
              d={crack.d}
              stroke="url(#goldGlow)"
              strokeWidth={crack.width * 2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={`${crack.length}`}
              strokeDashoffset={offset as unknown as number}
              opacity={0.55}
            />
          );
        })}

        {/* Gold core — the actual liquid line revealing through the crack */}
        {CRACKS.map((crack, i) => {
          const offset = progressByCrack[i].interpolate({
            inputRange: [0, 1],
            outputRange: [crack.length, 0]
          });
          return (
            <AnimatedPath
              key={`c-${i}`}
              d={crack.d}
              stroke="url(#goldStroke)"
              strokeWidth={crack.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={`${crack.length}`}
              strokeDashoffset={offset as unknown as number}
            />
          );
        })}
      </Svg>

      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]} pointerEvents="none">
        <Animated.View style={[styles.labelDot, { opacity: shimmerOpacity }]} />
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2EDE3" },
  marble: { ...StyleSheet.absoluteFillObject, backgroundColor: "#F4EFE6" },
  marbleHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    opacity: 0.30,
    transform: [{ translateY: -160 }, { scaleY: 0.7 }]
  },
  labelWrap: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  labelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C29144" },
  label: { fontSize: 12, color: "#5F574B", letterSpacing: 2.8, fontWeight: "700" }
});
