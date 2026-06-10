import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Lock } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@time-capsule/shared";
import { useTheme } from "../design/ThemeProvider";
import { radii, type } from "../design/themes";
import { formatDate } from "../utils/dates";
import { AnimatedPressable } from "./AnimatedPressable";
import { CountdownTicker } from "./CountdownTicker";

interface Props {
  event: EventSummary;
  onPress: () => void;
  featured?: boolean;
}

const fallbackCover = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

/**
 * Memory card. In marble mode this reads like a stiff card sat on cream paper:
 * thumbnail flush at top, type set below in ink. In obsidian mode it inverts.
 * No polaroid rotation, no tape — just well-composed editorial typography.
 */
export function MemoryCard({ event, onPress, featured = false }: Props) {
  const { theme, shadows } = useTheme();
  const locked = event.state === "LOCKED";

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.shell,
        shadows.soft,
        {
          backgroundColor: theme.bg.elevated,
          borderColor: theme.line.soft
        },
        featured ? styles.featured : null
      ]}
    >
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: event.coverUrl ?? fallbackCover }}
          style={styles.thumb}
          contentFit="cover"
          transition={400}
        />
        {locked ? (
          <LinearGradient
            colors={["rgba(26,20,16,0.10)", "rgba(26,20,16,0.45)"]}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={styles.thumbOverlay}>
          {locked ? (
            <View style={[styles.statePill, { backgroundColor: theme.bg.inverse }]}>
              <Lock size={10} color={theme.ink.onInverse} />
              <Text style={[styles.statePillText, { color: theme.ink.onInverse }]}>SEALED</Text>
            </View>
          ) : event.state === "DRAFT" ? (
            <View style={[styles.statePill, { backgroundColor: theme.bg.inverse, opacity: 0.78 }]}>
              <Text style={[styles.statePillText, { color: theme.ink.onInverse }]}>DRAFT</Text>
            </View>
          ) : (
            <View style={[styles.statePill, { backgroundColor: theme.accent.gold }]}>
              <Text style={[styles.statePillText, { color: theme.ink.onAccent }]}>OPEN</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.date, { color: theme.accent.gold }]}>
          {formatDate(event.eventDate).toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: theme.ink.primary }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          {event.locationName ? (
            <Text style={[styles.meta, { color: theme.ink.muted }]} numberOfLines={1}>
              {event.locationName}
            </Text>
          ) : null}
          <View style={[styles.dot, { backgroundColor: theme.ink.faint }]} />
          <Text style={[styles.meta, { color: theme.ink.muted }]}>
            {event.mediaCount} {event.mediaCount === 1 ? "memory" : "memories"}
          </Text>
        </View>
        {locked && event.unlockAt ? (
          <View style={[styles.tickerRow, { borderTopColor: theme.line.soft }]}>
            <Text style={[styles.tickerLabel, { color: theme.ink.muted }]}>OPENS IN</Text>
            <CountdownTicker unlockAt={event.unlockAt} compact />
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16
  },
  featured: {},
  thumbWrap: { width: "100%", aspectRatio: 16 / 10, position: "relative" },
  thumb: { ...StyleSheet.absoluteFillObject },
  thumbOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 6
  },
  statePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill
  },
  statePillText: { fontSize: 9, letterSpacing: 1.6, fontWeight: "800" },
  body: { padding: 18, gap: 6 },
  date: { ...type.micro, letterSpacing: 2 },
  title: { ...type.heading, fontSize: 22, lineHeight: 26, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 },
  meta: { ...type.caption },
  dot: { width: 3, height: 3, borderRadius: 2 },
  tickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1
  },
  tickerLabel: { ...type.micro }
});
