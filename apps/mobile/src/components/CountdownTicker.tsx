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
      <View style={styles.compactRow}>
        <Text style={styles.compactValue}>{parts.days}d</Text>
        <Text style={styles.compactDivider}>·</Text>
        <Text style={styles.compactValue}>{padDigits(parts.hours)}h</Text>
        <Text style={styles.compactDivider}>·</Text>
        <Text style={styles.compactValue}>{padDigits(parts.minutes)}m</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Unit value={parts.days} label="days" />
      <Divider />
      <Unit value={parts.hours} label="hours" pad />
      <Divider />
      <Unit value={parts.minutes} label="min" pad />
      <Divider />
      <Unit value={parts.seconds} label="sec" pad accent />
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

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  unit: { alignItems: "center", minWidth: 64 },
  value: {
    ...type.hero,
    color: colors.fog,
    fontVariant: ["tabular-nums"]
  },
  accent: { color: colors.gold },
  label: {
    ...type.micro,
    color: colors.muted,
    marginTop: 6
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.line,
    marginBottom: 22
  },
  compactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  compactValue: { color: colors.fog, fontWeight: "700", fontSize: 12, fontVariant: ["tabular-nums"] },
  compactDivider: { color: colors.mutedDim, fontSize: 12 }
});
