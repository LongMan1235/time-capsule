import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Lock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { CountdownTicker } from "../components/CountdownTicker";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { formatLongDate, timeUntil } from "../utils/dates";

export function CountdownScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Countdown">) {
  const insets = useSafeAreaInsets();
  const { eventId, title, unlockAt, createdAt } = route.params;
  const [progress, setProgress] = useState(() => timeUntil(unlockAt, createdAt).fraction);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const handle = setInterval(() => setProgress(timeUntil(unlockAt, createdAt).fraction), 5000);
    return () => clearInterval(handle);
  }, [unlockAt, createdAt]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0] });
  const progressWidth = Math.max(4, Math.min(100, Math.round(progress * 100)));

  async function earlyUnlock() {
    try {
      const quote = await api<{ amountCents: number }>("/billing/early-unlock/intent", {
        method: "POST",
        body: JSON.stringify({ eventId })
      });
      Alert.alert("Unlock early", `$${(quote.amountCents / 100).toFixed(2)} to open today.`);
    } catch (error) {
      Alert.alert("Early unlock unavailable", error instanceof Error ? error.message : "Try again later.");
    }
  }

  return (
    <Screen tone="warm" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>SEALED</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.body}>
        <View style={styles.lockStack}>
          <Animated.View style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <View style={styles.lockCore}>
            <Lock color={colors.ink} size={28} />
          </View>
        </View>

        <Stagger delay={200}>
          <Text style={styles.title}>{title}</Text>
        </Stagger>

        <Stagger delay={340} style={styles.tickerWrap}>
          <CountdownTicker unlockAt={unlockAt} createdAt={createdAt} />
        </Stagger>

        <Stagger delay={500}>
          <Text style={styles.date}>Opens {formatLongDate(unlockAt)}</Text>
        </Stagger>

        <Stagger delay={620} style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
          </View>
        </Stagger>
      </View>

      <Stagger delay={760} style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton onPress={earlyUnlock}>Unlock early</PrimaryButton>
        <PrimaryButton onPress={() => navigation.goBack()} variant="ghost">
          Keep waiting
        </PrimaryButton>
      </Stagger>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  eyebrow: { ...type.micro, color: colors.muted },
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 22 },
  lockStack: { width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  pulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold
  },
  lockCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold
  },
  title: { ...type.title, color: colors.fog, textAlign: "center" },
  tickerWrap: { alignSelf: "stretch" },
  date: { ...type.body, color: colors.muted },
  progressBlock: { alignSelf: "stretch", marginTop: 12 },
  progressTrack: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.line,
    overflow: "hidden"
  },
  progressFill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.gold },
  footer: { paddingHorizontal: 24, gap: 10 }
});
