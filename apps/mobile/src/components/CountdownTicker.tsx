import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../design/ThemeProvider";
import { type } from "../design/themes";
import { padDigits, timeUntil, type TimeParts } from "../utils/dates";

interface Props {
  unlockAt: string;
  createdAt?: string;
  compact?: boolean;
}

export function CountdownTicker({ unlockAt, createdAt, compact = false }: Props) {
  const { theme } = useTheme();
  const [parts, setParts] = useState<TimeParts>(() => timeUntil(unlockAt, createdAt));

  useEffect(() => {
    const handle = setInterval(() => setParts(timeUntil(unlockAt, createdAt)), 1000);
    return () => clearInterval(handle);
  }, [unlockAt, createdAt]);

  if (compact) {
    return (
      <Text style={[styles.compact, { color: theme.ink.primary }]}>
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
  const { theme } = useTheme();
  return (
    <View style={styles.unit}>
      <Text style={[styles.value, { color: accent ? theme.accent.gold : theme.ink.primary }]}>
        {pad ? padDigits(value) : value}
      </Text>
      <Text style={[styles.label, { color: theme.ink.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  unit: { alignItems: "center", minWidth: 56, flex: 1 },
  value: { ...type.hero, fontVariant: ["tabular-nums"] },
  label: { ...type.micro, marginTop: 4 },
  compact: { ...type.caption, fontVariant: ["tabular-nums"], fontWeight: "700" }
});
