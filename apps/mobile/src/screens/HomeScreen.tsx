import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { CalendarHeart, Compass, Plus } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@time-capsule/shared";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { FilterChips, type FilterOption } from "../components/FilterChips";
import { MemoryCard } from "../components/MemoryCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { useTheme } from "../design/ThemeProvider";
import { radii, type } from "../design/themes";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { hasSeenPersonalize } from "./PersonalizeScreen";
import { loadPrefs, reschedule } from "../api/notifications";
import { useSessionStore } from "../store/session";

interface OnThisDayMemory {
  id: string;
  title: string;
  locationName?: string | null;
  coverUrl?: string | null;
  yearsAgo: number;
}

interface Anniversary {
  id: string;
  title: string;
  coverUrl?: string | null;
  sealedAgoDays: number;
  unlocksInDays: number;
  unlockAt: string;
}

type Filter = "all" | "locked" | "open" | "draft";

const filterOptions: Array<FilterOption<Filter>> = [
  { value: "all", label: "All" },
  { value: "locked", label: "Sealed" },
  { value: "open", label: "Open" },
  { value: "draft", label: "Drafts" }
];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, shadows } = useTheme();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [onThisDay, setOnThisDay] = useState<OnThisDayMemory[]>([]);
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const scrollY = useRef(new Animated.Value(0)).current;
  const user = useSessionStore((state) => state.user);
  const greeting = greetingForNow();
  const displayName = user?.displayName ?? user?.username;

  async function load() {
    setRefreshing(true);
    try {
      const [eventsResponse, onThisDayResponse, anniversariesResponse] = await Promise.all([
        api<{ events: EventSummary[] }>("/events"),
        api<{ memories: OnThisDayMemory[] }>("/memories/on-this-day").catch(() => ({ memories: [] })),
        api<{ items: Anniversary[] }>("/anniversaries").catch(() => ({ items: [] }))
      ]);
      setEvents(eventsResponse.events);
      setOnThisDay(onThisDayResponse.memories ?? []);
      setAnniversaries(anniversariesResponse.items ?? []);
    } catch {
      // empty state will show
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await hasSeenPersonalize();
      if (!seen && !cancelled) navigation.navigate("Personalize");
      const prefs = await loadPrefs();
      if (!cancelled) reschedule(prefs).catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  const counts = useMemo(() => ({
    all: events.length,
    locked: events.filter((e) => e.state === "LOCKED").length,
    open: events.filter((e) => e.state === "UNLOCKED").length,
    draft: events.filter((e) => e.state === "DRAFT").length
  }), [events]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "locked": return events.filter((e) => e.state === "LOCKED");
      case "open": return events.filter((e) => e.state === "UNLOCKED");
      case "draft": return events.filter((e) => e.state === "DRAFT");
      default: return events;
    }
  }, [events, filter]);

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0.55], extrapolate: "clamp" });
  const headerTranslate = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, -12], extrapolate: "clamp" });

  return (
    <Screen edges={["top", "left", "right"]}>
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.accent.gold} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }}>
            {/* Hero header */}
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: theme.accent.gold }]}>{greeting.toUpperCase()}</Text>
                <Text style={[styles.headline, { color: theme.ink.primary }]} numberOfLines={2}>
                  {displayName ? `Hello,\n${displayName}.` : "Your archive."}
                </Text>
                <Text style={[styles.headlineMeta, { color: theme.ink.muted }]}>
                  {counts.all} {counts.all === 1 ? "capsule" : "capsules"}
                </Text>
              </View>
              <AnimatedPressable
                onPress={() => navigation.navigate("CreateEvent")}
                style={[styles.createButton, shadows.soft, { backgroundColor: theme.bg.inverse }]}
              >
                <Plus color={theme.ink.onInverse} size={20} />
              </AnimatedPressable>
            </View>

            {/* On-this-day callout (only when present) */}
            {onThisDay.length > 0 ? (
              <Stagger delay={100}>
                <AnimatedPressable
                  onPress={() => navigation.navigate("EventDetail", { eventId: onThisDay[0].id })}
                  style={[styles.onThisDay, shadows.soft, { backgroundColor: theme.bg.elevated, borderColor: theme.line.soft }]}
                >
                  {onThisDay[0].coverUrl ? (
                    <Image source={{ uri: onThisDay[0].coverUrl }} style={styles.onThisDayCover} contentFit="cover" transition={350} />
                  ) : (
                    <View style={[styles.onThisDayCover, { backgroundColor: theme.bg.surface }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.onThisDayHead}>
                      <CalendarHeart color={theme.accent.gold} size={12} />
                      <Text style={[styles.onThisDayEyebrow, { color: theme.accent.gold }]}>
                        ON THIS DAY · {onThisDay[0].yearsAgo} YR{onThisDay[0].yearsAgo === 1 ? "" : "S"} AGO
                      </Text>
                    </View>
                    <Text style={[styles.onThisDayTitle, { color: theme.ink.primary }]} numberOfLines={1}>
                      {onThisDay[0].title}
                    </Text>
                    {onThisDay[0].locationName ? (
                      <Text style={[styles.onThisDayMeta, { color: theme.ink.muted }]}>{onThisDay[0].locationName}</Text>
                    ) : null}
                  </View>
                </AnimatedPressable>
              </Stagger>
            ) : null}

            {/* Anniversary strip */}
            {anniversaries.length > 0 ? (
              <Stagger delay={140}>
                <Text style={[styles.sectionEyebrow, { color: theme.ink.muted }]}>UPCOMING UNLOCKS</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={anniversaries}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.anniversariesList}
                  renderItem={({ item }) => (
                    <AnimatedPressable
                      onPress={() =>
                        navigation.navigate("Countdown", {
                          eventId: item.id,
                          title: item.title,
                          unlockAt: item.unlockAt
                        })
                      }
                      style={[styles.anniversaryCard, { backgroundColor: theme.bg.elevated, borderColor: theme.line.soft }]}
                    >
                      <Text style={[styles.anniversaryDays, { color: theme.accent.gold }]}>
                        {item.unlocksInDays === 0 ? "TODAY" : `IN ${item.unlocksInDays}D`}
                      </Text>
                      <Text style={[styles.anniversaryTitle, { color: theme.ink.primary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </AnimatedPressable>
                  )}
                />
              </Stagger>
            ) : null}

            {/* Filter row */}
            <Stagger delay={180} style={{ marginTop: 22, marginBottom: 18 }}>
              <FilterChips
                options={filterOptions.map((opt) => ({ ...opt, count: counts[opt.value] }))}
                value={filter}
                onChange={setFilter}
              />
            </Stagger>

            <Stagger delay={220} style={styles.linksRow}>
              <AnimatedPressable
                onPress={() => navigation.navigate("Explore")}
                style={[styles.linkPill, { borderColor: theme.line.soft }]}
              >
                <Compass color={theme.ink.muted} size={13} />
                <Text style={[styles.linkText, { color: theme.ink.muted }]}>Explore</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => navigation.navigate("RecapReel", { year: new Date().getFullYear() - 1 })}
                style={[styles.linkPill, { borderColor: theme.line.soft }]}
              >
                <Text style={[styles.linkText, { color: theme.ink.muted }]}>Year recap</Text>
              </AnimatedPressable>
            </Stagger>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Stagger delay={120 + index * 70} translate={16}>
            <MemoryCard
              event={item}
              onPress={() =>
                item.state === "LOCKED" && item.unlockAt
                  ? navigation.navigate("Countdown", { eventId: item.id, title: item.title, unlockAt: item.unlockAt })
                  : navigation.navigate("EventDetail", { eventId: item.id })
              }
            />
          </Stagger>
        )}
        ListEmptyComponent={
          <Stagger delay={200}>
            <View style={[styles.empty, { borderColor: theme.line.soft, backgroundColor: theme.bg.surface }]}>
              <Text style={[styles.emptyTitle, { color: theme.ink.primary }]}>No capsules yet</Text>
              <Text style={[styles.emptyBody, { color: theme.ink.muted }]}>
                Start with a trip, a birthday, or a week you do not want to disappear into the camera roll.
              </Text>
              <View style={{ marginTop: 18 }}>
                <PrimaryButton onPress={() => navigation.navigate("CreateEvent")} icon={Plus}>
                  Create your first capsule
                </PrimaryButton>
              </View>
            </View>
          </Stagger>
        }
      />
    </Screen>
  );
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Up late";
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 140 },
  heroRow: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 26 },
  eyebrow: { ...type.micro, letterSpacing: 2.8 },
  headline: { ...type.display, fontSize: 38, lineHeight: 42, marginTop: 8 },
  headlineMeta: { ...type.caption, marginTop: 6 },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center"
  },
  onThisDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1
  },
  onThisDayCover: { width: 58, height: 58, borderRadius: radii.md },
  onThisDayHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  onThisDayEyebrow: { ...type.micro, letterSpacing: 1.5, fontWeight: "800" },
  onThisDayTitle: { ...type.subtitle, fontWeight: "700", marginTop: 4 },
  onThisDayMeta: { ...type.caption, marginTop: 2 },
  sectionEyebrow: { ...type.micro, letterSpacing: 2.4, marginTop: 24, marginBottom: 10 },
  anniversariesList: { gap: 8 },
  anniversaryCard: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 140
  },
  anniversaryDays: { ...type.micro, letterSpacing: 1.6, fontWeight: "800" },
  anniversaryTitle: { ...type.body, fontWeight: "700", marginTop: 4 },
  linksRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  linkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1
  },
  linkText: { ...type.caption, fontWeight: "600" },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 22,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: 8
  },
  emptyTitle: { ...type.title },
  emptyBody: { ...type.body, textAlign: "center" }
});
