import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Share2, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface Recap {
  paragraphs: string[];
  stats: {
    memories: number;
    contributors: number;
    daysSpan: number;
    reactions: number;
    comments: number;
  };
  topEmoji: string | null;
  highlights: Array<{ id: string; url: string; caption: string | null; kind: string }>;
  generatedAt: string;
}

export function EventRecapScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "EventRecap">) {
  const insets = useSafeAreaInsets();
  const [recap, setRecap] = useState<Recap | undefined>();
  const [error, setError] = useState<string | undefined>();
  const gradient = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api<Recap>(`/events/${route.params.eventId}/summary`)
      .then(setRecap)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not generate recap"));
  }, [route.params.eventId]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradient, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(gradient, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [gradient]);

  async function share() {
    if (!recap) return;
    try {
      await Share.share({
        message: `${route.params.title} — ${recap.stats.memories} memories\n\n${recap.paragraphs.join("\n\n")}`
      });
    } catch {
      // user cancelled
    }
  }

  return (
    <Screen tone="paper" edges={[]} texture>
      <AnimatedBackdrop drift={gradient} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>RECAP</Text>
        <AnimatedPressable onPress={share} style={styles.iconBtn}>
          <Share2 color={colors.fog} size={18} />
        </AnimatedPressable>
      </View>

      {!recap ? (
        <View style={styles.loading}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.loadingText}>Reading your capsule…</Text>
            </>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <AnimatedPolaroidStack highlights={recap.highlights} />

          <View style={styles.titleBlock}>
            <View style={styles.sparkleBadge}>
              <Sparkles color={colors.ink} size={11} />
              <Text style={styles.sparkleBadgeText}>AI RECAP</Text>
            </View>
            <Text style={styles.title}>{route.params.title}</Text>
          </View>

          <View style={styles.paragraphCard}>
            <WordReveal text={recap.paragraphs[0]} startDelay={300} />
            <View style={{ height: 12 }} />
            <WordReveal text={recap.paragraphs[1]} startDelay={1400} italic />
            <View style={{ height: 12 }} />
            <WordReveal text={recap.paragraphs[2]} startDelay={2400} />
          </View>

          <View style={styles.statRow}>
            <StatTile label="MEMORIES" value={recap.stats.memories} delay={3000} />
            <StatTile label="PEOPLE" value={recap.stats.contributors} delay={3200} />
            <StatTile label="DAYS" value={recap.stats.daysSpan} delay={3400} />
            <StatTile
              label="REACTIONS"
              value={recap.stats.reactions}
              delay={3600}
              suffix={recap.topEmoji ?? undefined}
            />
          </View>

          {recap.highlights.length > 0 ? (
            <View style={styles.highlights}>
              <Text style={styles.highlightsLabel}>HIGHLIGHTS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 10 }}>
                {recap.highlights.map((highlight, i) => (
                  <HighlightCard key={highlight.id} highlight={highlight} delay={3800 + i * 150} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.footer}>Generated by Time Capsule · {formatTime(recap.generatedAt)}</Text>
        </ScrollView>
      )}
    </Screen>
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(new Date(iso));
}

function AnimatedBackdrop({ drift }: { drift: Animated.Value }) {
  const opacityA = drift.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.25] });
  const opacityB = drift.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const translateA = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const translateB = drift.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.blobA,
          { opacity: opacityA, transform: [{ translateY: translateA }] }
        ]}
      />
      <Animated.View
        style={[
          styles.blobB,
          { opacity: opacityB, transform: [{ translateY: translateB }] }
        ]}
      />
    </View>
  );
}

function AnimatedPolaroidStack({ highlights }: { highlights: Recap["highlights"] }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [drift]);

  const rot = drift.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] });
  const lift = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const sample = highlights[0];

  return (
    <View style={styles.polaroidArea}>
      <Animated.View style={[styles.polaroidBack, { transform: [{ rotate: "-9deg" }] }]} />
      <Animated.View style={[styles.polaroidMid, { transform: [{ rotate: "5deg" }] }]} />
      <Animated.View
        style={[
          styles.polaroidFront,
          { transform: [{ rotate: rot }, { translateY: lift }] }
        ]}
      >
        {sample ? (
          <Image source={{ uri: sample.url }} style={styles.polaroidImage} contentFit="cover" transition={400} />
        ) : (
          <View style={styles.polaroidImage} />
        )}
        <Text style={styles.polaroidCaption}>{sample?.caption ?? "the recap"}</Text>
      </Animated.View>
    </View>
  );
}

function WordReveal({ text, startDelay = 0, italic = false }: { text: string; startDelay?: number; italic?: boolean }) {
  const words = text.split(/(\s+)/);
  return (
    <Text style={[styles.paragraph, italic ? styles.paragraphItalic : null]}>
      {words.map((word, i) => (
        <Word key={i} word={word} delay={startDelay + i * 60} />
      ))}
    </Text>
  );
}

function Word({ word, delay }: { word: string; delay: number }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [value, delay]);
  return <Animated.Text style={{ opacity: value }}>{word}</Animated.Text>;
}

function StatTile({ label, value, delay, suffix }: { label: string; value: number; delay: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 360, delay, useNativeDriver: true }).start();
    const start = Date.now();
    const duration = 900;
    let frame: number;
    const tick = () => {
      const elapsed = Date.now() - start - delay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [opacity, value, delay]);

  return (
    <Animated.View style={[styles.statTile, { opacity }]}>
      <Text style={styles.statValue}>
        {shown}
        {suffix ? <Text style={styles.statSuffix}> {suffix}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function HighlightCard({ highlight, delay }: { highlight: Recap["highlights"][number]; delay: number }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [value, delay]);
  const translateY = value.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return (
    <Animated.View style={[styles.highlight, { opacity: value, transform: [{ translateY }] }]}>
      <Image source={{ uri: highlight.url }} style={styles.highlightImage} contentFit="cover" transition={400} />
      {highlight.caption ? (
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
          style={styles.highlightScrim}
        />
      ) : null}
      {highlight.caption ? <Text style={styles.highlightCaption} numberOfLines={1}>{highlight.caption}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: "rgba(11,10,16,0.55)" },
  eyebrow: { ...type.micro, color: colors.gold, letterSpacing: 2 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { ...type.body, color: colors.muted, fontStyle: "italic" },
  errorText: { ...type.body, color: colors.fog },
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 22 },

  blobA: { position: "absolute", top: -120, left: -100, width: 340, height: 340, borderRadius: 170, backgroundColor: colors.plum },
  blobB: { position: "absolute", bottom: -120, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: colors.roseDeep },

  polaroidArea: { height: 220, alignItems: "center", justifyContent: "center", marginTop: 8 },
  polaroidBack: { position: "absolute", width: 150, height: 180, borderRadius: 4, backgroundColor: colors.fog, opacity: 0.18 },
  polaroidMid: { position: "absolute", width: 160, height: 190, borderRadius: 4, backgroundColor: colors.fog, opacity: 0.35 },
  polaroidFront: {
    width: 168,
    height: 196,
    backgroundColor: colors.fog,
    borderRadius: 4,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 }
  },
  polaroidImage: { flex: 1, backgroundColor: "#2A2336", borderRadius: 2 },
  polaroidCaption: { ...type.caption, color: colors.ink, textAlign: "center", marginTop: 6, fontStyle: "italic" },

  titleBlock: { alignItems: "center", gap: 10 },
  sparkleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.gold
  },
  sparkleBadgeText: { ...type.micro, color: colors.ink, letterSpacing: 1.4 },
  title: { ...type.hero, color: colors.fog, textAlign: "center" },

  paragraphCard: {
    padding: 18,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  paragraph: { ...type.subtitle, color: colors.fog, lineHeight: 24 },
  paragraphItalic: { fontStyle: "italic", color: colors.bone },

  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  statValue: { ...type.hero, color: colors.fog, fontVariant: ["tabular-nums"] },
  statSuffix: { ...type.subtitle, color: colors.gold, fontVariant: undefined },
  statLabel: { ...type.micro, color: colors.muted, marginTop: 4 },

  highlights: { gap: 4 },
  highlightsLabel: { ...type.micro, color: colors.muted },
  highlight: { width: 140, height: 180, borderRadius: radii.md, overflow: "hidden", backgroundColor: colors.dusk },
  highlightImage: { ...StyleSheet.absoluteFillObject },
  highlightScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 80 },
  highlightCaption: { position: "absolute", left: 10, right: 10, bottom: 10, ...type.caption, color: colors.fog, fontWeight: "700" },

  footer: { ...type.micro, color: colors.muted, textAlign: "center", marginTop: 18, letterSpacing: 1.4 }
});
