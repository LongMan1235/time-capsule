import { BlurView } from "expo-blur";
import { Globe2, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";

interface MapEvent {
  id: string;
  title: string;
  locationName?: string;
  latitude: number;
  longitude: number;
}

export function MapScreen() {
  const [events, setEvents] = useState<MapEvent[]>([]);

  useEffect(() => {
    api<{ events: MapEvent[] }>("/events/map")
      .then((response) => setEvents(response.events))
      .catch(() => setEvents([]));
  }, []);

  return (
    <Screen ambient={false} grain={false} edges={["left", "right"]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: 43.6532, longitude: -79.3832, latitudeDelta: 32, longitudeDelta: 32 }}
        customMapStyle={mapStyle}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={{ latitude: event.latitude, longitude: event.longitude }}
            title={event.title}
            description={event.locationName}
          >
            <View style={styles.pinShell}>
              <View style={styles.pinDot} />
              <View style={styles.pinHalo} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View pointerEvents="box-none" style={styles.overlay}>
        <Stagger delay={120}>
          <View style={styles.headerCard}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,12,22,0.85)" }]} />
            )}
            <View style={styles.headerInner}>
              <View style={styles.headerIcon}>
                <Globe2 color={colors.gold} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>MEMORY MAP</Text>
                <Text style={styles.title}>Memories around{" "}<Text style={styles.titleAccent}>the world</Text></Text>
              </View>
              <View style={styles.countPill}>
                <MapPin color={colors.fog} size={12} />
                <Text style={styles.countText}>{events.length}</Text>
              </View>
            </View>
          </View>
        </Stagger>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 60, left: 16, right: 16 },
  headerCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.lineBright
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,194,107,0.14)",
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.35)"
  },
  eyebrow: { ...type.micro, color: colors.gold },
  title: { ...type.subtitle, color: colors.fog, fontWeight: "800", marginTop: 2 },
  titleAccent: { color: colors.gold, fontStyle: "italic" },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(8,6,12,0.55)",
    borderWidth: 1,
    borderColor: colors.line
  },
  countText: { ...type.caption, color: colors.fog, fontWeight: "700" },
  pinShell: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.ink,
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  pinHalo: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(232,194,107,0.20)"
  }
});

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#15131D" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9C95A0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0A10" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1F1A28" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2336" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0E1622" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3B5B7A" }] }
];
