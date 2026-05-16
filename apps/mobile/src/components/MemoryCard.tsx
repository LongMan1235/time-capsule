import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Lock } from "lucide-react-native";
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

  return (
    <AnimatedPressable onPress={onPress} style={[styles.shell, featured ? styles.shellFeatured : null, shadow.soft]}>
      <Image
        source={{ uri: event.coverUrl ?? fallbackCover }}
        style={styles.cover}
        contentFit="cover"
        transition={400}
      />
      {locked ? <View style={styles.lockTint} /> : null}
      <LinearGradient colors={gradients.scrimBottom} style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.date}>{formatDate(event.eventDate)}</Text>
          {locked ? (
            <View style={styles.lockPill}>
              <Lock size={11} color={colors.fog} />
              <Text style={styles.lockText}>Sealed</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[event.locationName, `${event.mediaCount} ${event.mediaCount === 1 ? "memory" : "memories"}`]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {locked && event.unlockAt ? (
            <View style={styles.tickerWrap}>
              <CountdownTicker unlockAt={event.unlockAt} compact />
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 240,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: colors.dusk
  },
  shellFeatured: { height: 300 },
  cover: { ...StyleSheet.absoluteFillObject },
  lockTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(11,10,16,0.40)" },
  scrim: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, padding: 18, justifyContent: "space-between" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  date: { ...type.caption, color: colors.fog, opacity: 0.78 },
  lockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(8,6,12,0.60)",
    borderWidth: 1,
    borderColor: colors.lineBright
  },
  lockText: { ...type.micro, color: colors.fog, letterSpacing: 1.2 },
  bottom: { gap: 6 },
  title: { ...type.heading, color: colors.fog },
  meta: { ...type.caption, color: colors.fog, opacity: 0.7 },
  tickerWrap: { marginTop: 8 }
});
