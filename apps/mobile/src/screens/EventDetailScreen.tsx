import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, ImagePlus, MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { pickAndUploadMedia } from "../api/uploads";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, gradients, radii, shadow, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { formatDate } from "../utils/dates";

interface Media {
  id: string;
  url: string;
  kind: string;
  caption?: string;
  capturedAt?: string;
}

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  locationName?: string;
  coverUrl?: string | null;
  media: Media[];
}

const HERO_HEIGHT = 320;
const fallbackCover = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";

export function EventDetailScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "EventDetail">) {
  const [event, setEvent] = useState<EventDetail>();
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  async function load() {
    return api<{ event: EventDetail }>(`/events/${route.params.eventId}`)
      .then((response) => setEvent(response.event))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load event"));
  }

  async function upload() {
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

  useEffect(() => {
    load();
  }, [route.params.eventId]);

  if (error) {
    return (
      <Screen>
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      </Screen>
    );
  }

  if (!event) {
    return (
      <Screen>
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      </Screen>
    );
  }

  const heroScale = scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.4, 1], extrapolate: "clamp" });
  const heroTranslate = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT], outputRange: [0, -HERO_HEIGHT / 2], extrapolate: "clamp" });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, HERO_HEIGHT * 0.7], outputRange: [1, 0.2], extrapolate: "clamp" });
  const headerOpacity = scrollY.interpolate({ inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT], outputRange: [0, 1], extrapolate: "clamp" });

  return (
    <Screen edges={["bottom"]} ambient={false} grain={false}>
      <Animated.View
        style={[
          styles.hero,
          { opacity: heroOpacity, transform: [{ translateY: heroTranslate }, { scale: heroScale }] }
        ]}
      >
        <Image source={{ uri: event.coverUrl ?? fallbackCover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={500} />
        <LinearGradient colors={["rgba(0,0,0,0)", "rgba(11,10,16,0.55)", "rgba(11,10,16,0.95)"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]} pointerEvents="none">
        <Text style={styles.stickyTitle} numberOfLines={1}>{event.title}</Text>
      </Animated.View>

      <View style={styles.topBar} pointerEvents="box-none">
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
      </View>

      <Animated.FlatList
        data={event.media}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Stagger delay={120}>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{formatDate(event.eventDate)}</Text>
              </View>
            </Stagger>
            <Stagger delay={240}>
              <Text style={styles.title}>{event.title}</Text>
            </Stagger>
            {event.locationName ? (
              <Stagger delay={340}>
                <View style={styles.locationRow}>
                  <MapPin color={colors.gold} size={14} />
                  <Text style={styles.locationText}>{event.locationName}</Text>
                </View>
              </Stagger>
            ) : null}
            {event.description ? (
              <Stagger delay={440}>
                <Text style={styles.description}>{event.description}</Text>
              </Stagger>
            ) : null}
            <Stagger delay={520} style={{ marginTop: 16 }}>
              <PrimaryButton onPress={upload} loading={uploading} icon={ImagePlus} variant="ghost">
                Add memory
              </PrimaryButton>
            </Stagger>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>This capsule is empty.</Text>
            <Text style={styles.emptyBody}>Add a photo, video, or voice note — every memory becomes a future surprise.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Stagger delay={120 + index * 60} translate={18}>
            <View style={[styles.tile, shadow.soft]}>
              <Image source={{ uri: item.url }} style={styles.tileImage} contentFit="cover" transition={400} />
              {item.caption ? (
                <View style={styles.captionWrap}>
                  <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]} style={StyleSheet.absoluteFill} />
                  <Text style={styles.caption}>{item.caption}</Text>
                </View>
              ) : null}
            </View>
          </Stagger>
        )}
      />
    </Screen>
  );
}

const screenWidth = Dimensions.get("window").width;
const tileSize = (screenWidth - 20 * 2 - 10) / 2;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { ...type.subtitle, color: colors.fog },
  hero: { position: "absolute", top: 0, left: 0, right: 0, height: HERO_HEIGHT, overflow: "hidden" },
  topBar: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" },
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
  stickyHeader: {
    position: "absolute",
    top: 14,
    left: 60,
    right: 60,
    alignItems: "center",
    zIndex: 5
  },
  stickyTitle: { ...type.subtitle, color: colors.fog, fontWeight: "800" },
  content: { paddingTop: HERO_HEIGHT - 40, paddingHorizontal: 20, paddingBottom: 140 },
  headerCard: {
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: "rgba(11,10,16,0.86)",
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 20,
    gap: 10
  },
  metaPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(232,194,107,0.14)",
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.35)"
  },
  metaPillText: { ...type.micro, color: colors.gold },
  title: { ...type.hero, color: colors.fog },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { ...type.body, color: colors.fog },
  description: { ...type.body, color: colors.muted, marginTop: 8, lineHeight: 22 },
  empty: { paddingVertical: 40, gap: 8 },
  emptyTitle: { ...type.heading, color: colors.fog },
  emptyBody: { ...type.body, color: colors.muted },
  columns: { gap: 10, marginBottom: 10 },
  tile: {
    width: tileSize,
    height: tileSize * 1.18,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.dusk,
    borderWidth: 1,
    borderColor: colors.line
  },
  tileImage: { flex: 1 },
  captionWrap: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 10 },
  caption: { color: colors.fog, fontWeight: "700", fontSize: 12 }
});
