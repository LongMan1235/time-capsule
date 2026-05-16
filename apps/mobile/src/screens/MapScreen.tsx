import { BlurView } from "expo-blur";
import { Globe2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<MapEvent[]>([]);

  useEffect(() => {
    api<{ events: MapEvent[] }>("/events/map")
      .then((response) => setEvents(response.events))
      .catch(() => setEvents([]));
  }, []);

  return (
    <Screen ambient={false} grain={false} edges={[]}>
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
            </View>
          </Marker>
        ))}
      </MapView>

      <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + 12 }]}>
        <Stagger delay={120}>
          <View style={styles.headerCard}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,12,22,0.88)" }]} />
            )}
            <View style={styles.headerInner}>
              <Globe2 color={colors.fog} size={16} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>MEMORY MAP</Text>
                <Text style={styles.title}>{events.length} {events.length === 1 ? "place" : "places"}</Text>
              </View>
            </View>
          </View>
        </Stagger>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", left: 16, right: 16 },
  headerCard: {
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.body, color: colors.fog, fontWeight: "600", marginTop: 2 },
  pinShell: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.ink
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
