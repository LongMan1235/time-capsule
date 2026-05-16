import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, type } from "../design/theme";
import { padDigits, timeUntil, type TimeParts } from "../utils/dates";

interface Props {
  unlockAt: string;
  createdAt?: string;
  compact?: boolean;
}

export function CountdownTicker({ unlockAt, createdAt, compact = false }: Props) {
  const [parts, setParts] = useState<TimeParts>(() => timeUntil(unlockAt, createdAt));

  useEffect(() => {
    const handle = setInterval(() => setParts(timeUntil(unlockAt, createdAt)), 1000);
    return () => clearInterval(handle);
  }, [unlockAt, createdAt]);

  if (compact) {
    return (
      <Text style={styles.compact}>
        {parts.days}d {padDigits(parts.hours)}h {padDigits(parts.minutes)}m
      </Text>
    );
  }

  return (
    <View style={styles.row}>
      <Unit value={parts.days} label="DAYS" />
      <Unit value={parts.hours} label="HRS" pad />
      <Unit value={parts.minutes} label="MIN" pad />
      <Unit value={parts.seconds} label="SEC" pad accent />
    </View>
  );
}

function Unit({ value, label, pad = false, accent = false }: { value: number; label: string; pad?: boolean; accent?: boolean }) {
  return (
    <View style={styles.unit}>
      <Text style={[styles.value, accent ? styles.accent : null]}>{pad ? padDigits(value) : value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  unit: { alignItems: "center", minWidth: 56, flex: 1 },
  value: { ...type.hero, color: colors.fog, fontVariant: ["tabular-nums"] },
  accent: { color: colors.gold },
  label: { ...type.micro, color: colors.muted, marginTop: 4 },
  compact: { ...type.caption, color: colors.fog, opacity: 0.78, fontVariant: ["tabular-nums"] }
});
