import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { colors, gradients, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { formatLongDate } from "../utils/dates";

interface UnlockEvent {
  id: string;
  title: string;
  eventDate: string;
  unlockAt?: string | null;
  unlockNote?: string | null;
  unlockNoteAuthor?: { displayName: string } | null;
  mediaTotalCount?: number;
}

type Phase = "loading" | "intro" | "cracking" | "reveal";

export function UnlockCeremonyScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "UnlockCeremony">) {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<UnlockEvent>();
  const [phase, setPhase] = useState<Phase>("loading");

  const seal = useRef(new Animated.Value(0)).current;
  const leftHalf = useRef(new Animated.Value(0)).current;
  const rightHalf = useRef(new Animated.Value(0)).current;
  const letter = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api<{ event: UnlockEvent }>(`/events/${route.params.eventId}`)
      .then((response) => {
        setEvent(response.event);
        setPhase("intro");
      })
      .catch((err) => {
        Alert.alert("Could not load", err instanceof Error ? err.message : "Try again.");
        navigation.goBack();
      });
  }, [route.params.eventId]);

  useEffect(() => {
    if (phase !== "intro") return;
    Animated.sequence([
      Animated.timing(seal, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(900)
    ]).start(() => {
      crack();
    });
  }, [phase]);

  function crack() {
    setPhase("cracking");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Animated.parallel([
      Animated.timing(flash, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(leftHalf, { toValue: 1, duration: 820, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rightHalf, { toValue: 1, duration: 820, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start(() => {
      Animated.timing(flash, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      setPhase("reveal");
      Animated.timing(letter, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }

  async function complete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      await api(`/events/${route.params.eventId}/ceremony-seen`, { method: "POST" });
    } catch {
      // best-effort
    }
    navigation.replace("EventDetail", { eventId: route.params.eventId });
  }

  if (!event || phase === "loading") {
    return (
      <Screen tone="paper" edges={[]}>
        <View style={styles.loading}><ActivityIndicator color={colors.gold} /></View>
      </Screen>
    );
  }

  const sealOpacity = seal;
  const sealScale = seal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const leftTranslate = leftHalf.interpolate({ inputRange: [0, 1], outputRange: [0, -180] });
  const leftRotate = leftHalf.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-12deg"] });
  const rightTranslate = rightHalf.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
  const rightRotate = rightHalf.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "12deg"] });

  const letterOpacity = letter;
  const letterTranslate = letter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Screen tone="paper" edges={[]} texture>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: flash, backgroundColor: colors.gold }]} />

      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.eyebrow}>THE CAPSULE OPENS</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.dateText}>Sealed {formatLongDate(event.eventDate)}</Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.sealStack}>
          <Animated.View style={[styles.sealHalf, styles.sealLeft, { opacity: sealOpacity, transform: [{ scale: sealScale }, { translateX: leftTranslate }, { rotate: leftRotate }] }]}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View style={[styles.sealHalf, styles.sealRight, { opacity: sealOpacity, transform: [{ scale: sealScale }, { translateX: rightTranslate }, { rotate: rightRotate }] }]}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.Text style={[styles.sealMonogram, { opacity: seal.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }) }]}>TC</Animated.Text>
        </View>
      </View>

      <Animated.View style={[styles.letter, { opacity: letterOpacity, transform: [{ translateY: letterTranslate }] }]}>
        {event.unlockNote ? (
          <View style={styles.letterCard}>
            <Text style={styles.letterLabel}>A LETTER TO FUTURE-YOU</Text>
            <Text style={styles.letterBody}>{event.unlockNote}</Text>
            {event.unlockNoteAuthor ? (
              <Text style={styles.letterAuthor}>— {event.unlockNoteAuthor.displayName}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.letterCard}>
            <Text style={styles.letterLabel}>THE CAPSULE IS OPEN</Text>
            <Text style={styles.letterBody}>
              {event.mediaTotalCount ?? 0} memories sealed for this moment.
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        {phase === "reveal" ? (
          <PrimaryButton onPress={complete} icon={ArrowRight}>
            See the archive
          </PrimaryButton>
        ) : null}
      </View>
    </Screen>
  );
}

const SEAL_SIZE = 160;

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 24, gap: 6, alignItems: "center" },
  eyebrow: { ...type.micro, color: colors.gold, letterSpacing: 2.4 },
  title: { ...type.hero, color: colors.fog, textAlign: "center", marginTop: 6 },
  dateText: { ...type.caption, color: colors.muted, marginTop: 4 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  sealStack: { width: SEAL_SIZE, height: SEAL_SIZE, alignItems: "center", justifyContent: "center" },
  sealHalf: {
    position: "absolute",
    width: SEAL_SIZE / 2,
    height: SEAL_SIZE,
    overflow: "hidden",
    shadowColor: colors.gold,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 }
  },
  sealLeft: {
    left: 0,
    top: 0,
    borderTopLeftRadius: SEAL_SIZE / 2,
    borderBottomLeftRadius: SEAL_SIZE / 2
  },
  sealRight: {
    right: 0,
    top: 0,
    borderTopRightRadius: SEAL_SIZE / 2,
    borderBottomRightRadius: SEAL_SIZE / 2
  },
  sealMonogram: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 2
  },
  letter: { paddingHorizontal: 24, paddingTop: 20 },
  letterCard: {
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.fog,
    gap: 8
  },
  letterLabel: { ...type.micro, color: colors.mutedDim },
  letterBody: { ...type.subtitle, color: colors.ink, fontStyle: "italic", lineHeight: 24 },
  letterAuthor: { ...type.caption, color: colors.mutedDim, marginTop: 4, alignSelf: "flex-end" },
  footer: { paddingHorizontal: 24, paddingTop: 18 }
});
