import { Image } from "expo-image";
import { Lock, MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@time-capsule/shared";
import { colors, radii, shadow, type } from "../design/theme";
import { formatDate } from "../utils/dates";
import { AnimatedPressable } from "./AnimatedPressable";
import { CountdownTicker } from "./CountdownTicker";

interface Props {
  event: EventSummary;
  onPress: () => void;
  featured?: boolean;
}

const fallbackCover = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=70";

export function MemoryCard({ event, onPress, featured = false }: Props) {
  const locked = event.state === "LOCKED";
  const draft = event.state === "DRAFT";

  return (
    <AnimatedPressable onPress={onPress} style={[styles.page, shadow.soft]}>
      <View style={styles.polaroid}>
        <Image
          source={{ uri: event.coverUrl ?? fallbackCover }}
          style={[styles.cover, locked ? styles.coverLocked : null]}
          contentFit="cover"
          transition={400}
        />
        {locked ? <View style={styles.lockOverlay} /> : null}
        <View style={styles.tapeLeft} />
        <View style={styles.tapeRight} />
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.date}>{formatDate(event.eventDate)}</Text>
          <View style={styles.stateChip}>
            {locked ? <Lock size={10} color={colors.muted} /> : null}
            <Text style={styles.stateText}>{stateLabel(event.state)}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <View style={styles.metaRow}>
          {event.locationName ? (
            <View style={styles.metaItem}>
              <MapPin size={11} color={colors.muted} />
              <Text style={styles.metaText}>{event.locationName}</Text>
            </View>
          ) : null}
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{event.mediaCount} {event.mediaCount === 1 ? "memory" : "memories"}</Text>
        </View>
        {locked && event.unlockAt ? (
          <View style={styles.tickerWrap}>
            <CountdownTicker unlockAt={event.unlockAt} compact />
            <Text style={styles.tickerLabel}>until it opens</Text>
          </View>
        ) : null}
        {draft ? <Text style={styles.draftHint}>still collecting</Text> : null}
      </View>
    </AnimatedPressable>
  );
}

function stateLabel(state: EventSummary["state"]) {
  switch (state) {
    case "LOCKED": return "SEALED";
    case "UNLOCKED": return "OPEN";
    case "DRAFT":
    default: return "DRAFT";
  }
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.cardElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 14
  },
  polaroid: {
    width: 100,
    height: 124,
    backgroundColor: colors.fog,
    borderRadius: 4,
    padding: 6,
    transform: [{ rotate: "-2deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cover: { flex: 1, borderRadius: 2 },
  coverLocked: { opacity: 0.6 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    backgroundColor: "rgba(8,6,12,0.20)",
    borderRadius: 2
  },
  tapeLeft: {
    position: "absolute",
    top: -6,
    left: 14,
    width: 26,
    height: 14,
    backgroundColor: "rgba(232,194,107,0.40)",
    transform: [{ rotate: "-8deg" }],
    borderRadius: 2
  },
  tapeRight: {
    position: "absolute",
    top: -6,
    right: 10,
    width: 22,
    height: 14,
    backgroundColor: "rgba(232,194,107,0.35)",
    transform: [{ rotate: "10deg" }],
    borderRadius: 2
  },
  body: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { ...type.caption, color: colors.muted },
  stateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line
  },
  stateText: { ...type.micro, color: colors.muted, letterSpacing: 1.2 },
  title: { ...type.heading, color: colors.fog, marginVertical: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...type.caption, color: colors.muted },
  metaDot: { color: colors.mutedDim, fontSize: 12 },
  tickerWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  tickerLabel: { ...type.micro, color: colors.muted, letterSpacing: 1 },
  draftHint: { ...type.micro, color: colors.gold, letterSpacing: 1.2, marginTop: 6 }
});
