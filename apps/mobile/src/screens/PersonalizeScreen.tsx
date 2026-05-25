import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowRight, Cake, Camera, GraduationCap, HeartHandshake, MapPin, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { IconComponent } from "../design/icons";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface Interest {
  id: string;
  label: string;
  Icon: IconComponent;
}

const interests: Interest[] = [
  { id: "trips", label: "Trips", Icon: MapPin },
  { id: "birthdays", label: "Birthdays", Icon: Cake },
  { id: "weddings", label: "Weddings", Icon: HeartHandshake },
  { id: "milestones", label: "Milestones", Icon: GraduationCap },
  { id: "everyday", label: "Everyday", Icon: Camera }
];

const STORAGE_KEY = "time-capsule-personalize-seen";

export async function hasSeenPersonalize() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === "1";
  } catch {
    return false;
  }
}

type Step = "interests" | "first-capsule";

export function PersonalizeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("interests");
  const stepProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(stepProgress, {
      toValue: step === "interests" ? 0 : 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [step, stepProgress]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveInterestsAndAdvance() {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
    await AsyncStorage.setItem(
      "time-capsule-personalize-interests",
      JSON.stringify(Array.from(selected))
    );
    setStep("first-capsule");
  }

  async function startFirstCapsule() {
    navigation.replace("CreateEvent");
  }

  function maybeLater() {
    navigation.goBack();
  }

  const interestsOpacity = stepProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const interestsTranslate = stepProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const firstOpacity = stepProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const firstTranslate = stepProgress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, step === "interests" ? styles.progressDotActive : styles.progressDotDone]} />
          <View style={[styles.progressDot, step === "first-capsule" ? styles.progressDotActive : styles.progressDotPending]} />
        </View>

        {step === "interests" ? (
          <Animated.View style={[styles.stage, { opacity: interestsOpacity, transform: [{ translateY: interestsTranslate }] }]}>
            <Stagger delay={60}>
              <Text style={styles.eyebrow}>STEP 1 OF 2</Text>
            </Stagger>
            <Stagger delay={180}>
              <Text style={styles.title}>What do you want{"\n"}to remember?</Text>
            </Stagger>
            <Stagger delay={300}>
              <Text style={styles.body}>
                Pick a few. We'll suggest templates next time you make a capsule.
              </Text>
            </Stagger>

            <Stagger delay={460} style={styles.grid}>
              {interests.map((interest) => {
                const active = selected.has(interest.id);
                return (
                  <AnimatedPressable
                    key={interest.id}
                    onPress={() => toggle(interest.id)}
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <interest.Icon color={active ? colors.ink : colors.muted} size={14} />
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{interest.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </Stagger>

            <View style={styles.footer}>
              <Stagger delay={620}>
                <PrimaryButton onPress={saveInterestsAndAdvance} icon={ArrowRight}>
                  Continue
                </PrimaryButton>
              </Stagger>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.stage, styles.stageOverlay, { opacity: firstOpacity, transform: [{ translateY: firstTranslate }] }]}>
            <Stagger delay={120}>
              <Text style={styles.eyebrow}>STEP 2 OF 2</Text>
            </Stagger>
            <Stagger delay={240}>
              <Text style={styles.title}>Make your{"\n"}first capsule.</Text>
            </Stagger>
            <Stagger delay={360}>
              <Text style={styles.body}>
                Pick a moment to remember. We'll seal photos, voice notes, and a letter to future-you until the day you choose.
              </Text>
            </Stagger>

            <Stagger delay={500}>
              <View style={styles.preview}>
                <View style={styles.previewIcon}>
                  <Sparkles color={colors.gold} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>Tip</Text>
                  <Text style={styles.previewBody}>
                    Add friends as contributors and they'll add memories too. You can also send a share link.
                  </Text>
                </View>
              </View>
            </Stagger>

            <View style={styles.footer}>
              <Stagger delay={640} style={{ gap: 10 }}>
                <PrimaryButton onPress={startFirstCapsule} icon={ArrowRight}>
                  Make my first capsule
                </PrimaryButton>
                <PrimaryButton onPress={maybeLater} variant="ghost">
                  Maybe later
                </PrimaryButton>
              </Stagger>
            </View>
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  progressRow: { flexDirection: "row", gap: 6, alignSelf: "center", marginBottom: 24 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  progressDotActive: { backgroundColor: colors.gold },
  progressDotDone: { backgroundColor: colors.gold, opacity: 0.4 },
  progressDotPending: { backgroundColor: colors.line },
  stage: { flex: 1 },
  stageOverlay: { position: "absolute", top: 0, left: 24, right: 24, bottom: 0, paddingTop: 60 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.hero, color: colors.fog, marginTop: 8 },
  body: { ...type.body, color: colors.muted, marginTop: 8, maxWidth: 360 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 28 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  chipActive: { backgroundColor: colors.fog, borderColor: colors.fog },
  chipLabel: { ...type.caption, color: colors.fog, fontWeight: "600" },
  chipLabelActive: { color: colors.ink },
  preview: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(232,194,107,0.30)", backgroundColor: "rgba(232,194,107,0.06)", marginTop: 28 },
  previewIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(232,194,107,0.40)", backgroundColor: "rgba(232,194,107,0.10)" },
  previewTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  previewBody: { ...type.caption, color: colors.muted, marginTop: 4, lineHeight: 18 },
  footer: { marginTop: "auto", paddingTop: 20 }
});
