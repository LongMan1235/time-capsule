import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { ArrowLeft, Pause, Play, Share2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface RecapMemory {
  id: string;
  url: string;
  caption?: string | null;
  eventTitle: string;
  eventId: string;
  capturedAt?: string | null;
}

const FRAME_MS = 2200;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function RecapReelScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "RecapReel">) {
  const insets = useSafeAreaInsets();
  const year = route.params.year;
  const [memories, setMemories] = useState<RecapMemory[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  const advance = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    api<{ memories: RecapMemory[] }>(`/recap/${year}`)
      .then((r) => setMemories(r.memories))
      .catch(() => setMemories([]));
  }, [year]);

  useEffect(() => {
    if (!playing || memories.length === 0) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: FRAME_MS, useNativeDriver: false }).start(({ finished }) => {
      if (finished) advance.current = setTimeout(() => setIndex((i) => (i + 1) % memories.length), 80);
    });
    return () => {
      if (advance.current) clearTimeout(advance.current);
    };
  }, [index, playing, memories.length, progress]);

  async function shareReel() {
    try {
      await Share.share({ message: `My ${year} in Time Capsule.` });
    } catch (error) {
      Alert.alert("Could not share", error instanceof Error ? error.message : "Try again.");
    }
  }

  const current = memories[index];
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Screen tone="paper" edges={[]} texture={false}>
      <View style={styles.root}>
        {current ? (
          <Image source={{ uri: current.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink }]} />
        )}
        <View style={[StyleSheet.absoluteFill, styles.scrim]} />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft color={colors.fog} size={20} />
          </AnimatedPressable>
          <Text style={styles.year}>{year}</Text>
          <AnimatedPressable onPress={shareReel} style={styles.iconBtn}>
            <Share2 color={colors.fog} size={18} />
          </AnimatedPressable>
        </View>

        <View style={styles.progressRow}>
          {memories.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              {i < index ? (
                <View style={[styles.progressFill, { width: "100%" }]} />
              ) : i === index ? (
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              ) : null}
            </View>
          ))}
        </View>

        {current ? (
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]} pointerEvents="box-none">
            <Text style={styles.eventTitle} numberOfLines={1}>{current.eventTitle}</Text>
            {current.caption ? <Text style={styles.caption}>{current.caption}</Text> : null}
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No memories from {year}</Text>
            <Text style={styles.emptyBody}>Open a capsule from that year to fill this reel.</Text>
          </View>
        )}

        {memories.length > 0 ? (
          <AnimatedPressable onPress={() => setPlaying((p) => !p)} style={styles.playButton}>
            {playing ? <Pause color={colors.ink} size={18} fill={colors.ink} /> : <Play color={colors.ink} size={18} fill={colors.ink} />}
          </AnimatedPressable>
        ) : null}

        <AnimatedPressable onPress={() => setIndex((i) => Math.max(0, i - 1))} style={[styles.tapZone, { left: 0 }]} />
        <AnimatedPressable onPress={() => setIndex((i) => Math.min(memories.length - 1, i + 1))} style={[styles.tapZone, { right: 0 }]} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { backgroundColor: "rgba(8,6,12,0.50)" },
  topBar: { position: "absolute", top: 0, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(11,10,16,0.55)" },
  year: { ...type.subtitle, color: colors.fog, fontWeight: "700" },
  progressRow: { position: "absolute", top: 64, left: 16, right: 16, flexDirection: "row", gap: 4 },
  progressTrack: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.fog },
  bottom: { position: "absolute", left: 24, right: 24, bottom: 0 },
  eventTitle: { ...type.title, color: colors.fog },
  caption: { ...type.body, color: colors.fog, opacity: 0.85, marginTop: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { ...type.title, color: colors.fog },
  emptyBody: { ...type.body, color: colors.muted, marginTop: 8, textAlign: "center" },
  playButton: { position: "absolute", bottom: 40, alignSelf: "center", width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fog, alignItems: "center", justifyContent: "center" },
  tapZone: { position: "absolute", top: 100, bottom: 100, width: SCREEN_WIDTH / 3 }
});
