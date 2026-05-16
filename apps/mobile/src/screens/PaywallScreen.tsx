import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Check, Sparkles, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, gradients, radii, shadow, type } from "../design/theme";

const features = [
  { label: "1 TB of memory storage", included: ["plus", "premium"] },
  { label: "Unlimited capsules", included: ["plus", "premium"] },
  { label: "Smart AI search", included: ["plus", "premium"] },
  { label: "Face recognition (opt-in)", included: ["premium"] },
  { label: "Collaborative friend capsules", included: ["premium"] },
  { label: "Annual printed memory book", included: ["premium"] }
];

type Plan = "plus" | "premium";

const plans: Array<{ id: Plan; title: string; price: string; cadence: string; tagline: string; featured?: boolean }> = [
  { id: "plus", title: "Plus", price: "$4.99", cadence: "/month", tagline: "More space. Better search." },
  { id: "premium", title: "Premium", price: "$9.99", cadence: "/month", tagline: "The full Time Capsule.", featured: true }
];

export function PaywallScreen() {
  const navigation = useNavigation();
  const [plan, setPlan] = useState<Plan>("premium");

  return (
    <Screen tone="warm">
      <View style={styles.header}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.close}>
          <X color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>PREMIUM</Text>
        <View style={styles.close} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stagger delay={80}>
          <View style={styles.glowBadge}>
            <Sparkles color={colors.ink} size={14} />
            <Text style={styles.glowBadgeText}>UNLOCK MORE</Text>
          </View>
        </Stagger>
        <Stagger delay={200}>
          <Text style={styles.title}>Keep the bigger{"\n"}story.</Text>
        </Stagger>
        <Stagger delay={320}>
          <Text style={styles.subtitle}>
            For people whose memories deserve more than a camera roll and a forgotten group chat.
          </Text>
        </Stagger>

        <Stagger delay={460}>
          <View style={styles.plans}>
            {plans.map((p) => {
              const active = plan === p.id;
              return (
                <AnimatedPressable key={p.id} onPress={() => setPlan(p.id)} style={[styles.plan, active ? styles.planActive : null, p.featured ? shadow.glow : shadow.soft]}>
                  {active ? (
                    <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <View style={styles.planRow}>
                    <Text style={[styles.planTitle, active ? styles.planTitleActive : null]}>{p.title}</Text>
                    {p.featured ? (
                      <View style={[styles.bestTag, active ? styles.bestTagActive : null]}>
                        <Text style={[styles.bestTagText, active ? styles.bestTagTextActive : null]}>BEST</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, active ? styles.priceActive : null]}>{p.price}</Text>
                    <Text style={[styles.cadence, active ? styles.cadenceActive : null]}>{p.cadence}</Text>
                  </View>
                  <Text style={[styles.tagline, active ? styles.taglineActive : null]}>{p.tagline}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </Stagger>

        <Stagger delay={600}>
          <View style={styles.features}>
            {features.map((feature) => {
              const included = feature.included.includes(plan);
              return (
                <FeatureRow key={feature.label} label={feature.label} included={included} />
              );
            })}
          </View>
        </Stagger>

        <Stagger delay={760} style={{ marginTop: 16 }}>
          <PrimaryButton onPress={() => undefined} icon={Sparkles}>
            Start {plan === "premium" ? "Premium" : "Plus"}
          </PrimaryButton>
          <Text style={styles.legal}>Cancel anytime. Storage stays yours.</Text>
        </Stagger>
      </ScrollView>
    </Screen>
  );
}

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, included ? styles.featureIconOn : styles.featureIconOff]}>
        {included ? <Check size={14} color={colors.ink} /> : <X size={14} color={colors.muted} />}
      </View>
      <Text style={[styles.featureText, included ? null : styles.featureTextMuted]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  eyebrow: { ...type.micro, color: colors.gold },
  content: { padding: 24, paddingBottom: 60, gap: 14 },
  glowBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.gold
  },
  glowBadgeText: { ...type.micro, color: colors.ink, letterSpacing: 1.6 },
  title: { ...type.display, color: colors.fog },
  subtitle: { ...type.subtitle, color: colors.muted },
  plans: { flexDirection: "row", gap: 10, marginTop: 18 },
  plan: {
    flex: 1,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    gap: 4
  },
  planActive: { borderColor: colors.gold, backgroundColor: colors.gold },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planTitle: { ...type.subtitle, color: colors.fog, fontWeight: "800" },
  planTitleActive: { color: colors.ink },
  bestTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold
  },
  bestTagActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  bestTagText: { ...type.micro, color: colors.ink, letterSpacing: 1.4 },
  bestTagTextActive: { color: colors.gold },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 6 },
  price: { ...type.title, color: colors.fog, fontVariant: ["tabular-nums"] },
  priceActive: { color: colors.ink },
  cadence: { ...type.caption, color: colors.muted, marginBottom: 4 },
  cadenceActive: { color: colors.mutedDim },
  tagline: { ...type.caption, color: colors.muted },
  taglineActive: { color: colors.mutedDim },
  features: { gap: 10, marginTop: 18 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureIconOn: { backgroundColor: colors.gold },
  featureIconOff: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: colors.line },
  featureText: { ...type.body, color: colors.fog, fontWeight: "600" },
  featureTextMuted: { color: colors.muted },
  legal: { ...type.caption, color: colors.muted, textAlign: "center", marginTop: 10 }
});
