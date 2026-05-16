import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
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
      // empty state will show
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
          <Animated.View style={{ opacity: headerOpacity }}>
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>{greeting.toUpperCase()}</Text>
                <Text style={styles.title}>
                  {displayName ? `Hello, ${displayName}` : "Your archive"}
                </Text>
              </View>
              <AnimatedPressable onPress={() => navigation.navigate("CreateEvent")} style={styles.createPill}>
                <Plus color={colors.fog} size={16} />
              </AnimatedPressable>
            </View>

            <Stagger delay={140} style={styles.filterRow}>
              <FilterChips
                options={filterOptions.map((opt) => ({ ...opt, count: counts[opt.value] }))}
                value={filter}
                onChange={setFilter}
              />
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
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.hero, color: colors.fog, marginTop: 4 },
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
  empty: { alignItems: "center", gap: 12, paddingVertical: 60, paddingHorizontal: 12 },
  emptyTitle: { ...type.title, color: colors.fog, textAlign: "center" },
  emptyBody: { ...type.body, color: colors.muted, textAlign: "center" }
});
