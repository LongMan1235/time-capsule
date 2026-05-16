import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Images, Lock, MapPin, Sparkles, Unlock } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@time-capsule/shared";
import { colors, gradients, radii, shadow, type } from "../design/theme";
import { formatDate } from "../utils/dates";
import { AnimatedPressable } from "./AnimatedPressable";
import { CountdownTicker } from "./CountdownTicker";

interface Props {
  event: EventSummary;
  onPress: () => void;
  featured?: boolean;
}

const fallbackCover = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

export function MemoryCard({ event, onPress, featured = false }: Props) {
  const locked = event.state === "LOCKED";
  const draft = event.state === "DRAFT";

  return (
    <AnimatedPressable onPress={onPress} style={[styles.shell, featured ? styles.shellFeatured : null, shadow.card]}>
      <Image
        source={{ uri: event.coverUrl ?? fallbackCover }}
        style={styles.cover}
        contentFit="cover"
        transition={400}
      />
      {locked ? <View style={styles.lockTint} /> : null}
      <LinearGradient colors={gradients.scrimBottom} style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{formatDate(event.eventDate)}</Text>
          </View>
          <StateBadge state={event.state} unlockAt={event.unlockAt ?? undefined} />
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.fog} />
              <Text style={styles.metaText}>{event.locationName ?? "Private memory"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Images size={13} color={colors.fog} />
              <Text style={styles.metaText}>{event.mediaCount} {event.mediaCount === 1 ? "memory" : "memories"}</Text>
            </View>
          </View>
          {locked && event.unlockAt ? (
            <View style={styles.tickerWrap}>
              <CountdownTicker unlockAt={event.unlockAt} compact />
            </View>
          ) : null}
          {draft ? (
            <View style={styles.draftTag}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.draftText}>Draft — not yet sealed</Text>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

function StateBadge({ state, unlockAt }: { state: EventSummary["state"]; unlockAt?: string }) {
  if (state === "LOCKED") {
    return (
      <View style={[styles.badge, styles.badgeLocked]}>
        <Lock size={11} color={colors.ink} />
        <Text style={[styles.badgeText, { color: colors.ink }]}>Sealed</Text>
      </View>
    );
  }
  if (state === "UNLOCKED") {
    return (
      <View style={[styles.badge, styles.badgeOpen]}>
        <Unlock size={11} color={colors.fog} />
        <Text style={[styles.badgeText, { color: colors.fog }]}>Open</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeDraft]}>
      <Text style={[styles.badgeText, { color: colors.fog }]}>Draft</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 280,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: 18,
    backgroundColor: colors.dusk,
    borderWidth: 1,
    borderColor: colors.line
  },
  shellFeatured: { height: 340 },
  cover: { ...StyleSheet.absoluteFillObject },
  lockTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(11,10,16,0.55)" },
  scrim: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, padding: 18, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(8,6,12,0.55)",
    borderWidth: 1,
    borderColor: colors.line
  },
  dateChipText: { ...type.caption, color: colors.fog, fontWeight: "700" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.pill
  },
  badgeLocked: { backgroundColor: colors.gold },
  badgeOpen: { backgroundColor: "rgba(91,107,77,0.55)", borderWidth: 1, borderColor: colors.line },
  badgeDraft: { backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: colors.line },
  badgeText: { ...type.micro, letterSpacing: 1 },
  bottom: { gap: 10 },
  title: { ...type.title, color: colors.fog, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { ...type.caption, color: colors.fog, opacity: 0.86 },
  tickerWrap: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)"
  },
  draftTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  draftText: { ...type.caption, color: colors.gold, fontWeight: "700" }
});
