import { Check, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";

const features = [
  { label: "1 TB of memory storage", included: ["plus", "premium"] },
  { label: "Unlimited capsules", included: ["plus", "premium"] },
  { label: "Smart AI search", included: ["plus", "premium"] },
  { label: "Face recognition (opt-in)", included: ["premium"] },
  { label: "Collaborative capsules", included: ["premium"] },
  { label: "Annual printed memory book", included: ["premium"] }
];

type Plan = "plus" | "premium";

const plans: Array<{ id: Plan; title: string; price: string; cadence: string }> = [
  { id: "plus", title: "Plus", price: "$4.99", cadence: "/month" },
  { id: "premium", title: "Premium", price: "$9.99", cadence: "/month" }
];

export function PaywallScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<Plan>("premium");

  return (
    <Screen tone="warm" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.close}>
          <X color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>PREMIUM</Text>
        <View style={styles.close} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <Stagger delay={120}>
          <Text style={styles.title}>Keep the bigger story.</Text>
        </Stagger>
        <Stagger delay={240}>
          <Text style={styles.subtitle}>
            For people whose memories deserve more than a camera roll.
          </Text>
        </Stagger>

        <Stagger delay={400}>
          <View style={styles.plans}>
            {plans.map((p) => {
              const active = plan === p.id;
              return (
                <AnimatedPressable key={p.id} onPress={() => setPlan(p.id)} style={[styles.plan, active ? styles.planActive : null]}>
                  <Text style={[styles.planTitle, active ? styles.planTitleActive : null]}>{p.title}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, active ? styles.priceActive : null]}>{p.price}</Text>
                    <Text style={[styles.cadence, active ? styles.cadenceActive : null]}>{p.cadence}</Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </Stagger>

        <Stagger delay={540}>
          <View style={styles.features}>
            {features.map((feature) => (
              <FeatureRow key={feature.label} label={feature.label} included={feature.included.includes(plan)} />
            ))}
          </View>
        </Stagger>

        <Stagger delay={700} style={{ marginTop: 18 }}>
          <PrimaryButton onPress={() => undefined}>
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
        {included ? <Check size={13} color={colors.ink} /> : <X size={13} color={colors.mutedDim} />}
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
    paddingHorizontal: 16,
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
    backgroundColor: colors.card
  },
  eyebrow: { ...type.micro, color: colors.muted },
  content: { padding: 24, gap: 12 },
  title: { ...type.display, color: colors.fog },
  subtitle: { ...type.body, color: colors.muted, marginTop: 4 },
  plans: { flexDirection: "row", gap: 10, marginTop: 20 },
  plan: {
    flex: 1,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    gap: 6
  },
  planActive: { borderColor: colors.gold, backgroundColor: "rgba(232,194,107,0.10)" },
  planTitle: { ...type.subtitle, color: colors.fog, fontWeight: "700" },
  planTitleActive: { color: colors.gold },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  price: { ...type.title, color: colors.fog, fontVariant: ["tabular-nums"] },
  priceActive: { color: colors.fog },
  cadence: { ...type.caption, color: colors.muted, marginBottom: 3 },
  cadenceActive: { color: colors.muted },
  features: { gap: 12, marginTop: 18 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureIconOn: { backgroundColor: colors.gold },
  featureIconOff: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  featureText: { ...type.body, color: colors.fog },
  featureTextMuted: { color: colors.mutedDim },
  legal: { ...type.caption, color: colors.muted, textAlign: "center", marginTop: 12 }
});
