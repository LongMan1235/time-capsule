import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Bell, Lock, Sparkles, Unlock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { CountdownTicker } from "../components/CountdownTicker";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, gradients, radii, shadow, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { formatLongDate, timeUntil } from "../utils/dates";

export function CountdownScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Countdown">) {
  const { eventId, title, unlockAt, createdAt } = route.params;
  const [progress, setProgress] = useState(() => timeUntil(unlockAt, createdAt).fraction);
  const pulse = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const handle = setInterval(() => setProgress(timeUntil(unlockAt, createdAt).fraction), 5000);
    return () => clearInterval(handle);
  }, [unlockAt, createdAt]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 22_000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [pulse, orbit]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const ringRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const progressWidth = Math.max(8, Math.min(100, Math.round(progress * 100)));

  async function earlyUnlock() {
    try {
      const quote = await api<{ amountCents: number; clientSecret?: string }>("/billing/early-unlock/intent", {
        method: "POST",
        body: JSON.stringify({ eventId })
      });
      Alert.alert("Unlock early", `$${(quote.amountCents / 100).toFixed(2)} to open this capsule today. Confirmation plugs into Stripe.`);
    } catch (error) {
      Alert.alert("Early unlock unavailable", error instanceof Error ? error.message : "Try again later.");
    }
  }

  return (
    <Screen edges={["top", "bottom"]} tone="warm">
      <View style={styles.header}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <View style={styles.headerCenter}>
          <Text style={styles.eyebrow}>SEALED CAPSULE</Text>
        </View>
        <View style={styles.backButton}>
          <Bell color={colors.fog} size={18} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.lockStack}>
          <Animated.View style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <Animated.View style={[styles.ring, { transform: [{ rotate: ringRotation }] }]}>
            <LinearGradient
              colors={["rgba(232,194,107,0)", "rgba(232,194,107,0.85)", "rgba(232,194,107,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={[styles.lockCore, shadow.glow]}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Lock color={colors.ink} size={36} />
          </View>
        </View>

        <Stagger delay={200}>
          <Text style={styles.title}>{title}</Text>
        </Stagger>

        <Stagger delay={340}>
          <CountdownTicker unlockAt={unlockAt} createdAt={createdAt} />
        </Stagger>

        <Stagger delay={500}>
          <Text style={styles.date}>Unlocks on {formatLongDate(unlockAt)}</Text>
        </Stagger>

        <Stagger delay={620} style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressWidth}%` }]}>
              <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Sealed</Text>
            <Text style={styles.progressLabel}>{progressWidth}%</Text>
            <Text style={styles.progressLabel}>Opens</Text>
          </View>
        </Stagger>
      </View>

      <Stagger delay={780} style={styles.footer}>
        <PrimaryButton onPress={earlyUnlock} icon={Sparkles} variant="gold">
          Unlock early
        </PrimaryButton>
        <PrimaryButton onPress={() => navigation.goBack()} variant="ghost">
          Keep waiting
        </PrimaryButton>
        <View style={styles.reveal}>
          <Unlock color={colors.fog} size={16} />
          <Text style={styles.revealText}>
            When the timer ends, the app reveals the archive with captions, comments, and a memory timeline.
          </Text>
        </View>
      </Stagger>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  headerCenter: { alignItems: "center" },
  eyebrow: { ...type.micro, color: colors.gold },
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 18 },
  lockStack: { width: 160, height: 160, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  pulse: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(232,194,107,0.30)"
  },
  ring: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.10)"
  },
  lockCore: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  title: { ...type.title, color: colors.fog, textAlign: "center" },
  date: { ...type.body, color: colors.muted, marginTop: 6 },
  progressBlock: { alignSelf: "stretch", marginTop: 10, gap: 8 },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  progressFill: { height: "100%", borderRadius: radii.pill, overflow: "hidden" },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { ...type.micro, color: colors.muted },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },
  reveal: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginTop: 4
  },
  revealText: { ...type.caption, color: colors.fog, flex: 1, lineHeight: 18 }
});
