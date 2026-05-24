import { geoCircle, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from "react-native-svg";
import type { FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";
import type { Topology, GeometryCollection } from "topojson-specification";
import { colors } from "../design/theme";

export interface GlobePoint {
  id: string;
  latitude: number;
  longitude: number;
}

interface Props {
  size: number;
  points: GlobePoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

// world-atlas/countries-110m.json: TopoJSON with `countries` object
const topology = worldTopology as unknown as Topology<{ countries: GeometryCollection }>;
const landFeatures = feature(topology, topology.objects.countries) as unknown as FeatureCollection;

export function Globe({ size, points, selectedId, onSelect }: Props) {
  const radius = size / 2 - 16;
  const [rotation, setRotation] = useState({ lng: 30, lat: -15 });
  const start = useRef(rotation);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          start.current = rotation;
        },
        onPanResponderMove: (_evt, gesture) => {
          const nextLng = start.current.lng + (gesture.dx / radius) * 90;
          const nextLat = Math.max(-80, Math.min(80, start.current.lat - (gesture.dy / radius) * 90));
          setRotation({ lng: nextLng, lat: nextLat });
        }
      }),
    [radius, rotation]
  );

  const projection = useMemo(() => {
    return geoOrthographic()
      .scale(radius)
      .translate([0, 0])
      .rotate([rotation.lng, -rotation.lat])
      .clipAngle(90);
  }, [radius, rotation.lng, rotation.lat]);

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const landPath = useMemo(() => {
    return pathGen({ type: "FeatureCollection", features: landFeatures.features } as FeatureCollection) ?? "";
  }, [pathGen]);

  const graticulePath = useMemo(() => pathGen(geoGraticule10()) ?? "", [pathGen]);

  const spherePath = useMemo(() => pathGen({ type: "Sphere" } as never) ?? "", [pathGen]);

  // For pins: project each lat/lng with d3, drop ones whose path is null (back of sphere)
  const projectedPins = useMemo(
    () =>
      points
        .map((point) => {
          const circle = geoCircle().center([point.longitude, point.latitude]).radius(0.0001)();
          const visible = pathGen(circle) != null;
          const coords = projection([point.longitude, point.latitude]);
          if (!visible || !coords) return null;
          return { ...point, sx: coords[0], sy: coords[1] };
        })
        .filter((p): p is GlobePoint & { sx: number; sy: number } => p !== null),
    [points, projection, pathGen]
  );

  return (
    <View style={[styles.wrap, { width: size, height: size }]} {...panResponder.panHandlers}>
      <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
        <Defs>
          <RadialGradient id="oceanFill" cx="35%" cy="32%" r="80%">
            <Stop offset="0%" stopColor="#1B2A3F" stopOpacity="1" />
            <Stop offset="55%" stopColor="#0E1A2A" stopOpacity="1" />
            <Stop offset="100%" stopColor="#070C14" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="globeRim" cx="50%" cy="50%" r="50%">
            <Stop offset="92%" stopColor={colors.gold} stopOpacity="0" />
            <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.22" />
          </RadialGradient>
          <RadialGradient id="atmosphereGlow" cx="50%" cy="50%" r="52%">
            <Stop offset="92%" stopColor="#6FB3FF" stopOpacity="0" />
            <Stop offset="100%" stopColor="#6FB3FF" stopOpacity="0.18" />
          </RadialGradient>
        </Defs>

        {/* Atmospheric glow ring */}
        <Circle cx={0} cy={0} r={radius + 6} fill="url(#atmosphereGlow)" />
        {/* Ocean sphere */}
        <Path d={spherePath} fill="url(#oceanFill)" stroke={colors.lineBright} strokeWidth={0.75} />
        {/* Graticule (lat/long lines) over the ocean */}
        <Path d={graticulePath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} />
        {/* Continents */}
        <Path
          d={landPath}
          fill="#6A8055"
          stroke="#3F4D34"
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
        {/* Inner shading (subtle dark overlay on bottom-right) */}
        <Circle cx={0} cy={0} r={radius} fill="url(#globeRim)" />

        {/* Pole tick marks */}
        <G opacity={0.45}>
          {/* North */}
          {(() => {
            const np = projection([0, 90]);
            if (!np) return null;
            return (
              <Circle cx={np[0]} cy={np[1]} r={1.6} fill={colors.muted} />
            );
          })()}
          {/* South */}
          {(() => {
            const sp = projection([0, -90]);
            if (!sp) return null;
            return (
              <Circle cx={sp[0]} cy={sp[1]} r={1.6} fill={colors.muted} />
            );
          })()}
        </G>

        {/* Pins on top */}
        {projectedPins.map((point) => {
          const selected = point.id === selectedId;
          return (
            <G key={point.id} onPress={() => onSelect?.(point.id)}>
              <Circle cx={point.sx} cy={point.sy} r={selected ? 8 : 6} fill={colors.gold} opacity={0.25} />
              <Circle cx={point.sx} cy={point.sy} r={selected ? 4.5 : 3.5} fill={colors.gold} stroke={colors.ink} strokeWidth={0.8} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" }
});
