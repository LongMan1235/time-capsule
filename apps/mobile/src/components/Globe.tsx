import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop } from "react-native-svg";
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

const PARALLELS = [-60, -30, 0, 30, 60];
const MERIDIANS = [0, 30, 60, 90, 120, 150, 180, -30, -60, -90, -120, -150];

const DEG = Math.PI / 180;

function project(
  latDeg: number,
  lngDeg: number,
  rotLngDeg: number,
  rotLatDeg: number
): { x: number; y: number; z: number } {
  const lat = latDeg * DEG;
  const lng = (lngDeg - rotLngDeg) * DEG;
  const rotLat = rotLatDeg * DEG;

  const cosLat = Math.cos(lat);
  const x = cosLat * Math.sin(lng);
  const y = Math.sin(lat);
  const z = cosLat * Math.cos(lng);

  const y2 = y * Math.cos(rotLat) + z * Math.sin(rotLat);
  const z2 = -y * Math.sin(rotLat) + z * Math.cos(rotLat);

  return { x, y: y2, z: z2 };
}

function buildParallelPath(latDeg: number, rotLngDeg: number, rotLatDeg: number, radius: number) {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  const steps = 96;
  for (let i = 0; i <= steps; i += 1) {
    const lng = -180 + (i / steps) * 360;
    const { x, y, z } = project(latDeg, lng, rotLngDeg, rotLatDeg);
    if (z >= 0) {
      current.push([x * radius, -y * radius]);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);
  return segments.map((seg) => seg.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" "));
}

function buildMeridianPath(lngDeg: number, rotLngDeg: number, rotLatDeg: number, radius: number) {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  const steps = 72;
  for (let i = 0; i <= steps; i += 1) {
    const lat = -90 + (i / steps) * 180;
    const { x, y, z } = project(lat, lngDeg, rotLngDeg, rotLatDeg);
    if (z >= 0) {
      current.push([x * radius, -y * radius]);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);
  return segments.map((seg) => seg.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" "));
}

export function Globe({ size, points, selectedId, onSelect }: Props) {
  const radius = size / 2 - 12;
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

  const parallels = useMemo(
    () => PARALLELS.flatMap((lat) => buildParallelPath(lat, rotation.lng, rotation.lat, radius)),
    [rotation.lng, rotation.lat, radius]
  );
  const meridians = useMemo(
    () => MERIDIANS.flatMap((lng) => buildMeridianPath(lng, rotation.lng, rotation.lat, radius)),
    [rotation.lng, rotation.lat, radius]
  );

  const visiblePoints = useMemo(
    () =>
      points
        .map((point) => {
          const { x, y, z } = project(point.latitude, point.longitude, rotation.lng, rotation.lat);
          return { ...point, sx: x * radius, sy: -y * radius, visible: z >= 0 };
        })
        .filter((p) => p.visible),
    [points, rotation.lng, rotation.lat, radius]
  );

  return (
    <View style={[styles.wrap, { width: size, height: size }]} {...panResponder.panHandlers}>
      <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
        <Defs>
          <RadialGradient id="globeFill" cx="35%" cy="32%" r="80%">
            <Stop offset="0%" stopColor="#27212E" stopOpacity="1" />
            <Stop offset="60%" stopColor="#181420" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0B0A10" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="globeRim" cx="50%" cy="50%" r="50%">
            <Stop offset="92%" stopColor={colors.gold} stopOpacity="0" />
            <Stop offset="100%" stopColor={colors.gold} stopOpacity="0.18" />
          </RadialGradient>
        </Defs>
        <Circle cx={0} cy={0} r={radius + 4} fill="url(#globeRim)" />
        <Circle cx={0} cy={0} r={radius} fill="url(#globeFill)" stroke={colors.lineBright} strokeWidth={1} />
        <G opacity={0.45}>
          {parallels.map((d, i) => (
            <Path key={`p-${i}`} d={d} stroke={colors.line} strokeWidth={0.75} fill="none" />
          ))}
          {meridians.map((d, i) => (
            <Path key={`m-${i}`} d={d} stroke={colors.line} strokeWidth={0.75} fill="none" />
          ))}
        </G>
        <Line x1={0} y1={-radius - 6} x2={0} y2={-radius - 12} stroke={colors.muted} strokeWidth={1} />
        <Line x1={0} y1={radius + 6} x2={0} y2={radius + 12} stroke={colors.muted} strokeWidth={1} />
        {visiblePoints.map((point) => {
          const selected = point.id === selectedId;
          return (
            <G key={point.id} onPress={() => onSelect?.(point.id)}>
              <Circle cx={point.sx} cy={point.sy} r={selected ? 7 : 5} fill={colors.gold} opacity={0.20} />
              <Circle cx={point.sx} cy={point.sy} r={selected ? 4 : 3} fill={colors.gold} />
            </G>
          );
        })}
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.hint]}>
        <Animated.View />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  hint: { alignItems: "center", justifyContent: "flex-end" }
});
