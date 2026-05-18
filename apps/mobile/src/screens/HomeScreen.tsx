import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { CalendarHeart, Clapperboard, Compass, Plus } from "lucide-react-native";
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
import { colors, radii, type } from "../design/theme";
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

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.7], extrapolate: "clamp" });

  return (
    <Screen tone="paper" edges={["top", "left", "right"]}>
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.gold} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Animated.View style={{ opacity: headerOpacity }}>
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>{greeting.toUpperCase()}</Text>
                <Text style={styles.title}>
                  {displayName ? `Hello, ${displayName}` : "Your scrapbook"}
                </Text>
                <Text style={styles.subtitle}>{counts.all} {counts.all === 1 ? "page" : "pages"}</Text>
              </View>
              <AnimatedPressable onPress={() => navigation.navigate("CreateEvent")} style={styles.createPill}>
                <Plus color={colors.fog} size={16} />
              </AnimatedPressable>
            </View>

            {onThisDay.length > 0 ? (
              <Stagger delay={120} style={{ marginBottom: 16 }}>
                <AnimatedPressable
                  onPress={() => navigation.navigate("EventDetail", { eventId: onThisDay[0].id })}
                  style={styles.onThisDay}
                >
                  {onThisDay[0].coverUrl ? (
                    <Image source={{ uri: onThisDay[0].coverUrl }} style={styles.onThisDayCover} contentFit="cover" transition={300} />
                  ) : (
                    <View style={styles.onThisDayCover} />
                  )}
                  <View style={styles.onThisDayBody}>
                    <View style={styles.onThisDayHeader}>
                      <CalendarHeart color={colors.gold} size={12} />
                      <Text style={styles.onThisDayEyebrow}>ON THIS DAY · {onThisDay[0].yearsAgo} YR{onThisDay[0].yearsAgo === 1 ? "" : "S"} AGO</Text>
                    </View>
                    <Text style={styles.onThisDayTitle} numberOfLines={1}>{onThisDay[0].title}</Text>
                    {onThisDay[0].locationName ? (
                      <Text style={styles.onThisDayMeta}>{onThisDay[0].locationName}</Text>
                    ) : null}
                  </View>
                </AnimatedPressable>
              </Stagger>
            ) : null}

            <Stagger delay={140} style={styles.filterRow}>
              <FilterChips
                options={filterOptions.map((opt) => ({ ...opt, count: counts[opt.value] }))}
                value={filter}
                onChange={setFilter}
              />
            </Stagger>

            {anniversaries.length > 0 ? (
              <Stagger delay={160} style={{ marginBottom: 12 }}>
                <Text style={styles.eyebrowMuted}>UPCOMING UNLOCKS</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={anniversaries}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ gap: 8, paddingTop: 8 }}
                  renderItem={({ item }) => (
                    <AnimatedPressable
                      onPress={() =>
                        navigation.navigate("Countdown", {
                          eventId: item.id,
                          title: item.title,
                          unlockAt: item.unlockAt
                        })
                      }
                      style={styles.anniversaryCard}
                    >
                      <Text style={styles.anniversaryDays}>
                        {item.unlocksInDays === 0 ? "today" : `in ${item.unlocksInDays}d`}
                      </Text>
                      <Text style={styles.anniversaryTitle} numberOfLines={1}>{item.title}</Text>
                    </AnimatedPressable>
                  )}
                />
              </Stagger>
            ) : null}

            <Stagger delay={180} style={styles.linksRow}>
              <AnimatedPressable onPress={() => navigation.navigate("Explore")} style={styles.exploreRow}>
                <Compass color={colors.muted} size={14} />
                <Text style={styles.exploreText}>Explore</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => navigation.navigate("RecapReel", { year: new Date().getFullYear() - 1 })}
                style={styles.exploreRow}
              >
                <Clapperboard color={colors.muted} size={14} />
                <Text style={styles.exploreText}>Year recap</Text>
              </AnimatedPressable>
            </Stagger>
          </Animated.View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        renderItem={({ item, index }) => (
          <Stagger delay={80 + index * 60} translate={16}>
            <MemoryCard
              event={item}
              featured={index === 0 && filter === "all"}
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
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No capsules yet</Text>
              <Text style={styles.emptyBody}>
                Start with a trip, a birthday, or a week you do not want to disappear into the camera roll.
              </Text>
              <PrimaryButton onPress={() => navigation.navigate("CreateEvent")} icon={Plus}>
                Create capsule
              </PrimaryButton>
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
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 },
  topBar: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 24 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.hero, color: colors.fog, marginTop: 4 },
  subtitle: { ...type.caption, color: colors.muted, marginTop: 4 },
  createPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineBright,
    backgroundColor: colors.card
  },
  filterRow: { marginBottom: 20 },
  onThisDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.30)",
    backgroundColor: "rgba(232,194,107,0.06)"
  },
  onThisDayCover: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.dusk },
  onThisDayBody: { flex: 1, gap: 4 },
  onThisDayHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  onThisDayEyebrow: { ...type.micro, color: colors.gold, letterSpacing: 1.4 },
  onThisDayTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  onThisDayMeta: { ...type.caption, color: colors.muted },
  exploreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  exploreText: { ...type.caption, color: colors.muted, fontWeight: "600" },
  linksRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  eyebrowMuted: { ...type.micro, color: colors.muted },
  anniversaryCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    minWidth: 140
  },
  anniversaryDays: { ...type.micro, color: colors.gold, letterSpacing: 1.4 },
  anniversaryTitle: { ...type.body, color: colors.fog, fontWeight: "600", marginTop: 4 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 60, paddingHorizontal: 12 },
  emptyTitle: { ...type.title, color: colors.fog, textAlign: "center" },
  emptyBody: { ...type.body, color: colors.muted, textAlign: "center" }
});
