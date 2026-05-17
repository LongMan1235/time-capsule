import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface FeedItem {
  kind: "memory" | "capsule";
  createdAt: string;
  eventId: string;
  eventTitle: string;
  mediaId?: string;
  mediaUrl?: string;
  caption?: string | null;
  authorId: string;
  authorName: string;
}

export function FriendFeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    api<{ items: FeedItem[] }>("/feed/friends")
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>FRIENDS' MEMORIES</Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.eventId}-${item.mediaId ?? i}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing new from friends. Add some friends to see their memories.</Text>
        }
        renderItem={({ item, index }) => (
          <Stagger delay={60 + index * 50}>
            <AnimatedPressable
              onPress={() => navigation.navigate("EventDetail", { eventId: item.eventId })}
              style={styles.row}
            >
              {item.mediaUrl ? (
                <Image source={{ uri: item.mediaUrl }} style={styles.thumb} contentFit="cover" transition={300} />
              ) : (
                <View style={styles.thumb} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.authorName} <Text style={styles.muted}>added to</Text> {item.eventTitle}</Text>
                {item.caption ? <Text style={styles.caption} numberOfLines={1}>"{item.caption}"</Text> : null}
                <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
              </View>
            </AnimatedPressable>
          </Stagger>
        )}
      />
    </Screen>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = diff / 3_600_000;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eyebrow: { ...type.micro, color: colors.muted },
  content: { padding: 20, paddingBottom: 140, gap: 10 },
  empty: { ...type.body, color: colors.muted, textAlign: "center", marginTop: 40 },
  row: { flexDirection: "row", gap: 12, padding: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  thumb: { width: 60, height: 60, borderRadius: radii.sm, backgroundColor: colors.dusk },
  title: { ...type.body, color: colors.fog, fontWeight: "600" },
  muted: { color: colors.muted, fontWeight: "400" },
  caption: { ...type.caption, color: colors.muted, marginTop: 2 },
  time: { ...type.micro, color: colors.muted, marginTop: 4 }
});
