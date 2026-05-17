import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Camera, Hourglass, ImagePlus, Lock, MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CapsuleState, MediaDetail } from "@time-capsule/shared";
import { api } from "../api/client";
import { pickAndUploadMedia } from "../api/uploads";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { daysUntil, formatDate, timeUntil } from "../utils/dates";

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  locationName?: string;
  coverUrl?: string | null;
  unlockAt?: string | null;
  collectionClosesAt?: string | null;
  state?: CapsuleState;
  mediaCap?: number | null;
  mediaCapPerUser?: number | null;
  mediaCountForMe?: number;
  media: MediaDetail[];
}

const HERO_HEIGHT = 280;
const fallbackCover = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=70";

export function EventDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "EventDetail">) {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventDetail>();
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  async function load() {
    return api<{ event: EventDetail }>(`/events/${route.params.eventId}`)
      .then((response) => setEvent(response.event))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load event"));
  }

  async function pickFromLibrary() {
    try {
      setUploading(true);
      await pickAndUploadMedia(route.params.eventId);
      await load();
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setUploading(false);
    }
  }

  function openCamera() {
    if (!event) return;
    navigation.navigate("CameraCapture", { eventId: event.id, title: event.title });
  }

  useEffect(() => {
    load();
  }, [route.params.eventId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  if (error) {
    return (
      <Screen tone="paper">
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      </Screen>
    );
  }

  if (!event) {
    return (
      <Screen tone="paper">
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      </Screen>
    );
  }

  const collecting = event.state === "COLLECTING" || event.state === "DRAFT";
  const sealed = event.state === "LOCKED";
  const collectionClosesIn = event.collectionClosesAt ? daysUntil(event.collectionClosesAt) : 0;
  const collectionMinutesLeft = event.collectionClosesAt
    ? Math.max(0, Math.floor(timeUntil(event.collectionClosesAt).totalMs / 60_000))
    : 0;
  const totalCapReached = !!event.mediaCap && event.media.length >= event.mediaCap;
  const myCount = event.mediaCountForMe ?? 0;
  const perUserCapReached = !!event.mediaCapPerUser && myCount >= event.mediaCapPerUser;
  const capReached = totalCapReached || perUserCapReached;

  const heroScale = scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.30, 1], extrapolate: "clamp" });
  const heroTranslate = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT], outputRange: [0, -HERO_HEIGHT / 2], extrapolate: "clamp" });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT * 0.8], outputRange: [0.8, 0.2], extrapolate: "clamp" });

  return (
    <Screen tone="paper" edges={[]} texture={false}>
      <Animated.View
        style={[
          styles.hero,
          { opacity: heroOpacity, transform: [{ translateY: heroTranslate }, { scale: heroScale }] }
        ]}
      >
        <Image source={{ uri: event.coverUrl ?? fallbackCover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={500} />
        <LinearGradient colors={["rgba(15,13,20,0.35)", "rgba(15,13,20,0.75)", "rgba(15,13,20,1)"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
      </View>

      <Animated.FlatList
        data={event.media}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={[styles.content, { paddingTop: HERO_HEIGHT - 80, paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Stagger delay={120}>
              <View style={styles.row}>
                <Text style={styles.date}>{formatDate(event.eventDate)}</Text>
                <StatusPill state={event.state} />
              </View>
            </Stagger>
            <Stagger delay={220}>
              <Text style={styles.title}>{event.title}</Text>
            </Stagger>
            {event.locationName ? (
              <Stagger delay={320}>
                <View style={styles.locationRow}>
                  <MapPin color={colors.muted} size={13} />
                  <Text style={styles.locationText}>{event.locationName}</Text>
                </View>
              </Stagger>
            ) : null}
            {event.description ? (
              <Stagger delay={420}>
                <Text style={styles.description}>{event.description}</Text>
              </Stagger>
            ) : null}

            {collecting && event.collectionClosesAt ? (
              <Stagger delay={520}>
                <View style={styles.windowCard}>
                  <Hourglass color={colors.gold} size={14} />
                  <Text style={styles.windowText}>
                    {collectionClosesIn > 0
                      ? `${collectionClosesIn} ${collectionClosesIn === 1 ? "day" : "days"} left to add memories`
                      : `${collectionMinutesLeft} min left to add memories`}
                  </Text>
                </View>
              </Stagger>
            ) : null}

            {sealed ? (
              <Stagger delay={520}>
                <View style={styles.windowCard}>
                  <Lock color={colors.muted} size={14} />
                  <Text style={[styles.windowText, { color: colors.muted }]}>
                    Sealed. Reopens {event.unlockAt ? formatDate(event.unlockAt) : "soon"}.
                  </Text>
                </View>
              </Stagger>
            ) : null}

            {collecting ? (
              <Stagger delay={620} style={styles.captureRow}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton onPress={openCamera} icon={Camera} disabled={capReached}>
                    Camera
                  </PrimaryButton>
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton onPress={pickFromLibrary} loading={uploading} icon={ImagePlus} variant="ghost" disabled={capReached}>
                    Library
                  </PrimaryButton>
                </View>
              </Stagger>
            ) : null}

            {perUserCapReached ? (
              <Text style={styles.capNote}>You've added all {event.mediaCapPerUser} of your photos.</Text>
            ) : event.mediaCapPerUser ? (
              <Text style={styles.capNote}>
                You · {myCount} / {event.mediaCapPerUser}
                {event.mediaCap ? ` · capsule ${event.media.length} / ${event.mediaCap}` : ""}
              </Text>
            ) : totalCapReached ? (
              <Text style={styles.capNote}>Capsule cap reached ({event.mediaCap}).</Text>
            ) : event.mediaCap ? (
              <Text style={styles.capNote}>{event.media.length} / {event.mediaCap} photos</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{sealed ? "Memories sealed" : "Empty page"}</Text>
            <Text style={styles.emptyBody}>
              {sealed
                ? "This capsule will reveal its memories when it unlocks."
                : "Capture or upload a photo to start filling this capsule."}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const reactionTotal = item.reactions.reduce((sum, r) => sum + r.count, 0);
          const topReaction = item.reactions[0];
          return (
            <Stagger delay={120 + index * 50} translate={14}>
              <AnimatedPressable
                onPress={() => navigation.navigate("PhotoViewer", { eventId: event.id, startIndex: index })}
                style={styles.tile}
              >
                <Image source={{ uri: item.url }} style={styles.tileImage} contentFit="cover" transition={400} />
                {(reactionTotal > 0 || item.comments.length > 0) ? (
                  <View style={styles.tileFooter}>
                    {topReaction ? (
                      <View style={styles.tileChip}>
                        <Text style={styles.tileChipEmoji}>{topReaction.emoji}</Text>
                        <Text style={styles.tileChipCount}>{reactionTotal}</Text>
                      </View>
                    ) : null}
                    {item.comments.length > 0 ? (
                      <View style={styles.tileChip}>
                        <Text style={styles.tileChipCount}>💬 {item.comments.length}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </AnimatedPressable>
            </Stagger>
          );
        }}
      />
    </Screen>
  );
}

function StatusPill({ state }: { state?: CapsuleState }) {
  if (!state) return null;
  const label = state === "LOCKED" ? "SEALED" : state === "UNLOCKED" ? "OPEN" : state === "COLLECTING" ? "COLLECTING" : "DRAFT";
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const screenWidth = Dimensions.get("window").width;
const tileSize = (screenWidth - 20 * 2 - 10) / 2;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { ...type.subtitle, color: colors.fog },
  hero: { position: "absolute", top: 0, left: 0, right: 0, height: HERO_HEIGHT, overflow: "hidden" },
  topBar: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(11,10,16,0.55)"
  },
  content: { paddingHorizontal: 20 },
  headerCard: {
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
    gap: 8
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  date: { ...type.caption, color: colors.muted },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line
  },
  statusText: { ...type.micro, color: colors.muted, letterSpacing: 1.2 },
  title: { ...type.hero, color: colors.fog, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  locationText: { ...type.caption, color: colors.muted },
  description: { ...type.body, color: colors.muted, marginTop: 6 },
  windowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.25)",
    backgroundColor: "rgba(232,194,107,0.06)",
    marginTop: 6
  },
  windowText: { ...type.caption, color: colors.fog, flex: 1 },
  captureRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  capNote: { ...type.micro, color: colors.muted, marginTop: 8, letterSpacing: 1 },
  empty: { paddingVertical: 40, gap: 6, alignItems: "center" },
  emptyTitle: { ...type.heading, color: colors.fog },
  emptyBody: { ...type.body, color: colors.muted, textAlign: "center", paddingHorizontal: 24 },
  columns: { gap: 10, marginBottom: 10 },
  tile: {
    width: tileSize,
    height: tileSize * 1.18,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.dusk
  },
  tileImage: { flex: 1 },
  tileFooter: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    gap: 6
  },
  tileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(8,6,12,0.65)",
    borderWidth: 1,
    borderColor: colors.line
  },
  tileChipEmoji: { fontSize: 12 },
  tileChipCount: { ...type.micro, color: colors.fog, letterSpacing: 0.5 }
});
