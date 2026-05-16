import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Plus, Sparkles } from "lucide-react-native";
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
import { colors, gradients, radii, shadow, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { LinearGradient } from "expo-linear-gradient";
import { useSessionStore } from "../store/session";

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
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const scrollY = useRef(new Animated.Value(0)).current;
  const user = useSessionStore((state) => state.user);
  const greeting = greetingForNow();
  const displayName = user?.displayName ?? user?.username;

  async function load() {
    setRefreshing(true);
    try {
      const response = await api<{ events: EventSummary[] }>("/events");
      setEvents(response.events);
    } catch {
      // surface via empty state — keep silent for now
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => ({
    all: events.length,
    locked: events.filter((event) => event.state === "LOCKED").length,
    open: events.filter((event) => event.state === "UNLOCKED").length,
    draft: events.filter((event) => event.state === "DRAFT").length
  }), [events]);

  const filteredOptions = filterOptions.map((option) => ({ ...option, count: counts[option.value] }));

  const filtered = useMemo(() => {
    switch (filter) {
      case "locked": return events.filter((e) => e.state === "LOCKED");
      case "open": return events.filter((e) => e.state === "UNLOCKED");
      case "draft": return events.filter((e) => e.state === "DRAFT");
      default: return events;
    }
  }, [events, filter]);

  const heroOpacity = scrollY.interpolate({ inputRange: [0, 90], outputRange: [1, 0.65], extrapolate: "clamp" });
  const heroTranslate = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -28], extrapolate: "clamp" });

  return (
    <Screen edges={["top", "left", "right"]}>
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.gold} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }}>
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>YOUR ARCHIVE</Text>
                <Text style={styles.greeting}>
                  {greeting}
                  {displayName ? (
                    <>
                      , <Text style={styles.greetingAccent}>{displayName}</Text>
                    </>
                  ) : null}
                </Text>
              </View>
              <AnimatedPressable onPress={() => navigation.navigate("CreateEvent")} style={[styles.createPill, shadow.glow]}>
                <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.createPillFill}>
                  <Plus color={colors.ink} size={18} />
                  <Text style={styles.createPillText}>New capsule</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>

            <Stagger delay={120}>
              <Text style={styles.title}>Capsules waiting{"\n"}for their moment.</Text>
            </Stagger>

            <Stagger delay={260} style={styles.statRow}>
              <StatPill label="Sealed" value={counts.locked} accent />
              <StatPill label="Open" value={counts.open} />
              <StatPill label="Drafts" value={counts.draft} />
            </Stagger>

            <Stagger delay={400} style={{ marginTop: 18 }}>
              <FilterChips options={filteredOptions} value={filter} onChange={setFilter} />
            </Stagger>
          </Animated.View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        renderItem={({ item, index }) => (
          <Stagger delay={120 + index * 80} translate={24}>
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
          <Stagger delay={300}>
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Sparkles color={colors.gold} size={28} />
              </View>
              <Text style={styles.emptyTitle}>No capsules yet</Text>
              <Text style={styles.emptyBody}>
                Start with a trip, a birthday, or a week you do not want to disappear into the camera roll.
              </Text>
              <PrimaryButton onPress={() => navigation.navigate("CreateEvent")} icon={Plus}>
                Create your first capsule
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

function StatPill({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={[styles.stat, accent ? styles.statAccent : null]}>
      <Text style={[styles.statValue, accent ? styles.statValueAccent : null]}>{value}</Text>
      <Text style={[styles.statLabel, accent ? styles.statLabelAccent : null]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  eyebrow: { ...type.micro, color: colors.gold },
  greeting: { ...type.subtitle, color: colors.fog, marginTop: 4 },
  greetingAccent: { color: colors.gold, fontWeight: "800" },
  createPill: { borderRadius: radii.pill, overflow: "hidden" },
  createPillFill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  createPillText: { color: colors.ink, fontWeight: "800", fontSize: 13 },
  title: { ...type.hero, color: colors.fog, marginBottom: 22 },
  statRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  statAccent: { borderColor: "rgba(232,194,107,0.40)", backgroundColor: "rgba(232,194,107,0.10)" },
  statValue: { ...type.title, color: colors.fog, fontVariant: ["tabular-nums"] },
  statValueAccent: { color: colors.gold },
  statLabel: { ...type.caption, color: colors.muted, marginTop: 4 },
  statLabelAccent: { color: colors.goldDeep },
  empty: { alignItems: "center", gap: 14, paddingVertical: 60 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,194,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.35)",
    marginBottom: 6
  },
  emptyTitle: { ...type.title, color: colors.fog, textAlign: "center" },
  emptyBody: { ...type.body, color: colors.muted, textAlign: "center", paddingHorizontal: 12 }
});
