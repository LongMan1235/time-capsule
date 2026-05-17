import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { ArrowRight, Cake, Camera, GraduationCap, HeartHandshake, MapPin } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { IconComponent } from "../design/icons";

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

export function PersonalizeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function done() {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
    await AsyncStorage.setItem(
      "time-capsule-personalize-interests",
      JSON.stringify(Array.from(selected))
    );
    navigation.goBack();
  }

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
        <Stagger delay={80}>
          <Text style={styles.eyebrow}>WELCOME</Text>
        </Stagger>
        <Stagger delay={200}>
          <Text style={styles.title}>What do you want{"\n"}to remember?</Text>
        </Stagger>
        <Stagger delay={320}>
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
            <PrimaryButton onPress={done} icon={ArrowRight}>
              {selected.size > 0 ? "Save and continue" : "Skip for now"}
            </PrimaryButton>
          </Stagger>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
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
  footer: { marginTop: 30 }
});
