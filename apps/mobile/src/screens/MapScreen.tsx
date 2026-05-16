import { Globe2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { Globe, type GlobePoint } from "../components/Globe";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";

interface MapEvent extends GlobePoint {
  title: string;
  locationName?: string;
}

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    api<{ events: MapEvent[] }>("/events/map")
      .then((response) => setEvents(response.events))
      .catch(() => setEvents([]));
  }, []);

  const selected = useMemo(() => events.find((e) => e.id === selectedId), [events, selectedId]);
  const size = Math.min(Dimensions.get("window").width, Dimensions.get("window").height) - 60;

  return (
    <Screen tone="paper" edges={["top", "left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <Globe2 color={colors.muted} size={14} />
          <Text style={styles.eyebrow}>MEMORY MAP</Text>
        </View>
        <Text style={styles.title}>The world,{"\n"}in pages.</Text>
        <Text style={styles.subtitle}>
          {events.length} {events.length === 1 ? "place" : "places"} held in capsules
        </Text>
      </View>

      <View style={styles.globeWrap}>
        <Globe size={size} points={events} selectedId={selectedId} onSelect={setSelectedId} />
      </View>

      <Stagger delay={120}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 100 }]}>
          {selected ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{selected.title}</Text>
              <Text style={styles.cardMeta}>
                {selected.locationName ?? "Unknown place"} · {selected.latitude.toFixed(1)}°, {selected.longitude.toFixed(1)}°
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardHint}>Drag the globe · tap a pin to see a capsule</Text>
            </View>
          )}
        </View>
      </Stagger>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingBottom: 12, gap: 6 },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.hero, color: colors.fog, marginTop: 4 },
  subtitle: { ...type.caption, color: colors.muted },
  globeWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  footer: { paddingHorizontal: 24 },
  card: {
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    gap: 6
  },
  cardTitle: { ...type.subtitle, color: colors.fog, fontWeight: "600" },
  cardMeta: { ...type.caption, color: colors.muted },
  cardHint: { ...type.caption, color: colors.muted, textAlign: "center" }
});
