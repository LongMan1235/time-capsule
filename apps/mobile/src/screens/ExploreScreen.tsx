import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EventSummary } from "@time-capsule/shared";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { MemoryCard } from "../components/MemoryCard";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<EventSummary[]>([]);

  useEffect(() => {
    api<{ events: EventSummary[] }>("/explore/public")
      .then((r) => setEvents(r.events))
      .catch(() => setEvents([]));
  }, []);

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>EXPLORE</Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 4, marginBottom: 14 }}>
            <Stagger delay={80}>
              <Text style={styles.title}>Public capsules</Text>
            </Stagger>
            <Stagger delay={180}>
              <Text style={styles.subtitle}>
                Capsules people chose to share — weddings, eulogies, moments worth holding in public.
              </Text>
            </Stagger>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No public capsules yet. Make one with the Public memorial toggle.</Text>
        }
        renderItem={({ item, index }) => (
          <Stagger delay={80 + index * 60} translate={16}>
            <MemoryCard
              event={item}
              onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
            />
          </Stagger>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eyebrow: { ...type.micro, color: colors.muted },
  content: { padding: 20, paddingBottom: 140 },
  title: { ...type.hero, color: colors.fog },
  subtitle: { ...type.body, color: colors.muted, marginTop: 6 },
  emptyText: { ...type.body, color: colors.muted, textAlign: "center", marginTop: 40 }
});
