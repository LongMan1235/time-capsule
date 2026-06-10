import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDown, Pause, Share2, Sparkles, UserRound, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { FloatingReactions, type FloatingReaction } from "../components/FloatingReactions";
import { colors, gradients, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

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

type Scene =
  | { id: string; kind: "title"; title: string; cover: string | null; dateLabel: string; bylineUser: RecapUser | null; duration: number }
  | { id: string; kind: "calendar"; start: string; end: string; daysSpan: number; duration: number }
  | { id: string; kind: "stat"; value: number; label: string; sub: string; palette: readonly [string, string, ...string[]]; duration: number }
  | { id: string; kind: "names"; people: RecapUser[]; line: string; duration: number }
  | { id: string; kind: "photo"; photo: string; caption: string | null; line: string; date: string | null; author: RecapUser | null; duration: number }
  | { id: string; kind: "quote"; body: string; author: RecapUser | null; createdAt: string; photo: string | null; duration: number }
  | { id: string; kind: "reactions"; emoji: string; count: number; photo: string | null; duration: number }
  | { id: string; kind: "outro"; title: string; line: string; generatedAt: string; duration: number };

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}
function formatLongDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(new Date(iso));
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

export function EventRecapScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "EventRecap">) {
  const insets = useSafeAreaInsets();
  const [recap, setRecap] = useState<RecapResponse | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const sceneOpacity = useRef(new Animated.Value(0)).current;
  const dismissDrag = useRef(new Animated.Value(0)).current;
  const [dismissY, setDismissY] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const progressAnim = useRef<Animated.CompositeAnimation | undefined>(undefined);

  useEffect(() => {
    api<RecapResponse>(`/events/${route.params.eventId}/summary`)
      .then(setRecap)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not generate recap"));
  }, [route.params.eventId]);

  const scenes = useMemo<Scene[]>(() => {
    if (!recap) return [];
    const owner = recap.contributorList[0] ?? null;
    const dateLabel = formatRange(recap.dateRange.start, recap.dateRange.end);
    const built: Scene[] = [];

    built.push({
      id: "title",
      kind: "title",
      title: route.params.title,
      cover: recap.coverUrl ?? recap.highlights[0]?.url ?? null,
      dateLabel,
      bylineUser: owner,
      duration: 3400
    });

    if (recap.dateRange.start && recap.dateRange.end) {
      built.push({
        id: "calendar",
        kind: "calendar",
        start: recap.dateRange.start,
        end: recap.dateRange.end,
        daysSpan: recap.stats.daysSpan,
        duration: 3400
      });
    }

    built.push({
      id: "stat-memories",
      kind: "stat",
      value: recap.stats.memories,
      label: recap.stats.memories === 1 ? "MEMORY" : "MEMORIES",
      sub: recap.paragraphs[0] ?? "Captured.",
      palette: ["#2A1C3A", "#1A1320", "#3F2030"],
      duration: 3400
    });

    if (recap.contributorList.length >= 1) {
      built.push({
        id: "names",
        kind: "names",
        people: recap.contributorList.slice(0, 6),
        line:
          recap.contributorList.length === 1
            ? "By you."
            : `${recap.contributorList.length} people held this one.`,
        duration: 3600
      });
    }

    if (recap.highlights[0]) {
      built.push({
        id: "photo-1",
        kind: "photo",
        photo: recap.highlights[0].url,
        caption: recap.highlights[0].caption,
        line: recap.paragraphs[1] ?? "A moment worth keeping.",
        date: recap.highlights[0].capturedAt,
        author: recap.highlights[0].addedBy,
        duration: 4400
      });
    }

    built.push({
      id: "stat-days",
      kind: "stat",
      value: recap.stats.daysSpan,
      label: recap.stats.daysSpan === 1 ? "DAY" : "DAYS",
      sub: recap.stats.daysSpan === 1 ? "Held in a single day." : "Stretched across this many.",
      palette: ["#0F2540", "#0A1A2A", "#1A3656"],
      duration: 3000
    });

    if (recap.topComment) {
      built.push({
        id: "quote",
        kind: "quote",
        body: recap.topComment.body,
        author: recap.topComment.author,
        createdAt: recap.topComment.createdAt,
        photo: recap.topComment.mediaUrl,
        duration: 4400
      });
    }

    if (recap.highlights[1]) {
      built.push({
        id: "photo-2",
        kind: "photo",
        photo: recap.highlights[1].url,
        caption: recap.highlights[1].caption,
        line: "And then this happened.",
        date: recap.highlights[1].capturedAt,
        author: recap.highlights[1].addedBy,
        duration: 4000
      });
    }

    if (recap.topEmoji && recap.stats.reactions > 0) {
      built.push({
        id: "reactions",
        kind: "reactions",
        emoji: recap.topEmoji,
        count: recap.stats.reactions,
        photo: recap.highlights[2]?.url ?? recap.highlights[0]?.url ?? null,
        duration: 4400
      });
    }

    if (recap.highlights[3]) {
      built.push({
        id: "photo-3",
        kind: "photo",
        photo: recap.highlights[3].url,
        caption: recap.highlights[3].caption,
        line: "One more, for the record.",
        date: recap.highlights[3].capturedAt,
        author: recap.highlights[3].addedBy,
        duration: 3800
      });
    }

    built.push({
      id: "outro",
      kind: "outro",
      title: route.params.title,
      line: recap.paragraphs[2] ?? "Sealed for later.",
      generatedAt: recap.generatedAt,
      duration: 4400
    });

    return built;
  }, [recap, route.params.title]);

  useEffect(() => {
    if (!scenes.length) return;
    progress.setValue(0);
    sceneOpacity.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    Animated.timing(sceneOpacity, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
    if (paused) return;
    const duration = scenes[index]?.duration ?? 3000;
    progressAnim.current = Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false });
    progressAnim.current.start();
    advanceTimer.current = setTimeout(() => {
      if (index < scenes.length - 1) {
        Animated.timing(sceneOpacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() =>
          setIndex((i) => Math.min(scenes.length - 1, i + 1))
        );
      }
    }, duration);
    return () => {
      progressAnim.current?.stop();
      advanceTimer.current && clearTimeout(advanceTimer.current);
    };
  }, [index, scenes, paused, progress, sceneOpacity]);

  function go(direction: 1 | -1) {
    Haptics.selectionAsync().catch(() => undefined);
    const next = Math.max(0, Math.min(scenes.length - 1, index + direction));
    if (next === index) {
      if (direction === 1) close();
      return;
    }
    Animated.timing(sceneOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setIndex(next));
  }

  function togglePause() {
    Haptics.selectionAsync().catch(() => undefined);
    setPaused((p) => !p);
  }

  function close() {
    navigation.goBack();
  }

  async function share() {
    if (!recap) return;
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
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dy) > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dy > 0) {
            dismissDrag.setValue(gesture.dy);
            setDismissY(gesture.dy);
          }
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > 140) {
            close();
          } else {
            Animated.spring(dismissDrag, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
            setDismissY(0);
          }
        }
      }),
    [dismissDrag]
  );

  if (!recap) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
        {error ? <Text style={styles.errorText}>{error}</Text> : <Text style={styles.loadingText}>Reading your capsule…</Text>}
      </View>
    );
  }

  const scene = scenes[index];
  if (!scene) return <View style={styles.loading} />;
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const dismissTranslate = dismissDrag.interpolate({ inputRange: [0, 400], outputRange: [0, 400], extrapolate: "clamp" });
  const dismissBgOpacity = dismissDrag.interpolate({ inputRange: [0, 200], outputRange: [1, 0.4], extrapolate: "clamp" });

  return (
    <Animated.View
      style={[styles.root, { transform: [{ translateY: dismissTranslate }], opacity: dismissBgOpacity }]}
      {...pan.panHandlers}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sceneOpacity }]}>
        <SceneView scene={scene} />
      </Animated.View>

      <View style={[styles.progressRow, { top: insets.top + 12 }]}>
        {scenes.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            {i < index ? (
              <View style={[styles.progressFill, { width: "100%" }]} />
            ) : i === index ? (
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            ) : null}
          </View>
        ))}
      </View>

      <View style={[styles.topBar, { top: insets.top + 28 }]} pointerEvents="box-none">
        <View style={styles.recapBadge}>
          <Sparkles color={colors.ink} size={10} />
          <Text style={styles.recapBadgeText}>AI RECAP</Text>
        </View>
        <View style={styles.topRight}>
          <AnimatedPressable onPress={share} style={styles.iconBtn}>
            <Share2 color={colors.fog} size={16} />
          </AnimatedPressable>
          <AnimatedPressable onPress={close} style={styles.iconBtn}>
            <X color={colors.fog} size={18} />
          </AnimatedPressable>
        </View>
      </View>

      <AnimatedPressable onPress={() => go(-1)} style={[styles.tapZone, { left: 0, width: SCREEN_W / 4 }]}>
        <View />
      </AnimatedPressable>
      <AnimatedPressable onPress={togglePause} style={[styles.tapZone, { left: SCREEN_W / 4, width: SCREEN_W / 2 }]}>
        <View />
      </AnimatedPressable>
      <AnimatedPressable onPress={() => go(1)} style={[styles.tapZone, { right: 0, width: SCREEN_W / 4 }]}>
        <View />
      </AnimatedPressable>

      {paused ? (
        <View pointerEvents="none" style={styles.pauseBadge}>
          <Pause color={colors.fog} size={14} fill={colors.fog} />
        </View>
      ) : null}

      <View
        pointerEvents="none"
        style={[
          styles.dismissHint,
          { bottom: insets.bottom + 18, opacity: dismissY > 0 ? Math.max(0, 1 - dismissY / 100) : 0.45 }
        ]}
      >
        <ArrowDown color={colors.fog} size={11} />
        <Text style={styles.dismissText}>swipe down to close</Text>
      </View>
    </Animated.View>
  );
}

function SceneView({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case "title":
      return <TitleScene scene={scene} />;
    case "calendar":
      return <CalendarScene scene={scene} />;
    case "stat":
      return <StatScene scene={scene} />;
    case "names":
      return <NamesScene scene={scene} />;
    case "photo":
      return <PhotoScene scene={scene} />;
    case "quote":
      return <QuoteScene scene={scene} />;
    case "reactions":
      return <ReactionsScene scene={scene} />;
    case "outro":
      return <OutroScene scene={scene} />;
  }
}

/* -------------------- scenes -------------------- */

function TitleScene({ scene }: { scene: Extract<Scene, { kind: "title" }> }) {
  const zoom = useRef(new Animated.Value(0)).current;
  const dateY = useRef(new Animated.Value(-16)).current;
  const dateOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.92)).current;
  const bylineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(zoom, { toValue: 1, duration: 6000, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(dateOpacity, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(dateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 90 })
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 70 }),
        Animated.spring(titleScale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 70 })
      ]),
      Animated.delay(120),
      Animated.timing(bylineOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, [zoom, dateY, dateOpacity, titleY, titleOpacity, titleScale, bylineOpacity]);

  const coverScale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1.04] });

  return (
    <View style={sceneStyles.fill}>
      {scene.cover ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: coverScale }] }]}>
          <Image source={{ uri: scene.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        </Animated.View>
      ) : null}
      <LinearGradient
        colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)", "rgba(8,6,12,0.96)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={sceneStyles.titleStack}>
        <Animated.Text style={[sceneStyles.titleDate, { opacity: dateOpacity, transform: [{ translateY: dateY }] }]}>
          {scene.dateLabel.toUpperCase()}
        </Animated.Text>
        <Animated.Text style={[sceneStyles.titleText, { opacity: titleOpacity, transform: [{ translateY: titleY }, { scale: titleScale }] }]}>
          {scene.title}
        </Animated.Text>
        {scene.bylineUser ? (
          <Animated.View style={[sceneStyles.bylineRow, { opacity: bylineOpacity }]}>
            <AvatarSmall user={scene.bylineUser} />
            <Text style={sceneStyles.bylineText}>
              by <Text style={sceneStyles.bylineName}>{scene.bylineUser.displayName}</Text>
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function CalendarScene({ scene }: { scene: Extract<Scene, { kind: "calendar" }> }) {
  const start = new Date(scene.start);
  const end = new Date(scene.end);
  const startLabel = formatShortDate(scene.start);
  const endLabel = formatShortDate(scene.end);
  const year = start.getFullYear();
  const dayPips = Math.min(28, Math.max(2, scene.daysSpan));

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const rangeOpacity = useRef(new Animated.Value(0)).current;
  const pipsProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(rangeOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.delay(180),
      Animated.timing(pipsProgress, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    ]).start();
  }, [titleOpacity, rangeOpacity, pipsProgress]);

  return (
    <View style={sceneStyles.fill}>
      <LinearGradient colors={["#181018", "#0E0810", "#251424"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={sceneStyles.calendarStack}>
        <Animated.Text style={[sceneStyles.calendarEyebrow, { opacity: titleOpacity }]}>
          KEPT BETWEEN
        </Animated.Text>
        <Animated.View style={[sceneStyles.dateRow, { opacity: rangeOpacity }]}>
          <View style={sceneStyles.datePill}>
            <Text style={sceneStyles.datePillMonth}>{MONTHS_SHORT[start.getMonth()]}</Text>
            <Text style={sceneStyles.datePillDay}>{start.getDate()}</Text>
          </View>
          <Text style={sceneStyles.dateArrow}>→</Text>
          <View style={sceneStyles.datePill}>
            <Text style={sceneStyles.datePillMonth}>{MONTHS_SHORT[end.getMonth()]}</Text>
            <Text style={sceneStyles.datePillDay}>{end.getDate()}</Text>
          </View>
        </Animated.View>
        <Animated.Text style={[sceneStyles.calendarYear, { opacity: rangeOpacity }]}>{year}</Animated.Text>

        <View style={sceneStyles.pipsRow}>
          {Array.from({ length: dayPips }).map((_, i) => {
            const opacity = pipsProgress.interpolate({
              inputRange: [i / dayPips, (i + 1) / dayPips],
              outputRange: [0, 1],
              extrapolate: "clamp"
            });
            const scale = pipsProgress.interpolate({
              inputRange: [i / dayPips, (i + 0.7) / dayPips, 1],
              outputRange: [0.4, 1.2, 1],
              extrapolate: "clamp"
            });
            return (
              <Animated.View
                key={i}
                style={[
                  sceneStyles.pip,
                  { opacity, transform: [{ scale }] }
                ]}
              />
            );
          })}
        </View>

        <Animated.Text style={[sceneStyles.calendarSub, { opacity: rangeOpacity }]}>
          <Text style={sceneStyles.calendarSubNumber}>{startLabel}</Text> through{" "}
          <Text style={sceneStyles.calendarSubNumber}>{endLabel}</Text>
        </Animated.Text>
      </View>
    </View>
  );
}

function StatScene({ scene }: { scene: Extract<Scene, { kind: "stat" }> }) {
  const [shown, setShown] = useState(0);
  const numberScale = useRef(new Animated.Value(0.7)).current;
  const numberRotate = useRef(new Animated.Value(-3)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(14)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(numberScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
      Animated.spring(numberRotate, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 })
    ]).start();
    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(labelY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 90 })
      ]),
      Animated.delay(220),
      Animated.timing(subOpacity, { toValue: 1, duration: 700, useNativeDriver: true })
    ]).start();

    const start = Date.now();
    const duration = 1500;
    let frame = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(scene.value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scene.value, numberScale, numberRotate, labelOpacity, labelY, subOpacity]);

  const rotate = numberRotate.interpolate({ inputRange: [-3, 0], outputRange: ["-3deg", "0deg"] });

  return (
    <View style={sceneStyles.fill}>
      <LinearGradient colors={scene.palette} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View pointerEvents="none" style={sceneStyles.statGrain} />
      <View style={sceneStyles.statStack}>
        <Animated.Text style={[sceneStyles.statNumber, { transform: [{ scale: numberScale }, { rotate }] }]}>
          {shown}
        </Animated.Text>
        <Animated.Text style={[sceneStyles.statLabel, { opacity: labelOpacity, transform: [{ translateY: labelY }] }]}>
          {scene.label}
        </Animated.Text>
        <Animated.Text style={[sceneStyles.statSub, { opacity: subOpacity }]}>{scene.sub}</Animated.Text>
      </View>
    </View>
  );
}

function NamesScene({ scene }: { scene: Extract<Scene, { kind: "names" }> }) {
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const animations = useRef(scene.people.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(lineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    animations.forEach((value, i) => {
      Animated.sequence([
        Animated.delay(420 + i * 220),
        Animated.spring(value, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 })
      ]).start();
    });
  }, [lineOpacity, animations]);

  return (
    <View style={sceneStyles.fill}>
      <LinearGradient colors={["#10141D", "#0A0D13", "#1A2233"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={sceneStyles.namesStack}>
        <Animated.Text style={[sceneStyles.namesEyebrow, { opacity: lineOpacity }]}>CAST</Animated.Text>
        <View style={sceneStyles.namesList}>
          {scene.people.map((person, i) => {
            const value = animations[i];
            const opacity = value;
            const translateX = value.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] });
            return (
              <Animated.View
                key={person.id}
                style={[sceneStyles.nameRow, { opacity, transform: [{ translateX }] }]}
              >
                <AvatarLarge user={person} />
                <View style={{ flex: 1 }}>
                  <Text style={sceneStyles.nameDisplayName}>{person.displayName}</Text>
                  <Text style={sceneStyles.nameHandle}>@{person.username}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
        <Animated.Text style={[sceneStyles.namesLine, { opacity: lineOpacity }]}>{scene.line}</Animated.Text>
      </View>
    </View>
  );
}

function PhotoScene({ scene }: { scene: Extract<Scene, { kind: "photo" }> }) {
  const zoom = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const dateOpacity = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const captionOpacity = useRef(new Animated.Value(0)).current;
  const authorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(zoom, { toValue: 1, duration: 6500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(drift, { toValue: 1, duration: 6500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(dateOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(120),
      Animated.timing(lineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(captionOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.delay(140),
      Animated.timing(authorOpacity, { toValue: 1, duration: 500, useNativeDriver: true })
    ]).start();
  }, [zoom, drift, dateOpacity, lineOpacity, captionOpacity, authorOpacity]);

  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1.24, 1.02] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View style={sceneStyles.fill}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }, { translateX }, { translateY }] }]}>
        <Image source={{ uri: scene.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </Animated.View>
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.32)", "rgba(8,6,12,0.92)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={sceneStyles.photoOverlay}>
        {scene.date ? (
          <Animated.Text style={[sceneStyles.photoDate, { opacity: dateOpacity }]}>
            {formatLongDate(scene.date).toUpperCase()}
          </Animated.Text>
        ) : null}
        <Animated.Text style={[sceneStyles.photoLine, { opacity: lineOpacity }]}>{scene.line}</Animated.Text>
        {scene.caption ? (
          <Animated.Text style={[sceneStyles.photoCaption, { opacity: captionOpacity }]}>"{scene.caption}"</Animated.Text>
        ) : null}
        {scene.author ? (
          <Animated.View style={[sceneStyles.photoAuthor, { opacity: authorOpacity }]}>
            <AvatarSmall user={scene.author} />
            <Text style={sceneStyles.photoAuthorText}>
              shot by <Text style={sceneStyles.photoAuthorName}>{scene.author.displayName}</Text>
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function QuoteScene({ scene }: { scene: Extract<Scene, { kind: "quote" }> }) {
  const photoOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyY = useRef(new Animated.Value(24)).current;
  const authorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(photoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(220),
      Animated.spring(markScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 100 }),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(bodyOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(bodyY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 70 })
      ]),
      Animated.delay(180),
      Animated.timing(authorOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, [photoOpacity, markScale, bodyOpacity, bodyY, authorOpacity]);

  return (
    <View style={sceneStyles.fill}>
      {scene.photo ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: photoOpacity }]}>
          <Image source={{ uri: scene.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        </Animated.View>
      ) : null}
      <LinearGradient colors={["rgba(8,6,12,0.75)", "rgba(8,6,12,0.92)"]} style={StyleSheet.absoluteFill} />
      <View style={sceneStyles.quoteStack}>
        <Animated.Text style={[sceneStyles.quoteMark, { transform: [{ scale: markScale }] }]}>“</Animated.Text>
        <Animated.Text style={[sceneStyles.quoteBody, { opacity: bodyOpacity, transform: [{ translateY: bodyY }] }]}>
          {scene.body}
        </Animated.Text>
        {scene.author ? (
          <Animated.View style={[sceneStyles.quoteAuthorRow, { opacity: authorOpacity }]}>
            <View style={sceneStyles.quoteLine} />
            <AvatarSmall user={scene.author} />
            <View>
              <Text style={sceneStyles.quoteAuthorName}>{scene.author.displayName}</Text>
              <Text style={sceneStyles.quoteAuthorTime}>{formatLongDate(scene.createdAt)} · {formatTime(scene.createdAt)}</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function ReactionsScene({ scene }: { scene: Extract<Scene, { kind: "reactions" }> }) {
  const [feed, setFeed] = useState<FloatingReaction[]>([]);
  const emojiScale = useRef(new Animated.Value(0)).current;
  const emojiRotate = useRef(new Animated.Value(-15)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(emojiScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 100 }),
        Animated.spring(emojiRotate, { toValue: 0, useNativeDriver: true, friction: 6, tension: 70 })
      ]),
      Animated.delay(220),
      Animated.timing(numberOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.delay(140),
      Animated.timing(labelOpacity, { toValue: 1, duration: 500, useNativeDriver: true })
    ]).start();

    const timeouts: Array<ReturnType<typeof setTimeout>> = [];
    for (let i = 0; i < 22; i += 1) {
      timeouts.push(
        setTimeout(() => {
          setFeed((prev) => [...prev, { id: `${Date.now()}-${i}`, emoji: scene.emoji }]);
        }, 240 + i * 130)
      );
    }
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [scene.emoji, emojiScale, emojiRotate, numberOpacity, labelOpacity]);

  const rotate = emojiRotate.interpolate({ inputRange: [-15, 0], outputRange: ["-15deg", "0deg"] });

  return (
    <View style={sceneStyles.fill}>
      {scene.photo ? (
        <Image source={{ uri: scene.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      ) : null}
      <LinearGradient colors={["rgba(8,6,12,0.55)", "rgba(8,6,12,0.85)"]} style={StyleSheet.absoluteFill} />
      <View style={sceneStyles.reactionsStack}>
        <Animated.Text style={[sceneStyles.bigEmoji, { transform: [{ scale: emojiScale }, { rotate }] }]}>
          {scene.emoji}
        </Animated.Text>
        <Animated.Text style={[sceneStyles.reactionsNumber, { opacity: numberOpacity }]}>{scene.count}</Animated.Text>
        <Animated.Text style={[sceneStyles.reactionsLabel, { opacity: labelOpacity }]}>
          {scene.count === 1 ? "REACTION FROM YOUR PEOPLE" : "REACTIONS FROM YOUR PEOPLE"}
        </Animated.Text>
      </View>
      <FloatingReactions feed={feed} />
    </View>
  );
}

function OutroScene({ scene }: { scene: Extract<Scene, { kind: "outro" }> }) {
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(sparkleScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }),
        Animated.timing(sparkleRotate, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]),
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 70 })
      ]),
      Animated.delay(180),
      Animated.timing(lineOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(footerOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, [sparkleScale, sparkleRotate, titleOpacity, titleY, lineOpacity, footerOpacity]);

  const rotate = sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ["-25deg", "0deg"] });

  return (
    <View style={sceneStyles.fill}>
      <LinearGradient colors={gradients.gold} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View pointerEvents="none" style={sceneStyles.outroVignette} />
      <View style={sceneStyles.outroStack}>
        <Animated.View style={[sceneStyles.outroBadge, { transform: [{ scale: sparkleScale }, { rotate }] }]}>
          <Sparkles color={colors.gold} size={28} />
        </Animated.View>
        <Animated.Text style={[sceneStyles.outroTitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          {scene.title}
        </Animated.Text>
        <Animated.Text style={[sceneStyles.outroLine, { opacity: lineOpacity }]}>{scene.line}</Animated.Text>
        <Animated.View style={[sceneStyles.outroFooterRow, { opacity: footerOpacity }]}>
          <Sparkles color={colors.ink} size={10} />
          <Text style={sceneStyles.outroFooterText}>
            TIME CAPSULE · {formatLongDate(scene.generatedAt).toUpperCase()} · {formatTime(scene.generatedAt)}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function AvatarSmall({ user }: { user: RecapUser }) {
  return user.avatarUrl ? (
    <Image source={{ uri: user.avatarUrl }} style={avatarStyles.small} contentFit="cover" transition={250} />
  ) : (
    <View style={[avatarStyles.small, avatarStyles.fallback]}>
      <UserRound color={colors.muted} size={12} />
    </View>
  );
}

function AvatarLarge({ user }: { user: RecapUser }) {
  return user.avatarUrl ? (
    <Image source={{ uri: user.avatarUrl }} style={avatarStyles.large} contentFit="cover" transition={250} />
  ) : (
    <View style={[avatarStyles.large, avatarStyles.fallback]}>
      <UserRound color={colors.muted} size={20} />
    </View>
  );
}

/* -------------------- styles -------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink, gap: 12 },
  loadingText: { ...type.body, color: colors.muted, fontStyle: "italic" },
  errorText: { ...type.body, color: colors.fog },
  progressRow: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 4 },
  progressTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.fog },
  topBar: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topRight: { flexDirection: "row", gap: 8 },
  recapBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.gold },
  recapBadgeText: { ...type.micro, color: colors.ink, letterSpacing: 1.4 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(11,10,16,0.55)", borderWidth: 1, borderColor: colors.line },
  tapZone: { position: "absolute", top: 130, bottom: 130 },
  pauseBadge: { position: "absolute", top: SCREEN_H / 2 - 18, alignSelf: "center", width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(11,10,16,0.65)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  dismissHint: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4 },
  dismissText: { ...type.micro, color: colors.fog, letterSpacing: 1.2 }
});

const sceneStyles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.ink },

  // Title
  titleStack: { position: "absolute", left: 24, right: 24, bottom: 110, alignItems: "center", gap: 14 },
  titleDate: { ...type.micro, color: colors.gold, letterSpacing: 3, fontWeight: "700" },
  titleText: { ...type.display, color: colors.fog, textAlign: "center", fontSize: 44, lineHeight: 48, letterSpacing: -1 },
  bylineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  bylineText: { ...type.caption, color: colors.fog, opacity: 0.78 },
  bylineName: { color: colors.gold, fontWeight: "700" },

  // Calendar
  calendarStack: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 18 },
  calendarEyebrow: { ...type.micro, color: colors.muted, letterSpacing: 3 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 6 },
  datePill: { alignItems: "center", paddingVertical: 14, paddingHorizontal: 22, borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(232,194,107,0.40)", backgroundColor: "rgba(232,194,107,0.08)", minWidth: 96 },
  datePillMonth: { ...type.micro, color: colors.gold, letterSpacing: 2.4 },
  datePillDay: { fontSize: 44, lineHeight: 48, fontWeight: "800", color: colors.fog, fontVariant: ["tabular-nums"], marginTop: 4 },
  dateArrow: { ...type.title, color: colors.gold, opacity: 0.6 },
  calendarYear: { ...type.subtitle, color: colors.fog, letterSpacing: 4, opacity: 0.6, fontWeight: "300" },
  pipsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 16, maxWidth: 240 },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  calendarSub: { ...type.body, color: colors.muted, fontStyle: "italic", marginTop: 12, textAlign: "center" },
  calendarSubNumber: { color: colors.fog, fontStyle: "normal", fontWeight: "700" },

  // Stat
  statStack: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  statNumber: { fontSize: 168, lineHeight: 172, fontWeight: "800", color: colors.fog, fontVariant: ["tabular-nums"], letterSpacing: -5 },
  statLabel: { ...type.micro, color: colors.gold, letterSpacing: 4, marginTop: -4, fontWeight: "700" },
  statSub: { ...type.subtitle, color: colors.fog, textAlign: "center", marginTop: 32, fontStyle: "italic", opacity: 0.88, maxWidth: 320, lineHeight: 24 },
  statGrain: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fbf5e8", opacity: 0.025 },

  // Names
  namesStack: { flex: 1, paddingHorizontal: 28, paddingTop: 120, paddingBottom: 110 },
  namesEyebrow: { ...type.micro, color: colors.muted, letterSpacing: 3, marginBottom: 18 },
  namesList: { gap: 14, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(255,255,255,0.04)" },
  nameDisplayName: { ...type.heading, color: colors.fog, fontWeight: "700" },
  nameHandle: { ...type.caption, color: colors.muted, marginTop: 2 },
  namesLine: { ...type.body, color: colors.muted, fontStyle: "italic", textAlign: "center", marginTop: 12 },

  // Photo
  photoOverlay: { position: "absolute", left: 24, right: 24, bottom: 110, gap: 12 },
  photoDate: { ...type.micro, color: colors.gold, letterSpacing: 2.4, fontWeight: "700" },
  photoLine: { ...type.title, color: colors.fog, fontSize: 28, lineHeight: 34 },
  photoCaption: { ...type.body, color: colors.bone, fontStyle: "italic", opacity: 0.86, fontSize: 16, lineHeight: 22 },
  photoAuthor: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 },
  photoAuthorText: { ...type.caption, color: colors.fog, opacity: 0.7 },
  photoAuthorName: { color: colors.gold, fontWeight: "700" },

  // Quote
  quoteStack: { flex: 1, paddingHorizontal: 32, paddingTop: 130, paddingBottom: 130, justifyContent: "center" },
  quoteMark: { color: colors.gold, fontSize: 120, lineHeight: 100, fontWeight: "800", marginBottom: 4 },
  quoteBody: { color: colors.fog, fontSize: 28, lineHeight: 36, fontWeight: "600", fontStyle: "italic", letterSpacing: -0.3 },
  quoteAuthorRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 32 },
  quoteLine: { width: 28, height: 1, backgroundColor: colors.gold },
  quoteAuthorName: { ...type.body, color: colors.fog, fontWeight: "700" },
  quoteAuthorTime: { ...type.micro, color: colors.muted, letterSpacing: 1.2, marginTop: 2 },

  // Reactions
  reactionsStack: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 32 },
  bigEmoji: { fontSize: 160 },
  reactionsNumber: { fontSize: 96, lineHeight: 100, fontWeight: "800", color: colors.fog, fontVariant: ["tabular-nums"], letterSpacing: -3, marginTop: 12 },
  reactionsLabel: { ...type.micro, color: colors.gold, letterSpacing: 2.8, marginTop: 4, fontWeight: "700", textAlign: "center" },

  // Outro
  outroVignette: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.gold, opacity: 0 },
  outroStack: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  outroBadge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
  outroTitle: { ...type.hero, color: colors.ink, textAlign: "center", fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  outroLine: { ...type.subtitle, color: colors.ink, opacity: 0.78, textAlign: "center", maxWidth: 320, fontStyle: "italic" },
  outroFooterRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 22, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: "rgba(11,10,16,0.10)" },
  outroFooterText: { ...type.micro, color: colors.ink, letterSpacing: 1.6, fontWeight: "700" }
});

const avatarStyles = StyleSheet.create({
  small: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.dusk, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  large: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.dusk, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  fallback: { alignItems: "center", justifyContent: "center" }
});
