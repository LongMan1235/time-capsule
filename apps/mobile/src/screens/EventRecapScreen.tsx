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
import { KintsugiLoader } from "../components/KintsugiLoader";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatLongDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(new Date(iso));
}

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

type WalkItem =
  | { id: string; kind: "title"; title: string; subtitle: string }
  | { id: string; kind: "calendar"; start: string; end: string }
  | { id: string; kind: "stat"; value: number; label: string }
  | { id: string; kind: "people"; people: RecapUser[]; line: string }
  | { id: string; kind: "photo"; photo: string; caption: string | null; date: string | null; author: RecapUser | null }
  | { id: string; kind: "quote"; body: string; author: RecapUser | null; createdAt: string }
  | { id: string; kind: "reactions"; emoji: string; count: number };

/* ------------------------------------------------------------------ */
/* SCREEN                                                             */
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
      <View style={{ flex: 1, backgroundColor: "#F4EFE6" }}>
        <KintsugiLoader label="GENERATING YOUR RECAP" onComplete={() => setLoaderDone(true)} />
        {error ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return <WalkwayRecap navigation={navigation} route={route} recap={recap!} insets={insets} />;
}

/* ------------------------------------------------------------------ */
/* WALKWAY                                                            */
/* ------------------------------------------------------------------ */

function WalkwayRecap({
  navigation,
  route,
  recap,
  insets
}: {
  navigation: NativeStackScreenProps<RootStackParamList, "EventRecap">["navigation"];
  route: NativeStackScreenProps<RootStackParamList, "EventRecap">["route"];
  recap: RecapResponse;
  insets: { top: number; bottom: number; left: number; right: number };
}) {
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [arrivedAtEnd, setArrivedAtEnd] = useState(false);
  const dismissDrag = useRef(new Animated.Value(0)).current;
  const [dismissY, setDismissY] = useState(0);
  const walkProgress = useRef(new Animated.Value(0)).current;
  const stepListener = useRef<string | undefined>(undefined);
  const walkAnim = useRef<Animated.CompositeAnimation | undefined>(undefined);
  const enterOpacity = useRef(new Animated.Value(0)).current;

  const items = useMemo<WalkItem[]>(() => {
    const built: WalkItem[] = [];
    built.push({
      id: "title",
      kind: "title",
      title: route.params.title,
      subtitle: "AN AI RECAP"
    });
    built.push({ id: "calendar", kind: "calendar", start: recap.dateRange.start, end: recap.dateRange.end });
    built.push({
      id: "stat-memories",
      kind: "stat",
      value: recap.stats.memories,
      label: recap.stats.memories === 1 ? "MEMORY" : "MEMORIES"
    });
    if (recap.contributorList.length > 0) {
      built.push({
        id: "people",
        kind: "people",
        people: recap.contributorList.slice(0, 5),
        line:
          recap.contributorList.length === 1
            ? "Just you."
            : `${recap.contributorList.length} hands held this one.`
      });
    }
    recap.highlights.slice(0, 2).forEach((h, i) =>
      built.push({
        id: `photo-${i}`,
        kind: "photo",
        photo: h.url,
        caption: h.caption,
        date: h.capturedAt,
        author: h.addedBy
      })
    );
    built.push({
      id: "stat-days",
      kind: "stat",
      value: recap.stats.daysSpan,
      label: recap.stats.daysSpan === 1 ? "DAY" : "DAYS"
    });
    if (recap.topComment) {
      built.push({
        id: "quote",
        kind: "quote",
        body: recap.topComment.body,
        author: recap.topComment.author,
        createdAt: recap.topComment.createdAt
      });
    }
    if (recap.highlights[2]) {
      const h = recap.highlights[2];
      built.push({ id: "photo-2", kind: "photo", photo: h.url, caption: h.caption, date: h.capturedAt, author: h.addedBy });
    }
    if (recap.topEmoji && recap.stats.reactions > 0) {
      built.push({ id: "reactions", kind: "reactions", emoji: recap.topEmoji, count: recap.stats.reactions });
    }
    return built;
  }, [recap, route.params.title]);

  // Each item occupies one walkProgress unit. We walk from 0 to items.length.
  const totalLength = items.length;
  const itemDurationMs = 2400;

  useEffect(() => {
    Animated.timing(enterOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enterOpacity]);

  useEffect(() => {
    if (paused) {
      walkAnim.current?.stop();
      return;
    }
    const current = (walkProgress as Animated.Value & { _value?: number })._value ?? 0;
    const remaining = Math.max(0, totalLength - current);
    if (remaining <= 0) return;
    walkAnim.current = Animated.timing(walkProgress, {
      toValue: totalLength,
      duration: remaining * itemDurationMs,
      easing: Easing.linear,
      useNativeDriver: true
    });
    walkAnim.current.start(({ finished }) => {
      if (finished) {
        setArrivedAtEnd(true);
      }
    });
    return () => walkAnim.current?.stop();
  }, [paused, walkProgress, totalLength]);

  // Track which item is currently "at camera" for haptic beats and progress UI.
  useEffect(() => {
    stepListener.current = walkProgress.addListener(({ value }) => {
      const next = Math.min(items.length - 1, Math.max(0, Math.floor(value)));
      if (next !== activeIndex) {
        setActiveIndex(next);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
    });
    return () => {
      if (stepListener.current) walkProgress.removeListener(stepListener.current);
    };
  }, [walkProgress, activeIndex, items.length]);

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

  function togglePause() {
    Haptics.selectionAsync().catch(() => undefined);
    setPaused((p) => !p);
  }

  function skip() {
    Haptics.selectionAsync().catch(() => undefined);
    const current = (walkProgress as Animated.Value & { _value?: number })._value ?? 0;
    const target = Math.min(totalLength, Math.floor(current) + 1);
    walkAnim.current?.stop();
    Animated.timing(walkProgress, { toValue: target, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      if (target >= totalLength) setArrivedAtEnd(true);
    });
  }

  function back() {
    Haptics.selectionAsync().catch(() => undefined);
    const current = (walkProgress as Animated.Value & { _value?: number })._value ?? 0;
    const target = Math.max(0, Math.floor(current) - 1);
    walkAnim.current?.stop();
    Animated.timing(walkProgress, { toValue: target, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    setArrivedAtEnd(false);
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dy) > 16 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
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

  const dismissTranslate = dismissDrag.interpolate({ inputRange: [0, 400], outputRange: [0, 400], extrapolate: "clamp" });
  const dismissOpacity = dismissDrag.interpolate({ inputRange: [0, 200], outputRange: [1, 0.4], extrapolate: "clamp" });

  return (
    <Animated.View
      style={[styles.root, { opacity: dismissOpacity, transform: [{ translateY: dismissTranslate }] }]}
      {...pan.panHandlers}
    >
      {/* The walking environment */}
      <CorridorBackdrop walkProgress={walkProgress} />

      {/* Items floating along the corridor */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: enterOpacity }]}>
        {items.map((item, index) => (
          <WalkItemView key={item.id} item={item} index={index} walkProgress={walkProgress} />
        ))}
      </Animated.View>

      {/* Final collage destination, fades in when arrived */}
      {arrivedAtEnd ? (
        <FinalCollage
          recap={recap}
          title={route.params.title}
          onClose={close}
          onShare={share}
        />
      ) : null}

      {/* Progress pips */}
      <View style={[styles.progressRow, { top: insets.top + 12 }]}>
        {items.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: walkProgress.interpolate({
                    inputRange: [i, i + 1],
                    outputRange: ["0%", "100%"],
                    extrapolate: "clamp"
                  })
                }
              ]}
            />
          </View>
        ))}
      </View>

      {/* Top bar */}
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

      {/* Tap zones */}
      {!arrivedAtEnd ? (
        <>
          <AnimatedPressable onPress={back} style={[styles.tapZone, { left: 0, width: SCREEN_W / 4 }]}>
            <View />
          </AnimatedPressable>
          <AnimatedPressable onPress={togglePause} style={[styles.tapZone, { left: SCREEN_W / 4, width: SCREEN_W / 2 }]}>
            <View />
          </AnimatedPressable>
          <AnimatedPressable onPress={skip} style={[styles.tapZone, { right: 0, width: SCREEN_W / 4 }]}>
            <View />
          </AnimatedPressable>
        </>
      ) : null}

      {paused ? (
        <View pointerEvents="none" style={styles.pauseBadge}>
          <Pause color={colors.fog} size={14} fill={colors.fog} />
        </View>
      ) : null}

      <View
        pointerEvents="none"
        style={[
          styles.dismissHint,
          { bottom: insets.bottom + 18, opacity: dismissY > 0 ? Math.max(0, 1 - dismissY / 100) : 0.35 }
        ]}
      >
        <ArrowDown color={colors.fog} size={11} />
        <Text style={styles.dismissText}>swipe down to close</Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* CORRIDOR BACKDROP                                                  */
/* ------------------------------------------------------------------ */

function CorridorBackdrop({ walkProgress }: { walkProgress: Animated.Value }) {
  // Floor lines and far-wall fog. Lines pulse forward as you walk to suggest
  // the corridor advancing.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#08070C", "#0A0810", "#0F0B17", "#080610"]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Vanishing point glow at the horizon */}
      <View style={styles.horizonGlow} />

      {/* Floor perspective lines */}
      {[0, 1, 2, 3, 4].map((i) => {
        const offset = walkProgress.interpolate({
          inputRange: [i, i + 5],
          outputRange: [0, 1],
          extrapolate: "extend"
        });
        const translateY = offset.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 180]
        });
        return (
          <Animated.View
            key={`floor-${i}`}
            style={[
              styles.floorLine,
              {
                top: SCREEN_H * 0.5 + i * 60,
                opacity: 0.10 + i * 0.04,
                transform: [{ translateY }]
              }
            ]}
          />
        );
      })}

      {/* Left + right wall hint gradients */}
      <LinearGradient
        colors={["rgba(232,194,107,0.05)", "rgba(0,0,0,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.wallHint, { left: 0 }]}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(232,194,107,0.05)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.wallHint, { right: 0 }]}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* WALK ITEM VIEW                                                     */
/* ------------------------------------------------------------------ */

function WalkItemView({ item, index, walkProgress }: { item: WalkItem; index: number; walkProgress: Animated.Value }) {
  // distance < 0: approaching (item is ahead of camera, far in distance)
  // distance = 0: at camera
  // distance > 0: passing/passed (above and behind)
  // We interpolate over distance ranges [-1, 0, 0.6].

  const distance = Animated.subtract(walkProgress, index);

  const scale = distance.interpolate({
    inputRange: [-1.0, -0.2, 0, 0.6],
    outputRange: [0.18, 0.82, 1.0, 1.55],
    extrapolate: "clamp"
  });

  const opacity = distance.interpolate({
    inputRange: [-1.0, -0.85, -0.05, 0.35, 0.6],
    outputRange: [0, 1, 1, 1, 0],
    extrapolate: "clamp"
  });

  const translateY = distance.interpolate({
    inputRange: [-1.0, 0, 0.6],
    outputRange: [-SCREEN_H * 0.18, 0, SCREEN_H * 0.55],
    extrapolate: "clamp"
  });

  const side = index % 2 === 0 ? -1 : 1;
  const translateX = distance.interpolate({
    inputRange: [-1.0, 0, 0.6],
    outputRange: [side * 60, 0, side * 80],
    extrapolate: "clamp"
  });

  const rotateZ = distance.interpolate({
    inputRange: [-1.0, 0, 0.6],
    outputRange: [side * 5, 0, side * 9],
    extrapolate: "clamp"
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.itemRoot,
        {
          opacity,
          transform: [
            { perspective: 1100 },
            { translateY },
            { translateX },
            { scale },
            { rotateZ: rotateZ.interpolate({ inputRange: [-9, 9], outputRange: ["-9deg", "9deg"] }) }
          ]
        }
      ]}
    >
      <ItemCard item={item} />
    </Animated.View>
  );
}

function ItemCard({ item }: { item: WalkItem }) {
  switch (item.kind) {
    case "title":
      return <TitleCard title={item.title} subtitle={item.subtitle} />;
    case "calendar":
      return <CalendarCard start={item.start} end={item.end} />;
    case "stat":
      return <StatCard value={item.value} label={item.label} />;
    case "people":
      return <PeopleCard people={item.people} line={item.line} />;
    case "photo":
      return <PhotoCard photo={item.photo} caption={item.caption} date={item.date} author={item.author} />;
    case "quote":
      return <QuoteCard body={item.body} author={item.author} createdAt={item.createdAt} />;
    case "reactions":
      return <ReactionsCard emoji={item.emoji} count={item.count} />;
  }
}

/* ------------------------------------------------------------------ */
/* INDIVIDUAL CARDS (rendered into the walkway, transformed by parent)*/
/* ------------------------------------------------------------------ */

function TitleCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={[cards.base, cards.title]}>
      <Text style={cards.titleKicker}>{subtitle}</Text>
      <Text style={cards.titleText}>{title}</Text>
    </View>
  );
}

function CalendarCard({ start, end }: { start: string; end: string }) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  return (
    <View style={[cards.base, cards.calendar]}>
      <Text style={cards.calendarKicker}>KEPT BETWEEN</Text>
      <View style={cards.calendarRow}>
        <View style={cards.calendarPill}>
          <Text style={cards.calendarPillMonth}>{MONTHS_SHORT[s.getMonth()]}</Text>
          <Text style={cards.calendarPillDay}>{s.getDate()}</Text>
        </View>
        <Text style={cards.calendarArrow}>→</Text>
        <View style={cards.calendarPill}>
          <Text style={cards.calendarPillMonth}>{sameMonth ? "" : MONTHS_SHORT[e.getMonth()]}</Text>
          <Text style={cards.calendarPillDay}>{e.getDate()}</Text>
        </View>
      </View>
      <Text style={cards.calendarYear}>{s.getFullYear()}</Text>
    </View>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={[cards.base, cards.stat]}>
      <Text style={cards.statValue}>{value}</Text>
      <Text style={cards.statLabel}>{label}</Text>
    </View>
  );
}

function PeopleCard({ people, line }: { people: RecapUser[]; line: string }) {
  return (
    <View style={[cards.base, cards.people]}>
      <Text style={cards.peopleKicker}>CAST</Text>
      <View style={cards.avatarStack}>
        {people.slice(0, 4).map((p, i) => (
          <View
            key={p.id}
            style={[
              cards.avatarWrap,
              { marginLeft: i === 0 ? 0 : -12, zIndex: 10 - i }
            ]}
          >
            {p.avatarUrl ? (
              <Image source={{ uri: p.avatarUrl }} style={cards.avatar} contentFit="cover" transition={250} />
            ) : (
              <View style={[cards.avatar, cards.avatarFallback]}>
                <UserRound color={colors.muted} size={14} />
              </View>
            )}
          </View>
        ))}
        {people.length > 4 ? (
          <View style={[cards.avatarWrap, cards.avatarMore, { marginLeft: -12 }]}>
            <Text style={cards.avatarMoreText}>+{people.length - 4}</Text>
          </View>
        ) : null}
      </View>
      <Text style={cards.peopleNames}>
        {people.slice(0, 3).map((p) => p.displayName).join(", ")}
      </Text>
      <Text style={cards.peopleLine}>{line}</Text>
    </View>
  );
}

function PhotoCard({
  photo,
  caption,
  date,
  author
}: {
  photo: string;
  caption: string | null;
  date: string | null;
  author: RecapUser | null;
}) {
  return (
    <View style={[cards.base, cards.photo]}>
      <Image source={{ uri: photo }} style={cards.photoImage} contentFit="cover" transition={250} />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]}
        style={cards.photoScrim}
      />
      <View style={cards.photoMeta}>
        {date ? <Text style={cards.photoDate}>{formatLongDate(date).toUpperCase()}</Text> : null}
        {caption ? <Text style={cards.photoCaption} numberOfLines={2}>"{caption}"</Text> : null}
        {author ? (
          <Text style={cards.photoAuthor}>
            shot by <Text style={cards.photoAuthorName}>{author.displayName}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function QuoteCard({ body, author, createdAt }: { body: string; author: RecapUser | null; createdAt: string }) {
  return (
    <View style={[cards.base, cards.quote]}>
      <Text style={cards.quoteMark}>"</Text>
      <Text style={cards.quoteBody}>{body}</Text>
      <View style={cards.quoteFooter}>
        <View style={cards.quoteRule} />
        {author ? <Text style={cards.quoteAuthor}>{author.displayName}</Text> : null}
        <Text style={cards.quoteTime}>{formatLongDate(createdAt)} · {formatTime(createdAt)}</Text>
      </View>
    </View>
  );
}

function ReactionsCard({ emoji, count }: { emoji: string; count: number }) {
  return (
    <View style={[cards.base, cards.reactions]}>
      <Text style={cards.reactionsEmoji}>{emoji}</Text>
      <Text style={cards.reactionsCount}>{count}</Text>
      <Text style={cards.reactionsLabel}>{count === 1 ? "REACTION" : "REACTIONS"}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* FINAL COLLAGE (arrives once walkway completes)                     */
/* ------------------------------------------------------------------ */

const COLLAGE_SLOTS: Array<{ x: number; y: number; rot: number; tiltX: number; tiltY: number; delay: number }> = [
  { x: -90, y: -190, rot: -8, tiltX: 6, tiltY: -4, delay: 200 },
  { x: 100, y: -170, rot: 7, tiltX: 5, tiltY: 4, delay: 320 },
  { x: -130, y: -40, rot: -14, tiltX: 4, tiltY: -6, delay: 460 },
  { x: 120, y: -10, rot: 12, tiltX: 4, tiltY: 6, delay: 600 },
  { x: -100, y: 160, rot: -10, tiltX: -4, tiltY: -5, delay: 760 },
  { x: 110, y: 180, rot: 9, tiltX: -5, tiltY: 5, delay: 900 },
  { x: -50, y: 240, rot: -4, tiltX: -6, tiltY: -2, delay: 1040 },
  { x: 70, y: -250, rot: 14, tiltX: 7, tiltY: 3, delay: 1180 }
];

function FinalCollage({
  recap,
  title,
  onClose,
  onShare
}: {
  recap: RecapResponse;
  title: string;
  onClose: () => void;
  onShare: () => void;
}) {
  void onClose;
  void onShare;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.4)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const reactionFeed = useRef<FloatingReaction[]>([]).current;
  const [feedTick, setFeedTick] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Animated.timing(fadeIn, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(220),
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 700, useNativeDriver: true })
      ])
    ]).start();
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(footerOpacity, { toValue: 1, duration: 700, useNativeDriver: true })
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 5400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 5400, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
    // Celebratory emoji shower if there's a top emoji
    if (recap.topEmoji) {
      for (let i = 0; i < 12; i += 1) {
        setTimeout(() => {
          reactionFeed.push({ id: `c-${Date.now()}-${i}`, emoji: recap.topEmoji! });
          setFeedTick([...reactionFeed]);
        }, 300 + i * 280);
      }
    }
  }, [fadeIn, cardScale, cardOpacity, footerOpacity, breathe, recap.topEmoji, reactionFeed]);

  const start = new Date(recap.dateRange.start);
  const end = new Date(recap.dateRange.end);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const monthLabel = sameMonth
    ? MONTHS_SHORT[start.getMonth()]
    : `${MONTHS_SHORT[start.getMonth()]} – ${MONTHS_SHORT[end.getMonth()]}`;
  const dayLabel = sameMonth ? `${start.getDate()}–${end.getDate()}` : `${start.getDate()} · ${end.getDate()}`;
  const pileDrift = breathe.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { opacity: fadeIn }]}>
      <LinearGradient
        colors={["#0F0D14", "#0A080F", "#181020"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[collage.stage, { transform: [{ translateY: pileDrift }] }]}>
        {recap.highlights.slice(0, COLLAGE_SLOTS.length).map((photo, i) => (
          <CollagePhoto key={photo.id} photo={photo} slot={COLLAGE_SLOTS[i]} />
        ))}

        <Animated.View
          style={[
            collage.card,
            {
              opacity: cardOpacity,
              transform: [
                { scale: cardScale },
                { perspective: 1000 },
                { rotateX: "2deg" },
                { rotate: "-1.5deg" }
              ]
            }
          ]}
        >
          <Text style={collage.cardKicker}>TIME CAPSULE</Text>
          <Text style={collage.cardTitle}>{title}</Text>
          <Text style={collage.cardMonth}>{monthLabel}</Text>
          <Text style={collage.cardDay}>{dayLabel}</Text>
          <Text style={collage.cardYear}>{start.getFullYear()}</Text>
          {recap.locationName ? <Text style={collage.cardPlace}>{recap.locationName}</Text> : null}
        </Animated.View>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[collage.footer, { opacity: footerOpacity }]}>
        <Sparkles color={colors.gold} size={10} />
        <Text style={collage.footerText}>
          GENERATED {formatLongDate(recap.generatedAt).toUpperCase()} · {formatTime(recap.generatedAt)}
        </Text>
      </Animated.View>

      <FloatingReactions feed={feedTick} />
    </Animated.View>
  );
}

function CollagePhoto({ photo, slot }: { photo: RecapHighlight; slot: typeof COLLAGE_SLOTS[number] }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(slot.delay),
      Animated.spring(value, { toValue: 1, useNativeDriver: true, friction: 7, tension: 70 })
    ]).start();
  }, [value, slot.delay]);
  const opacity = value;
  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  return (
    <Animated.View
      style={[
        collage.polaroid,
        {
          left: SCREEN_W / 2 + slot.x - 64,
          top: SCREEN_H / 2 + slot.y - 78,
          opacity,
          transform: [
            { scale },
            { translateY },
            { perspective: 1000 },
            { rotate: `${slot.rot}deg` },
            { rotateX: `${slot.tiltX}deg` },
            { rotateY: `${slot.tiltY}deg` }
          ]
        }
      ]}
    >
      <Image source={{ uri: photo.url }} style={collage.polaroidImage} contentFit="cover" transition={250} />
      {photo.caption ? <Text numberOfLines={1} style={collage.polaroidCaption}>{photo.caption}</Text> : null}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* STYLES                                                             */
/* ------------------------------------------------------------------ */

const ITEM_W = 280;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  errorOverlay: { position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center" },
  errorText: { ...type.body, color: "#5F574B" },
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
  dismissText: { ...type.micro, color: colors.fog, letterSpacing: 1.2 },

  // Item positioning
  itemRoot: {
    position: "absolute",
    top: SCREEN_H / 2 - 160,
    left: SCREEN_W / 2 - ITEM_W / 2,
    width: ITEM_W
  },

  // Corridor backdrop
  horizonGlow: {
    position: "absolute",
    top: SCREEN_H * 0.25,
    left: SCREEN_W / 2 - 120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.gold,
    opacity: 0.10
  },
  floorLine: {
    position: "absolute",
    left: SCREEN_W * 0.18,
    right: SCREEN_W * 0.18,
    height: 1,
    backgroundColor: "rgba(232,194,107,0.40)"
  },
  wallHint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90
  }
});

const cards = StyleSheet.create({
  base: {
    width: ITEM_W,
    borderRadius: radii.lg,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 }
  },

  // Title
  title: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: colors.lineBright, alignItems: "center", gap: 10, paddingVertical: 36 },
  titleKicker: { fontSize: 10, color: colors.gold, letterSpacing: 3, fontWeight: "800" },
  titleText: { fontSize: 30, lineHeight: 34, color: colors.fog, fontWeight: "800", textAlign: "center", letterSpacing: -0.6 },

  // Calendar
  calendar: { backgroundColor: "rgba(232,194,107,0.07)", borderWidth: 1, borderColor: "rgba(232,194,107,0.35)", alignItems: "center", gap: 10 },
  calendarKicker: { fontSize: 9, color: colors.muted, letterSpacing: 3, fontWeight: "700" },
  calendarRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  calendarPill: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 18, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(232,194,107,0.40)", backgroundColor: "rgba(232,194,107,0.06)", minWidth: 72 },
  calendarPillMonth: { fontSize: 10, color: colors.gold, letterSpacing: 2 },
  calendarPillDay: { fontSize: 36, lineHeight: 40, fontWeight: "800", color: colors.fog, fontVariant: ["tabular-nums"] },
  calendarArrow: { fontSize: 24, color: colors.gold, opacity: 0.55 },
  calendarYear: { fontSize: 16, color: colors.fog, letterSpacing: 4, opacity: 0.65, fontWeight: "300", marginTop: 6 },

  // Stat
  stat: { backgroundColor: "rgba(78,46,86,0.18)", borderWidth: 1, borderColor: "rgba(232,194,107,0.18)", alignItems: "center", paddingVertical: 38 },
  statValue: { fontSize: 110, lineHeight: 114, color: colors.fog, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -4 },
  statLabel: { fontSize: 11, color: colors.gold, letterSpacing: 3.6, fontWeight: "700", marginTop: 6 },

  // People
  people: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: colors.line, alignItems: "center", gap: 10 },
  peopleKicker: { fontSize: 10, color: colors.muted, letterSpacing: 3, fontWeight: "700" },
  avatarStack: { flexDirection: "row", marginTop: 4 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, padding: 2, backgroundColor: colors.ink },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.dusk },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarMore: { backgroundColor: colors.fog, alignItems: "center", justifyContent: "center" },
  avatarMoreText: { fontSize: 11, color: colors.ink, fontWeight: "800" },
  peopleNames: { fontSize: 16, color: colors.fog, fontWeight: "700", textAlign: "center" },
  peopleLine: { fontSize: 12, color: colors.muted, fontStyle: "italic", textAlign: "center", marginTop: 2 },

  // Photo
  photo: { backgroundColor: colors.dusk, padding: 0, overflow: "hidden", height: 360 },
  photoImage: { ...StyleSheet.absoluteFillObject },
  photoScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  photoMeta: { position: "absolute", left: 18, right: 18, bottom: 18, gap: 8 },
  photoDate: { fontSize: 10, color: colors.gold, letterSpacing: 2.4, fontWeight: "800" },
  photoCaption: { fontSize: 18, lineHeight: 22, color: colors.fog, fontWeight: "700", fontStyle: "italic" },
  photoAuthor: { fontSize: 11, color: colors.fog, opacity: 0.78, letterSpacing: 0.2, marginTop: 2 },
  photoAuthorName: { color: colors.gold, fontWeight: "700" },

  // Quote
  quote: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: colors.line, gap: 6 },
  quoteMark: { fontSize: 64, lineHeight: 54, color: colors.gold, fontWeight: "800" },
  quoteBody: { fontSize: 20, lineHeight: 26, color: colors.fog, fontWeight: "600", fontStyle: "italic", letterSpacing: -0.2, marginTop: -4 },
  quoteFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" },
  quoteRule: { width: 18, height: 1, backgroundColor: colors.gold },
  quoteAuthor: { fontSize: 13, color: colors.fog, fontWeight: "700" },
  quoteTime: { fontSize: 10, color: colors.muted, letterSpacing: 1.2 },

  // Reactions
  reactions: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(232,194,107,0.25)", alignItems: "center", paddingVertical: 32, gap: 6 },
  reactionsEmoji: { fontSize: 90 },
  reactionsCount: { fontSize: 56, lineHeight: 58, fontWeight: "800", color: colors.fog, fontVariant: ["tabular-nums"], letterSpacing: -2 },
  reactionsLabel: { fontSize: 10, color: colors.gold, letterSpacing: 3, fontWeight: "700" }
});

const collage = StyleSheet.create({
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: 200,
    height: 264,
    backgroundColor: colors.fog,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    borderWidth: 1,
    borderColor: "rgba(11,10,16,0.06)"
  },
  cardKicker: { fontSize: 10, color: colors.gold, letterSpacing: 2.6, fontWeight: "800" },
  cardTitle: { fontSize: 18, color: colors.ink, fontWeight: "800", textAlign: "center", letterSpacing: -0.3, marginTop: 8, lineHeight: 22 },
  cardMonth: { fontSize: 14, color: colors.muted, letterSpacing: 4, fontWeight: "700", marginTop: 18 },
  cardDay: { fontSize: 64, lineHeight: 68, color: colors.ink, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -2, marginTop: 2 },
  cardYear: { fontSize: 12, color: colors.muted, letterSpacing: 5, fontWeight: "300", marginTop: 6 },
  cardPlace: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 14, fontStyle: "italic" },
  polaroid: {
    position: "absolute",
    width: 128,
    height: 156,
    backgroundColor: colors.fog,
    borderRadius: 4,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 }
  },
  polaroidImage: { flex: 1, backgroundColor: "#2A2336", borderRadius: 2 },
  polaroidCaption: { fontSize: 10, color: colors.ink, textAlign: "center", marginTop: 4, fontStyle: "italic", fontWeight: "600" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 60, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  footerText: { fontSize: 10, color: colors.fog, letterSpacing: 1.8, fontWeight: "700", opacity: 0.75 }
});
