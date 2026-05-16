import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Heart, Lock, MapPin, Sparkles } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, gradients, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

const hero = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80";

const moments = [
  { Icon: Lock, label: "Seal" },
  { Icon: Heart, label: "Wait" },
  { Icon: Sparkles, label: "Relive" }
];

export function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const heroZoom = useRef(new Animated.Value(0)).current;
  const heroFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(heroZoom, { toValue: 1, duration: 12_000, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [heroFade, heroZoom]);

  const scale = heroZoom.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1.0] });

  return (
    <Screen edges={["bottom"]} ambient={false} grain={false}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: heroFade }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
          <Image source={{ uri: hero }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        </Animated.View>
        <LinearGradient colors={["rgba(0,0,0,0.10)", "rgba(0,0,0,0.40)", "rgba(11,10,16,0.95)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[colors.glowSoft, "rgba(0,0,0,0)"]} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} />
      </Animated.View>

      <View style={styles.scroll}>
        <Stagger delay={120} translate={-12}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>TIME CAPSULE</Text>
          </View>
        </Stagger>

        <View style={styles.copy}>
          <Stagger delay={260}>
            <Text style={styles.kicker}>For the moments worth waiting for</Text>
          </Stagger>
          <Stagger delay={420}>
            <Text style={styles.title}>Save the night.{"\n"}Open it{" "}<Text style={styles.titleAccent}>when it matters</Text>.</Text>
          </Stagger>
          <Stagger delay={620}>
            <Text style={styles.body}>
              Create shared memory capsules for trips, birthdays, endings, beginnings — and everything you want future-you to feel again.
            </Text>
          </Stagger>

          <Stagger delay={820}>
            <View style={styles.flow}>
              {moments.map(({ Icon, label }, index) => (
                <View key={label} style={styles.flowItem}>
                  <View style={styles.flowIcon}>
                    <Icon color={colors.gold} size={18} />
                  </View>
                  <Text style={styles.flowLabel}>{label}</Text>
                  {index < moments.length - 1 ? <View style={styles.flowConnector} /> : null}
                </View>
              ))}
            </View>
          </Stagger>

          <Stagger delay={1020}>
            <View style={styles.cta}>
              <PrimaryButton onPress={() => navigation.navigate("Auth")} icon={ArrowRight}>
                Begin
              </PrimaryButton>
              <View style={styles.metaRow}>
                <MapPin size={12} color={colors.muted} />
                <Text style={styles.metaText}>End-to-end encrypted · Opt-in AI</Text>
              </View>
            </View>
          </Stagger>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 36 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  brand: { ...type.micro, color: colors.fog, letterSpacing: 3.2 },
  copy: { gap: 18 },
  kicker: { ...type.caption, color: colors.gold, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase" },
  title: { ...type.display, color: colors.fog },
  titleAccent: { color: colors.gold, fontStyle: "italic", fontWeight: "700" },
  body: { ...type.subtitle, color: colors.bone, opacity: 0.88, maxWidth: 420 },
  flow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: "rgba(8,6,12,0.55)",
    borderWidth: 1,
    borderColor: colors.line
  },
  flowItem: { flexDirection: "row", alignItems: "center" },
  flowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,194,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.35)"
  },
  flowLabel: { ...type.caption, color: colors.fog, fontWeight: "700", marginLeft: 10 },
  flowConnector: { width: 22, height: 1, backgroundColor: colors.line, marginHorizontal: 12 },
  cta: { gap: 14, marginTop: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  metaText: { ...type.caption, color: colors.muted }
});
