import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Skia,
  Turbulence,
  vec
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  type SharedValue,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
  Easing
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
  label?: string;
  minDurationMs?: number;
  onComplete?: () => void;
}

interface CrackSpec {
  d: string;
  delayMs: number;
  durationMs: number;
  width: number;
}

// Hand-tuned crack paths on a 100x200 design grid. Each path is a sequence of
// short jagged segments that branch downward like real fractures.
const CRACKS: CrackSpec[] = [
  // Main central spine, top to bottom
  {
    d: "M48 0 L46 9 L52 19 L44 30 L50 41 L42 53 L48 64 L40 76 L46 88 L38 100 L44 113 L36 126 L42 140 L34 154 L40 168 L32 182 L38 200",
    delayMs: 0,
    durationMs: 3200,
    width: 1.4
  },
  {
    d: "M44 30 L37 35 L30 41 L22 50 L18 61 L26 68 L20 78 L14 90",
    delayMs: 520,
    durationMs: 1700,
    width: 0.9
  },
  {
    d: "M50 41 L57 45 L66 52 L62 62 L72 70 L80 78 L76 88 L84 98",
    delayMs: 740,
    durationMs: 1800,
    width: 1.0
  },
  {
    d: "M22 0 L24 15 L18 30 L26 44 L20 58 L28 72 L22 86 L30 100 L24 116 L32 130 L26 146 L34 160 L28 176 L32 192 L26 200",
    delayMs: 300,
    durationMs: 2800,
    width: 1.2
  },
  { d: "M26 44 L18 51 L11 58 L5 67", delayMs: 1200, durationMs: 1000, width: 0.7 },
  {
    d: "M78 0 L74 13 L82 26 L76 40 L86 54 L78 68 L88 82 L80 97 L86 113 L78 129 L84 145 L76 161 L82 177 L74 193 L78 200",
    delayMs: 180,
    durationMs: 2900,
    width: 1.1
  },
  { d: "M86 54 L94 59 L92 71", delayMs: 1400, durationMs: 800, width: 0.7 },
  {
    d: "M62 62 L60 78 L64 94 L58 108 L66 122 L60 136 L68 150 L62 164 L70 178 L64 192 L70 200",
    delayMs: 1600,
    durationMs: 2200,
    width: 0.9
  },
  { d: "M40 100 L46 113 L38 127 L44 140", delayMs: 1900, durationMs: 900, width: 0.7 }
];

const SCALE_X = SCREEN_W / 100;
const SCALE_Y = SCREEN_H / 200;

function scalePath(d: string): { skPath: ReturnType<typeof Skia.Path.Make>; points: Array<[number, number]>; totalLen: number } {
  const tokens = d.split(/\s+/);
  const points: Array<[number, number]> = [];
  const out: string[] = [];
  for (let i = 0; i < tokens.length; ) {
    if (tokens[i] === "M" || tokens[i] === "L") {
      const x = parseFloat(tokens[i + 1]) * SCALE_X;
      const y = parseFloat(tokens[i + 2]) * SCALE_Y;
      out.push(tokens[i], x.toFixed(2), y.toFixed(2));
      points.push([x, y]);
      i += 3;
    } else {
      i += 1;
    }
  }
  const skPath = Skia.Path.MakeFromSVGString(out.join(" "))!;
  let totalLen = 0;
  for (let i = 1; i < points.length; i += 1) {
    totalLen += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return { skPath, points, totalLen };
}

const PREPARED_CRACKS = CRACKS.map((c) => ({ ...c, prepared: scalePath(c.d) }));

export function KintsugiLoader({
  label = "GENERATING YOUR RECAP",
  minDurationMs = 3200,
  onComplete
}: Props) {
  // Track completion via shared time — pump onComplete after the longest crack settles.
  useEffect(() => {
    const totalDuration = Math.max(...CRACKS.map((c) => c.delayMs + c.durationMs));
    const wait = Math.max(totalDuration, minDurationMs) + 400;
    const t = setTimeout(() => onComplete?.(), wait);
    return () => clearTimeout(t);
  }, [minDurationMs, onComplete]);

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Marble base + radial highlight */}
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
          <RadialGradient
            c={vec(SCREEN_W * 0.42, SCREEN_H * 0.32)}
            r={SCREEN_W * 0.95}
            colors={["#FBF7EE", "#F2EBDD", "#E5DCC9"]}
            positions={[0, 0.55, 1]}
          />
        </Rect>

        {/* Procedural marble veining — turbulence noise as a subtle gray wash */}
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} opacity={0.20}>
          <Turbulence freqX={0.012} freqY={0.025} octaves={2} seed={7} />
        </Rect>

        {/* Warm directional wash that grounds the slab */}
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} opacity={0.22}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, SCREEN_H)}
            colors={["rgba(255,255,255,0)", "rgba(120,90,40,0.18)"]}
          />
        </Rect>

        {/* Stack each crack as its own animated component to keep hooks linear */}
        {PREPARED_CRACKS.map((spec, i) => (
          <CrackLine key={i} spec={spec} />
        ))}
      </Canvas>

      <View pointerEvents="none" style={styles.labelWrap}>
        <View style={styles.labelRule} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.labelRule} />
      </View>
    </View>
  );
}

function CrackLine({ spec }: { spec: typeof PREPARED_CRACKS[number] }) {
  const trim = useSharedValue(0);

  useEffect(() => {
    trim.value = withDelay(
      spec.delayMs,
      withTiming(1, { duration: spec.durationMs, easing: Easing.bezier(0.42, 0, 0.18, 1) })
    );
  }, [trim, spec.delayMs, spec.durationMs]);

  // Compute the (x, y) at the current trim along the polyline for the leading bead.
  const beadPosition = useDerivedValue(() => {
    "worklet";
    const t = trim.value;
    const points = spec.prepared.points;
    const totalLen = spec.prepared.totalLen;
    if (points.length < 2 || totalLen === 0) return { x: 0, y: 0 };
    const target = t * totalLen;
    let traveled = 0;
    for (let i = 1; i < points.length; i += 1) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      const seg = Math.hypot(dx, dy);
      if (traveled + seg >= target) {
        const localT = seg === 0 ? 0 : (target - traveled) / seg;
        return {
          x: points[i - 1][0] + dx * localT,
          y: points[i - 1][1] + dy * localT
        };
      }
      traveled += seg;
    }
    return { x: points[points.length - 1][0], y: points[points.length - 1][1] };
  });

  const beadX = useDerivedValue(() => beadPosition.value.x);
  const beadY = useDerivedValue(() => beadPosition.value.y);
  // Bead fades in just after the flow starts, stays bright while moving,
  // then settles out as the flow completes (the gold has reached its rest).
  const beadOpacity = useDerivedValue(() => {
    "worklet";
    const t = trim.value;
    if (t < 0.02) return 0;
    if (t > 0.985) return Math.max(0, (1 - t) / 0.015);
    return 1;
  });

  const path = spec.prepared.skPath;
  const sw = spec.width;

  return (
    <Group>
      {/* Atmospheric warm halo — very wide, very soft */}
      <Path
        path={path}
        start={0}
        end={trim}
        style="stroke"
        strokeWidth={sw * 7}
        strokeCap="round"
        strokeJoin="round"
        color="#C28A2D"
        opacity={0.20}
      >
        <BlurMask blur={9} style="normal" />
      </Path>

      {/* Sheen layer — medium width, blurred, gradient */}
      <Path
        path={path}
        start={0}
        end={trim}
        style="stroke"
        strokeWidth={sw * 3}
        strokeCap="round"
        strokeJoin="round"
        opacity={0.85}
      >
        <BlurMask blur={3} style="normal" />
        <SkiaLinearGradient
          start={vec(0, 0)}
          end={vec(0, SCREEN_H)}
          colors={["#F7E0A0", "#E2B864", "#9F7530"]}
          positions={[0, 0.5, 1]}
        />
      </Path>

      {/* Molten core — bright sharp gold line */}
      <Path
        path={path}
        start={0}
        end={trim}
        style="stroke"
        strokeWidth={sw * 1.2}
        strokeCap="round"
        strokeJoin="round"
      >
        <SkiaLinearGradient
          start={vec(0, 0)}
          end={vec(0, SCREEN_H)}
          colors={["#FCEAB0", "#F3CE7A", "#C29144"]}
          positions={[0, 0.5, 1]}
        />
      </Path>

      {/* Leading bead — the molten drop riding the front of the flow */}
      <Group opacity={beadOpacity}>
        {/* Outer glow halo */}
        <Circle cx={beadX} cy={beadY} r={sw * 5.5} opacity={0.55}>
          <BlurMask blur={7} style="normal" />
          <SkiaLinearGradient
            start={vec(-sw * 6, -sw * 6)}
            end={vec(sw * 6, sw * 6)}
            colors={["#FCEAB0", "rgba(252,234,176,0)"]}
            positions={[0, 1]}
          />
        </Circle>
        {/* Bright core */}
        <Circle cx={beadX} cy={beadY} r={sw * 1.4}>
          <SkiaLinearGradient
            start={vec(-sw, -sw)}
            end={vec(sw, sw)}
            colors={["#FFFCEC", "#F3CE7A", "#C29144"]}
            positions={[0, 0.5, 1]}
          />
        </Circle>
      </Group>
    </Group>
  );
}

function HiddenWorkletReferences(_props: { x: SharedValue<number> }) {
  // Reanimated 4 requires worklet exports to be hoistable; this stub keeps
  // SharedValue<number> alive across versions where the import isn't fully
  // tree-shaken otherwise.
  return null;
}
void HiddenWorkletReferences;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2EBDD" },
  labelWrap: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  labelRule: { width: 22, height: 1, backgroundColor: "#9F7530", opacity: 0.45 },
  label: { fontSize: 11, color: "#5F4923", letterSpacing: 3.4, fontWeight: "700" }
});
