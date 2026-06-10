import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BlurMask,
  Canvas,
  ColorMatrix,
  Fill,
  Group,
  Image as SkImage,
  LinearGradient as SkiaLinearGradient,
  Path,
  RadialGradient,
  Rect,
  RoundedRect,
  Skia,
  Text as SkText,
  matchFont,
  rect,
  vec,
  useImage,
  type SkImage as SkImageType
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { ArrowDown, Share2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { KintsugiLoader } from "../components/KintsugiLoader";
import { colors } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const HORIZON_Y = SCREEN_H * 0.42;
const FLOOR_Y = SCREEN_H * 0.78;

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatLongDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(new Date(iso));
}

const titleFont = matchFont({ fontFamily: "Helvetica", fontSize: 32, fontWeight: "800" } as never);
const microFont = matchFont({ fontFamily: "Helvetica", fontSize: 10, fontWeight: "700" } as never);
const bodyFont = matchFont({ fontFamily: "Helvetica", fontSize: 14, fontWeight: "500" } as never);
const bigNumberFont = matchFont({ fontFamily: "Helvetica", fontSize: 96, fontWeight: "800" } as never);

interface RecapUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface RecapHighlight {
  id: string;
  url: string;
  caption: string | null;
  kind: string;
  capturedAt: string | null;
  addedBy: RecapUser | null;
}

interface RecapResponse {
  paragraphs: string[];
  stats: { memories: number; contributors: number; daysSpan: number; reactions: number; comments: number };
  topEmoji: string | null;
  highlights: RecapHighlight[];
  dateRange: { start: string; end: string };
  contributorList: RecapUser[];
  topComment: { body: string; createdAt: string; author: RecapUser | null; mediaUrl: string | null } | null;
  coverUrl: string | null;
  locationName: string | null;
  eventDate: string;
  unlockAt: string | null;
  collectionClosesAt: string | null;
  generatedAt: string;
}

type StepKind =
  | { id: string; kind: "title"; title: string; date: string }
  | { id: string; kind: "photo-wall"; url: string; caption: string | null; date: string | null; side: "left" | "right" }
  | { id: string; kind: "photo-portal"; url: string; caption: string | null }
  | { id: string; kind: "stat"; value: number; label: string }
  | { id: string; kind: "quote"; body: string; authorName: string; createdAt: string }
  | { id: string; kind: "names"; people: RecapUser[]; line: string }
  | { id: string; kind: "finale" };

/* ------------------------------------------------------------------ */

export function EventRecapScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "EventRecap">) {
  const insets = useSafeAreaInsets();
  const [recap, setRecap] = useState<RecapResponse | undefined>();
  const [loaderDone, setLoaderDone] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    api<RecapResponse>(`/events/${route.params.eventId}/summary`)
      .then(setRecap)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not generate recap"));
  }, [route.params.eventId]);

  const ready = !!recap && loaderDone;

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F2EBDD" }}>
        <KintsugiLoader label="GENERATING YOUR RECAP" onComplete={() => setLoaderDone(true)} />
        {error ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return <Walkway navigation={navigation} route={route} recap={recap!} topInset={insets.top} bottomInset={insets.bottom} />;
}

/* ------------------------------------------------------------------ */
/* WALKWAY                                                            */
/* ------------------------------------------------------------------ */

function Walkway({
  navigation,
  route,
  recap,
  topInset,
  bottomInset
}: {
  navigation: NativeStackScreenProps<RootStackParamList, "EventRecap">["navigation"];
  route: NativeStackScreenProps<RootStackParamList, "EventRecap">["route"];
  recap: RecapResponse;
  topInset: number;
  bottomInset: number;
}) {
  const steps = useMemo<StepKind[]>(() => buildSteps(recap, route.params.title), [recap, route.params.title]);

  // cameraZ is the user's position along the corridor (0 = first step, increments by 1 each tap).
  // We animate it smoothly with reanimated so the camera glides forward.
  const cameraZ = useSharedValue(0);
  const dismissDrag = useSharedValue(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissY, setDismissY] = useState(0);

  function advance() {
    if (stepIndex >= steps.length - 1) {
      // Already at finale — do nothing extra; user closes manually.
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    const next = stepIndex + 1;
    setStepIndex(next);
    cameraZ.value = withTiming(next, { duration: 1100, easing: Easing.bezier(0.42, 0, 0.18, 1) });
  }

  function rewind() {
    if (stepIndex <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    const next = stepIndex - 1;
    setStepIndex(next);
    cameraZ.value = withTiming(next, { duration: 800, easing: Easing.bezier(0.42, 0, 0.18, 1) });
  }

  function close() {
    navigation.goBack();
  }

  async function share() {
    try {
      await Share.share({
        message: `${route.params.title} — ${recap.stats.memories} memories\n\n${recap.paragraphs.join("\n\n")}`
      });
    } catch {
      // user cancelled
    }
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, g) => g.dy > 16 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_evt, g) => {
          if (g.dy > 0) {
            dismissDrag.value = g.dy;
            setDismissY(g.dy);
          }
        },
        onPanResponderRelease: (_evt, g) => {
          if (g.dy > 140) {
            close();
          } else {
            dismissDrag.value = withSpring(0, { damping: 18, stiffness: 200 });
            setDismissY(0);
          }
        }
      }),
    [dismissDrag]
  );

  const dismissStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissDrag.value }],
    opacity: 1 - Math.min(0.6, dismissDrag.value / 400)
  }));

  const atFinale = stepIndex >= steps.length - 1;

  return (
    <Animated.View style={[styles.root, dismissStyle]} {...pan.panHandlers}>
      <CorridorCanvas steps={steps} cameraZ={cameraZ} />

      {atFinale ? (
        <FinaleCanvas
          recap={recap}
          title={route.params.title}
        />
      ) : null}

      {/* Step indicator: minimal vertical pip column on the right */}
      <View style={[styles.stepColumn, { top: topInset + 90 }]} pointerEvents="none">
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepPip,
              { backgroundColor: i <= stepIndex ? colors.gold : "rgba(232,194,107,0.18)" }
            ]}
          />
        ))}
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { top: topInset + 12 }]} pointerEvents="box-none">
        <View style={styles.recapBadge}>
          <View style={styles.recapBadgeDot} />
          <Text style={styles.recapBadgeText}>AI RECAP · {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</Text>
        </View>
        <View style={styles.topBarRight}>
          <Pressable onPress={share} style={styles.iconBtn} hitSlop={10}>
            <Share2 color={colors.fog} size={14} />
          </Pressable>
          <Pressable onPress={close} style={styles.iconBtn} hitSlop={10}>
            <X color={colors.fog} size={16} />
          </Pressable>
        </View>
      </View>

      {/* Tap zones: left = back, right + center = forward */}
      <Pressable onPress={rewind} style={[styles.tapZone, { left: 0, width: SCREEN_W * 0.22 }]} />
      <Pressable onPress={advance} style={[styles.tapZone, { left: SCREEN_W * 0.22, right: 0 }]} />

      {/* Bottom hint */}
      <View pointerEvents="none" style={[styles.bottomHint, { bottom: bottomInset + 24 }]}>
        {atFinale ? (
          <Text style={styles.hintText}>SWIPE DOWN TO CLOSE</Text>
        ) : (
          <>
            <Text style={styles.hintText}>TAP TO TAKE ANOTHER STEP</Text>
            {dismissY === 0 ? <ArrowDown color={colors.fog} size={10} style={{ opacity: 0.4, marginTop: 6 }} /> : null}
          </>
        )}
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* CORRIDOR CANVAS                                                    */
/* ------------------------------------------------------------------ */

function CorridorCanvas({ steps, cameraZ }: { steps: StepKind[]; cameraZ: SharedValue<number> }) {
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Sky / ceiling — warm muted gradient */}
      <Rect x={0} y={0} width={SCREEN_W} height={HORIZON_Y}>
        <SkiaLinearGradient
          start={vec(0, 0)}
          end={vec(0, HORIZON_Y)}
          colors={["#0B0810", "#15101C", "#1F1622"]}
          positions={[0, 0.55, 1]}
        />
      </Rect>

      {/* Floor — marble-like warm cream with reflection gradient */}
      <Rect x={0} y={HORIZON_Y} width={SCREEN_W} height={SCREEN_H - HORIZON_Y}>
        <SkiaLinearGradient
          start={vec(0, HORIZON_Y)}
          end={vec(0, SCREEN_H)}
          colors={["#1F1622", "#0F0810", "#070409"]}
          positions={[0, 0.4, 1]}
        />
      </Rect>

      {/* Floor reflective sheen — vertical band of light from horizon to viewer */}
      <Rect x={SCREEN_W * 0.25} y={HORIZON_Y} width={SCREEN_W * 0.5} height={SCREEN_H - HORIZON_Y} opacity={0.18}>
        <SkiaLinearGradient
          start={vec(0, HORIZON_Y)}
          end={vec(0, SCREEN_H)}
          colors={["rgba(232,194,107,0.55)", "rgba(232,194,107,0)"]}
        />
      </Rect>

      {/* Vanishing point glow at horizon */}
      <Group>
        <Rect x={0} y={HORIZON_Y - 60} width={SCREEN_W} height={140} opacity={0.55}>
          <RadialGradient
            c={vec(SCREEN_W / 2, HORIZON_Y)}
            r={180}
            colors={["#E8C26B", "rgba(232,194,107,0)"]}
            positions={[0, 1]}
          />
        </Rect>
      </Group>

      {/* Perspective floor lines — receding into vanishing point */}
      <FloorLines cameraZ={cameraZ} />

      {/* Atmospheric depth fog over the horizon band */}
      <Rect x={0} y={HORIZON_Y - 80} width={SCREEN_W} height={160} opacity={0.45}>
        <SkiaLinearGradient
          start={vec(0, HORIZON_Y - 80)}
          end={vec(0, HORIZON_Y + 80)}
          colors={["rgba(15,8,16,0)", "rgba(20,12,24,0.6)", "rgba(15,8,16,0)"]}
        />
      </Rect>

      {/* The memories themselves */}
      {steps.map((step, i) => (
        <CorridorItem key={step.id} step={step} z={i} cameraZ={cameraZ} />
      ))}

      {/* Soft vignette around the edges */}
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
        <RadialGradient
          c={vec(SCREEN_W / 2, SCREEN_H / 2)}
          r={SCREEN_W * 0.85}
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          positions={[0, 0.6, 1]}
        />
      </Rect>
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* FLOOR LINES                                                        */
/* ------------------------------------------------------------------ */

function FloorLines({ cameraZ }: { cameraZ: SharedValue<number> }) {
  const lines = [0, 1, 2, 3, 4, 5];
  return (
    <Group>
      {lines.map((i) => (
        <FloorLine key={i} lineIndex={i} cameraZ={cameraZ} />
      ))}
    </Group>
  );
}

function FloorLine({ lineIndex, cameraZ }: { lineIndex: number; cameraZ: SharedValue<number> }) {
  // Each line lives at z = lineIndex - cameraZ fraction. As camera advances,
  // distant lines scroll toward the viewer.
  const offset = useDerivedValue(() => {
    "worklet";
    const z = (lineIndex - (cameraZ.value % 1)) * 0.5;
    // Map z (0 = far, 1+ = near) onto a y position from HORIZON_Y to SCREEN_H
    const t = 1 - 1 / (1 + z * 1.5);
    return HORIZON_Y + t * (SCREEN_H - HORIZON_Y);
  });
  const opacity = useDerivedValue(() => {
    "worklet";
    const z = (lineIndex - (cameraZ.value % 1)) * 0.5;
    const t = 1 - 1 / (1 + z * 1.5);
    return Math.max(0, Math.min(1, 0.18 + t * 0.4));
  });
  const linePath = useDerivedValue(() => {
    "worklet";
    const z = (lineIndex - (cameraZ.value % 1)) * 0.5;
    const t = 1 - 1 / (1 + z * 1.5);
    const y = HORIZON_Y + t * (SCREEN_H - HORIZON_Y);
    const halfWidth = SCREEN_W * 0.5 * (0.1 + t * 0.9);
    const cx = SCREEN_W / 2;
    const p = Skia.Path.Make();
    p.moveTo(cx - halfWidth, y);
    p.lineTo(cx + halfWidth, y);
    return p;
  });
  void offset;
  return (
    <Path path={linePath} style="stroke" strokeWidth={0.8} color="#E8C26B" opacity={opacity} />
  );
}

/* ------------------------------------------------------------------ */
/* CORRIDOR ITEM                                                      */
/* ------------------------------------------------------------------ */

function CorridorItem({ step, z, cameraZ }: { step: StepKind; z: number; cameraZ: SharedValue<number> }) {
  switch (step.kind) {
    case "title":
      return <TitleItem step={step} z={z} cameraZ={cameraZ} />;
    case "photo-wall":
      return <PhotoWallItem step={step} z={z} cameraZ={cameraZ} />;
    case "photo-portal":
      return <PhotoPortalItem step={step} z={z} cameraZ={cameraZ} />;
    case "stat":
      return <StatItem step={step} z={z} cameraZ={cameraZ} />;
    case "quote":
      return <QuoteItem step={step} z={z} cameraZ={cameraZ} />;
    case "names":
      return <NamesItem step={step} z={z} cameraZ={cameraZ} />;
    case "finale":
      return <FinaleItem z={z} cameraZ={cameraZ} />;
  }
}

/**
 * Returns a depth descriptor for an item at world-z `z` given camera-z `cameraZ`.
 * - distance: signed distance from camera (negative = ahead, positive = behind)
 * - scale: perspective scale based on distance
 * - blur: gpu blur radius based on how far ahead the item still is
 * - opacity: fades from 0 (far ahead) to 1 (close) and back to 0 (passed)
 * - yOffset: vertical offset to simulate item at a particular depth on the floor
 */
function useDepth(z: number, cameraZ: SharedValue<number>) {
  const distance = useDerivedValue(() => z - cameraZ.value);
  const scale = useDerivedValue(() => {
    "worklet";
    const d = z - cameraZ.value;
    // perspective: items in the distance shrink, items at camera are 1.0, items behind grow large quickly
    if (d >= 0) {
      return 1 / (1 + d * 0.55);
    }
    return 1 / Math.max(0.001, 1 + d * 1.4);
  });
  const blur = useDerivedValue(() => {
    "worklet";
    const d = z - cameraZ.value;
    if (d > 0.05) return Math.min(24, d * 12);
    if (d < -0.5) return Math.min(20, -d * 14);
    return 0;
  });
  const opacity = useDerivedValue(() => {
    "worklet";
    const d = z - cameraZ.value;
    if (d > 3) return 0;
    if (d > 0) return Math.max(0, 1 - d / 3);
    if (d > -0.8) return 1;
    if (d > -1.2) return Math.max(0, 1 - (-d - 0.8) / 0.4);
    return 0;
  });
  return { distance, scale, blur, opacity };
}

/* ----- title ----- */

function TitleItem({ step, z, cameraZ }: { step: Extract<StepKind, { kind: "title" }>; z: number; cameraZ: SharedValue<number> }) {
  const { scale, blur, opacity } = useDepth(z, cameraZ);
  const cy = useDerivedValue(() => SCREEN_H * 0.42 + (z - cameraZ.value) * 24);
  const titleWidth = step.title.length * 16;
  const x = useDerivedValue(() => SCREEN_W / 2 - (titleWidth * scale.value) / 2);
  const fontSize = useDerivedValue(() => 36 * scale.value);
  const dateWidth = step.date.length * 6;
  const dateX = useDerivedValue(() => SCREEN_W / 2 - (dateWidth * scale.value) / 2);
  const dateY = useDerivedValue(() => cy.value + 36 * scale.value);
  return (
    <Group opacity={opacity}>
      <SkText x={dateX} y={cy} text={step.date} font={microFont} color="#E8C26B" />
      <SkText x={x} y={useDerivedValue(() => cy.value + 28 * scale.value)} text={step.title} font={titleFont} color="#F5F1EA" />
      {/* Underline rule */}
      <Rect
        x={useDerivedValue(() => SCREEN_W / 2 - 22)}
        y={dateY}
        width={44}
        height={1}
        color="#E8C26B"
        opacity={0.55}
      />
      <BlurMask blur={blur} style="normal" />
    </Group>
  );
}

/* ----- photo wall (becomes part of the corridor wall on left or right) ----- */

function PhotoWallItem({ step, z, cameraZ }: { step: Extract<StepKind, { kind: "photo-wall" }>; z: number; cameraZ: SharedValue<number> }) {
  const image = useImage(step.url);
  const { scale, blur, opacity } = useDepth(z, cameraZ);

  const isLeft = step.side === "left";
  const baseW = SCREEN_W * 0.62;
  const baseH = SCREEN_H * 0.72;

  const w = useDerivedValue(() => baseW * scale.value);
  const h = useDerivedValue(() => baseH * scale.value);
  const x = useDerivedValue(() => {
    "worklet";
    const sw = baseW * scale.value;
    return isLeft ? -sw * 0.35 + (1 - scale.value) * 60 : SCREEN_W - sw * 0.65 - (1 - scale.value) * 60;
  });
  const y = useDerivedValue(() => SCREEN_H * 0.5 - (baseH * scale.value) / 2 + (z - cameraZ.value) * 18);

  const wallPath = useDerivedValue(() => {
    "worklet";
    const sw = w.value;
    const sh = h.value;
    const startX = x.value;
    const startY = y.value;
    const skew = isLeft ? -sw * 0.18 : sw * 0.18;
    const path = Skia.Path.Make();
    if (isLeft) {
      path.moveTo(startX, startY + 30);
      path.lineTo(startX + sw, startY);
      path.lineTo(startX + sw, startY + sh);
      path.lineTo(startX, startY + sh - 30);
    } else {
      path.moveTo(startX + skew, startY);
      path.lineTo(startX + sw, startY + 30);
      path.lineTo(startX + sw, startY + sh - 30);
      path.lineTo(startX + skew, startY + sh);
    }
    path.close();
    return path;
  });

  // Caption x/y hooks must be unconditional. Compute even when there's no caption.
  const captionX = useDerivedValue(() => x.value + 18);
  const captionY = useDerivedValue(() => y.value + h.value - 36);
  const dateX = useDerivedValue(() => x.value + 18);
  const dateY = useDerivedValue(() => y.value + h.value - 14);
  const shadowY = useDerivedValue(() => y.value + h.value - 80 * scale.value);

  if (!image) return null;
  return (
    <Group opacity={opacity}>
      {/* Photo masked to the angled wall */}
      <Group clip={wallPath}>
        <SkImage
          image={image}
          x={x}
          y={y}
          width={w}
          height={h}
          fit="cover"
        />
        {/* Cool color grade — pull saturation down a touch so it sits in the corridor */}
        <Group blendMode="multiply">
          <Rect x={x} y={y} width={w} height={h} color="#FFF6E6" opacity={0.18} />
        </Group>
        {/* Gradient overlay — darker at the edges so it feels like a wall lit from above */}
        <Rect x={x} y={y} width={w} height={h} opacity={0.55}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, SCREEN_H)}
            colors={["rgba(8,6,12,0.0)", "rgba(8,6,12,0.85)"]}
          />
        </Rect>
        {/* Bottom-up shadow to suggest the wall meeting the floor */}
        <Rect x={x} y={shadowY} width={w} height={80} opacity={0.7}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, 80)}
            colors={["rgba(8,6,12,0)", "rgba(8,6,12,0.95)"]}
          />
        </Rect>
      </Group>

      <BlurMask blur={blur} style="normal" />

      {/* Caption + date as etched text near the bottom edge of the panel */}
      {step.caption ? (
        <CaptionText text={`"${step.caption}"`} x={captionX} y={captionY} scale={scale} />
      ) : null}
      {step.date ? (
        <CaptionText
          text={formatLongDate(step.date).toUpperCase()}
          x={dateX}
          y={dateY}
          scale={scale}
          color="#E8C26B"
          size={9}
        />
      ) : null}
    </Group>
  );
}

/* ----- photo portal — a centered window suspended in the corridor ----- */

function PhotoPortalItem({ step, z, cameraZ }: { step: Extract<StepKind, { kind: "photo-portal" }>; z: number; cameraZ: SharedValue<number> }) {
  const image = useImage(step.url);
  const { scale, blur, opacity } = useDepth(z, cameraZ);

  const baseW = SCREEN_W * 0.74;
  const baseH = SCREEN_H * 0.46;

  const w = useDerivedValue(() => baseW * scale.value);
  const h = useDerivedValue(() => baseH * scale.value);
  const x = useDerivedValue(() => SCREEN_W / 2 - w.value / 2);
  const y = useDerivedValue(() => SCREEN_H * 0.38 - h.value / 2 + (z - cameraZ.value) * 22);

  const haloX = useDerivedValue(() => x.value - 14);
  const haloY = useDerivedValue(() => y.value - 14);
  const haloW = useDerivedValue(() => w.value + 28);
  const haloH = useDerivedValue(() => h.value + 28);
  const clipPath = useDerivedValue(() => {
    "worklet";
    const p = Skia.Path.Make();
    p.addRRect({ rect: { x: x.value, y: y.value, width: w.value, height: h.value }, rx: 18, ry: 18 });
    return p;
  });
  const scrimY = useDerivedValue(() => y.value + h.value - 90 * scale.value);
  const captionX = useDerivedValue(() => x.value + 24);
  const captionY = useDerivedValue(() => y.value + h.value - 22);

  if (!image) return null;

  return (
    <Group opacity={opacity}>
      {/* Soft glow halo around the portal */}
      <RoundedRect x={haloX} y={haloY} width={haloW} height={haloH} r={26} opacity={0.35}>
        <BlurMask blur={26} style="normal" />
        <SkiaLinearGradient
          start={vec(0, 0)}
          end={vec(SCREEN_W, SCREEN_H)}
          colors={["#E8C26B", "#9F7530"]}
        />
      </RoundedRect>

      {/* The portal itself — masked image with rounded corners */}
      <Group clip={clipPath}>
        <SkImage image={image} x={x} y={y} width={w} height={h} fit="cover" />
        <Rect x={x} y={y} width={w} height={h} opacity={0.10}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, SCREEN_H)}
            colors={["rgba(252,234,176,0.4)", "rgba(120,80,30,0)"]}
          />
        </Rect>
        <Rect x={x} y={scrimY} width={w} height={90} opacity={0.7}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, 90)}
            colors={["rgba(8,6,12,0)", "rgba(8,6,12,0.95)"]}
          />
        </Rect>
      </Group>

      <BlurMask blur={blur} style="normal" />

      {step.caption ? (
        <CaptionText text={`"${step.caption}"`} x={captionX} y={captionY} scale={scale} size={14} />
      ) : null}
    </Group>
  );
}

/* ----- stat — minimal floating numeral suspended in space ----- */

function StatItem({ step, z, cameraZ }: { step: Extract<StepKind, { kind: "stat" }>; z: number; cameraZ: SharedValue<number> }) {
  const { scale, blur, opacity } = useDepth(z, cameraZ);
  const valueText = String(step.value);
  const valueWidth = valueText.length * 56;
  const x = useDerivedValue(() => SCREEN_W / 2 - (valueWidth * scale.value) / 2);
  const y = useDerivedValue(() => SCREEN_H * 0.48 + (z - cameraZ.value) * 18);
  const labelWidth = step.label.length * 7;
  const labelX = useDerivedValue(() => SCREEN_W / 2 - (labelWidth * scale.value) / 2);
  const labelY = useDerivedValue(() => y.value + 32);

  return (
    <Group opacity={opacity}>
      <SkText x={x} y={y} text={valueText} font={bigNumberFont} color="#F5F1EA" />
      <SkText x={labelX} y={labelY} text={step.label} font={microFont} color="#E8C26B" />
      <BlurMask blur={blur} style="normal" />
    </Group>
  );
}

/* ----- quote — a printed line attributed to the speaker ----- */

function QuoteItem({ step, z, cameraZ }: { step: Extract<StepKind, { kind: "quote" }>; z: number; cameraZ: SharedValue<number> }) {
  const { scale, blur, opacity } = useDepth(z, cameraZ);
  const cy = useDerivedValue(() => SCREEN_H * 0.42 + (z - cameraZ.value) * 18);

  // Wrap the body to ~28 chars per line; we render up to 4 lines.
  const lines = useMemo(() => wrapText(step.body, 28).slice(0, 4), [step.body]);

  return (
    <Group opacity={opacity}>
      {lines.map((line, i) => {
        const lineWidth = line.length * 11;
        const lx = useDerivedValue(() => SCREEN_W / 2 - (lineWidth * scale.value) / 2);
        const ly = useDerivedValue(() => cy.value + i * 28 * scale.value);
        return <SkText key={i} x={lx} y={ly} text={line} font={titleFont} color="#F5F1EA" />;
      })}
      <SkText
        x={useDerivedValue(() => SCREEN_W / 2 - (step.authorName.length * 4))}
        y={useDerivedValue(() => cy.value + (lines.length + 1) * 28)}
        text={`— ${step.authorName.toUpperCase()}  ·  ${formatLongDate(step.createdAt).toUpperCase()}`}
        font={microFont}
        color="#E8C26B"
      />
      <BlurMask blur={blur} style="normal" />
    </Group>
  );
}

/* ----- names — list of contributors, set like a film credit ----- */

function NamesItem({ step, z, cameraZ }: { step: Extract<StepKind, { kind: "names" }>; z: number; cameraZ: SharedValue<number> }) {
  const { blur, opacity } = useDepth(z, cameraZ);
  const lines = step.people.map((p) => p.displayName);
  return (
    <Group opacity={opacity}>
      <SkText
        x={SCREEN_W / 2 - 18}
        y={SCREEN_H * 0.34}
        text="CAST"
        font={microFont}
        color="#E8C26B"
      />
      {lines.map((line, i) => (
        <SkText
          key={i}
          x={SCREEN_W / 2 - line.length * 8}
          y={SCREEN_H * 0.42 + i * 32}
          text={line}
          font={titleFont}
          color="#F5F1EA"
        />
      ))}
      <SkText
        x={SCREEN_W / 2 - step.line.length * 3.5}
        y={SCREEN_H * 0.42 + lines.length * 32 + 18}
        text={step.line}
        font={bodyFont}
        color="#9C95A0"
      />
      <BlurMask blur={blur} style="normal" />
    </Group>
  );
}

/* ----- finale — a single seamless composition ----- */

function FinaleItem({ z, cameraZ }: { z: number; cameraZ: SharedValue<number> }) {
  // The finale is rendered as a separate canvas layer below for full-screen composition.
  // Here we just mark our depth presence (effectively invisible while approaching).
  const { opacity } = useDepth(z, cameraZ);
  void opacity;
  return null;
}

/* ------------------------------------------------------------------ */
/* FINALE COMPOSITION                                                 */
/* ------------------------------------------------------------------ */

interface FinaleSlot {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
  /** mask shape kind */
  shape: "ellipse" | "blob" | "tall" | "wide" | "skew";
}

const FINALE_SLOTS: FinaleSlot[] = [
  // Anchor — big blob on the left, photo 0
  { cx: SCREEN_W * 0.32, cy: SCREEN_H * 0.38, rx: SCREEN_W * 0.46, ry: SCREEN_H * 0.30, rotate: -6, shape: "blob" },
  // Top right — tall portrait
  { cx: SCREEN_W * 0.76, cy: SCREEN_H * 0.26, rx: SCREEN_W * 0.30, ry: SCREEN_H * 0.22, rotate: 4, shape: "tall" },
  // Bottom right — wide
  { cx: SCREEN_W * 0.72, cy: SCREEN_H * 0.66, rx: SCREEN_W * 0.36, ry: SCREEN_H * 0.20, rotate: -3, shape: "wide" },
  // Bottom left — skewed
  { cx: SCREEN_W * 0.30, cy: SCREEN_H * 0.78, rx: SCREEN_W * 0.32, ry: SCREEN_H * 0.15, rotate: 5, shape: "skew" },
  // Top center — ellipse accent
  { cx: SCREEN_W * 0.54, cy: SCREEN_H * 0.18, rx: SCREEN_W * 0.20, ry: SCREEN_H * 0.10, rotate: 2, shape: "ellipse" },
  // Mid blob spanning the gap
  { cx: SCREEN_W * 0.52, cy: SCREEN_H * 0.52, rx: SCREEN_W * 0.24, ry: SCREEN_H * 0.18, rotate: -8, shape: "blob" }
];

function FinaleCanvas({ recap, title }: { recap: RecapResponse; title: string }) {
  const fadeIn = useSharedValue(0);
  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 1200, easing: Easing.bezier(0.42, 0, 0.18, 1) });
  }, [fadeIn]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  const photos = recap.highlights.slice(0, FINALE_SLOTS.length);
  const dateLabel = formatRange(recap.dateRange.start, recap.dateRange.end).toUpperCase();

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Backdrop — warm dark plum, edges fade to ink */}
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
          <RadialGradient
            c={vec(SCREEN_W / 2, SCREEN_H * 0.45)}
            r={SCREEN_W * 1.1}
            colors={["#241726", "#100A12", "#070409"]}
            positions={[0, 0.6, 1]}
          />
        </Rect>

        {/* The interlocking composition — each photo masked into an organic
            shape, blended together. No frames, no borders. */}
        <Group>
          {photos.map((photo, i) => (
            <FinalePhoto key={photo.id} url={photo.url} slot={FINALE_SLOTS[i]} index={i} />
          ))}
        </Group>

        {/* Bottom-to-top scrim for legibility under the title block */}
        <Rect x={0} y={SCREEN_H - 280} width={SCREEN_W} height={280}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, 280)}
            colors={["rgba(7,4,9,0)", "rgba(7,4,9,0.92)"]}
          />
        </Rect>
      </Canvas>

      {/* Title block sits in normal RN so we get full typography control */}
      <View style={finale.titleBlock}>
        <View style={finale.dateRow}>
          <View style={finale.dateRule} />
          <Text style={finale.dateText}>{dateLabel}</Text>
          <View style={finale.dateRule} />
        </View>
        <Text style={finale.title}>{title}</Text>
        {recap.locationName ? <Text style={finale.location}>{recap.locationName.toUpperCase()}</Text> : null}
        <Text style={finale.footer}>{recap.stats.memories} MEMORIES · {recap.contributorList.length} {recap.contributorList.length === 1 ? "PERSON" : "PEOPLE"} · {recap.stats.daysSpan} {recap.stats.daysSpan === 1 ? "DAY" : "DAYS"}</Text>
      </View>
    </Animated.View>
  );
}

function FinalePhoto({ url, slot, index }: { url: string; slot: FinaleSlot; index: number }) {
  const image = useImage(url);

  // Build the mask path based on shape kind — hook called unconditionally.
  const maskPath = useMemo(() => {
    const p = Skia.Path.Make();
    switch (slot.shape) {
      case "blob": {
        // Asymmetric blob via several bezier curves around the center
        const cx = slot.cx;
        const cy = slot.cy;
        const rx = slot.rx;
        const ry = slot.ry;
        // 6-point asymmetric blob
        const points = [
          { ang: 0, r: 1.05 },
          { ang: 60, r: 0.92 },
          { ang: 130, r: 1.08 },
          { ang: 190, r: 0.94 },
          { ang: 250, r: 1.06 },
          { ang: 310, r: 0.96 }
        ];
        const xy = points.map(({ ang, r }) => ({
          x: cx + Math.cos((ang * Math.PI) / 180) * rx * r,
          y: cy + Math.sin((ang * Math.PI) / 180) * ry * r
        }));
        p.moveTo(xy[0].x, xy[0].y);
        for (let i = 0; i < xy.length; i += 1) {
          const next = xy[(i + 1) % xy.length];
          const mx = (xy[i].x + next.x) / 2;
          const my = (xy[i].y + next.y) / 2;
          p.quadTo(xy[i].x, xy[i].y, mx, my);
        }
        p.close();
        break;
      }
      case "tall": {
        const x = slot.cx - slot.rx;
        const y = slot.cy - slot.ry;
        p.addRRect({ rect: { x, y, width: slot.rx * 2, height: slot.ry * 2 }, rx: slot.rx, ry: slot.rx });
        break;
      }
      case "wide": {
        const x = slot.cx - slot.rx;
        const y = slot.cy - slot.ry;
        p.addRRect({ rect: { x, y, width: slot.rx * 2, height: slot.ry * 2 }, rx: 30, ry: 30 });
        break;
      }
      case "ellipse": {
        p.addOval({ x: slot.cx - slot.rx, y: slot.cy - slot.ry, width: slot.rx * 2, height: slot.ry * 2 });
        break;
      }
      case "skew": {
        // Parallelogram
        const x = slot.cx - slot.rx;
        const y = slot.cy - slot.ry;
        const skew = slot.rx * 0.25;
        p.moveTo(x + skew, y);
        p.lineTo(x + slot.rx * 2, y);
        p.lineTo(x + slot.rx * 2 - skew, y + slot.ry * 2);
        p.lineTo(x, y + slot.ry * 2);
        p.close();
        break;
      }
    }
    return p;
  }, [slot]);

  const imageX = slot.cx - slot.rx * 1.1;
  const imageY = slot.cy - slot.ry * 1.1;
  const imageW = slot.rx * 2.2;
  const imageH = slot.ry * 2.2;

  if (!image) return null;

  return (
    <Group
      clip={maskPath}
      transform={[
        { translateX: slot.cx },
        { translateY: slot.cy },
        { rotate: (slot.rotate * Math.PI) / 180 },
        { translateX: -slot.cx },
        { translateY: -slot.cy }
      ]}
    >
      <SkImage image={image} x={imageX} y={imageY} width={imageW} height={imageH} fit="cover" />
      {/* Warm color cast tinting them together */}
      <Group blendMode="multiply">
        <Rect x={imageX} y={imageY} width={imageW} height={imageH} opacity={0.18}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, imageH)}
            colors={index % 2 === 0 ? ["#F4D3A0", "#7A4E26"] : ["#E6C9A8", "#604838"]}
          />
        </Rect>
      </Group>
      {/* Edge feather — a dark vignette around each masked shape so they
          merge into the backdrop and into each other */}
      <Rect x={imageX} y={imageY} width={imageW} height={imageH} opacity={0.35}>
        <RadialGradient
          c={vec(slot.cx, slot.cy)}
          r={Math.max(slot.rx, slot.ry) * 1.1}
          colors={["rgba(0,0,0,0)", "rgba(7,4,9,0.85)"]}
          positions={[0.55, 1]}
        />
      </Rect>
    </Group>
  );
}

const finale = StyleSheet.create({
  titleBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 70,
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateRule: { width: 18, height: 1, backgroundColor: "#E8C26B", opacity: 0.6 },
  dateText: { fontSize: 10, color: "#E8C26B", letterSpacing: 3, fontWeight: "700" },
  title: { fontSize: 34, color: "#F5F1EA", fontWeight: "800", letterSpacing: -0.8, textAlign: "center" },
  location: { fontSize: 10, color: "#E8C26B", letterSpacing: 3, fontWeight: "700", marginTop: 4 },
  footer: { fontSize: 9, color: "#9C95A0", letterSpacing: 2.4, fontWeight: "700", marginTop: 14 }
});

/* ------------------------------------------------------------------ */
/* CAPTION / TEXT HELPERS                                             */
/* ------------------------------------------------------------------ */

function CaptionText({
  text,
  x,
  y,
  scale,
  color = "#F5F1EA",
  size = 12
}: {
  text: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  color?: string;
  size?: number;
}) {
  // Skia doesn't reflow text — we just render at a fixed size with depth-aware opacity.
  const font = useMemo(
    () => matchFont({ fontFamily: "Helvetica", fontSize: size, fontWeight: "600" } as never),
    [size]
  );
  const visible = useDerivedValue(() => (scale.value > 0.4 ? 1 : Math.max(0, (scale.value - 0.2) / 0.2)));
  return <SkText x={x} y={y} text={text} font={font} color={color} opacity={visible} />;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = (current ? current + " " : "") + w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ------------------------------------------------------------------ */
/* STEP BUILDER                                                       */
/* ------------------------------------------------------------------ */

function buildSteps(recap: RecapResponse, title: string): StepKind[] {
  const steps: StepKind[] = [];
  steps.push({
    id: "title",
    kind: "title",
    title: title.toUpperCase(),
    date: formatRange(recap.dateRange.start, recap.dateRange.end).toUpperCase()
  });

  if (recap.contributorList.length > 1) {
    steps.push({
      id: "names",
      kind: "names",
      people: recap.contributorList.slice(0, 5),
      line: `${recap.contributorList.length} hands held this one`
    });
  }

  steps.push({
    id: "stat-memories",
    kind: "stat",
    value: recap.stats.memories,
    label: recap.stats.memories === 1 ? "MEMORY" : "MEMORIES"
  });

  recap.highlights.slice(0, 3).forEach((h, i) => {
    steps.push(
      i % 2 === 0
        ? {
            id: `wall-${h.id}`,
            kind: "photo-wall",
            url: h.url,
            caption: h.caption,
            date: h.capturedAt,
            side: i % 4 === 0 ? "left" : "right"
          }
        : {
            id: `portal-${h.id}`,
            kind: "photo-portal",
            url: h.url,
            caption: h.caption
          }
    );
  });

  steps.push({
    id: "stat-days",
    kind: "stat",
    value: recap.stats.daysSpan,
    label: recap.stats.daysSpan === 1 ? "DAY" : "DAYS"
  });

  if (recap.topComment) {
    steps.push({
      id: "quote",
      kind: "quote",
      body: recap.topComment.body,
      authorName: recap.topComment.author?.displayName ?? "Anon",
      createdAt: recap.topComment.createdAt
    });
  }

  if (recap.highlights[3]) {
    const h = recap.highlights[3];
    steps.push({
      id: `wall2-${h.id}`,
      kind: "photo-wall",
      url: h.url,
      caption: h.caption,
      date: h.capturedAt,
      side: "left"
    });
  }

  steps.push({ id: "finale", kind: "finale" });
  return steps;
}

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

/* ------------------------------------------------------------------ */
/* STYLES                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080610" },
  errorOverlay: { position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center" },
  errorText: { color: "#5F4923", fontSize: 14 },

  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  topBarRight: { flexDirection: "row", gap: 8 },
  recapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.45)",
    backgroundColor: "rgba(11,10,16,0.55)"
  },
  recapBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#E8C26B" },
  recapBadgeText: { fontSize: 9, color: "#F5F1EA", letterSpacing: 1.6, fontWeight: "700" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11,10,16,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)"
  },

  stepColumn: {
    position: "absolute",
    right: 14,
    flexDirection: "column",
    gap: 5,
    alignItems: "center"
  },
  stepPip: { width: 2, height: 14, borderRadius: 1 },

  tapZone: { position: "absolute", top: 80, bottom: 100 },

  bottomHint: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  hintText: {
    fontSize: 9,
    color: "#F5F1EA",
    letterSpacing: 2.4,
    fontWeight: "700",
    opacity: 0.55
  }
});

/* Keep an unused reference to ColorMatrix to ensure the import survives tree-shaking
   when we extend the file later with grading on photo walls. */
void ColorMatrix;
