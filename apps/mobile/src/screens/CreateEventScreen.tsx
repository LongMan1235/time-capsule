import { useNavigation } from "@react-navigation/native";
import { CalendarClock, Heading2, Lock, MapPin, Sparkles, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { TextField } from "../components/TextField";
import { colors, radii, type } from "../design/theme";

const presets = [
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
  { label: "6 months", days: 182 },
  { label: "1 year", days: 365 },
  { label: "5 years", days: 365 * 5 }
];

function isoFromDays(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function localDateLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function CreateEventScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [unlockAt, setUnlockAt] = useState<string | undefined>(isoFromDays(365));
  const [presetDays, setPresetDays] = useState<number | undefined>(365);
  const [saving, setSaving] = useState(false);

  const dateLabel = useMemo(() => (unlockAt ? localDateLabel(unlockAt) : "Pick an unlock day"), [unlockAt]);

  async function create() {
    if (!title.trim()) {
      Alert.alert("Add a title", "Give this capsule a name first.");
      return;
    }
    setSaving(true);
    try {
      await api("/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          locationName,
          eventDate: new Date().toISOString(),
          unlockAt,
          visibility: "PRIVATE"
        })
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not create event", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.close}>
            <X color={colors.fog} size={20} />
          </AnimatedPressable>
          <Text style={styles.eyebrow}>NEW CAPSULE</Text>
          <View style={styles.close} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Stagger delay={80}>
            <Text style={styles.title}>What do you want{"\n"}future-you to feel?</Text>
          </Stagger>

          <Stagger delay={220} style={styles.fields}>
            <TextField
              label="TITLE"
              icon={Heading2}
              placeholder="Europe Trip 2026"
              value={title}
              onChangeText={setTitle}
              maxLength={64}
            />
            <View style={styles.textAreaWrap}>
              <Text style={styles.label}>NOTE FOR FUTURE-YOU</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What should this capsule remember?"
                placeholderTextColor={colors.mutedDim}
                multiline
                style={styles.textArea}
                selectionColor={colors.gold}
              />
            </View>
            <TextField
              label="LOCATION"
              icon={MapPin}
              placeholder="Lisbon, Portugal"
              value={locationName}
              onChangeText={setLocationName}
            />
          </Stagger>

          <Stagger delay={360}>
            <View style={styles.unlockBlock}>
              <View style={styles.unlockHead}>
                <View style={styles.unlockHeadInner}>
                  <CalendarClock color={colors.gold} size={18} />
                  <Text style={styles.unlockTitle}>Unlock date</Text>
                </View>
                <Text style={styles.unlockValue}>{dateLabel}</Text>
              </View>
              <View style={styles.presetRow}>
                {presets.map((preset) => {
                  const active = preset.days === presetDays;
                  return (
                    <AnimatedPressable
                      key={preset.label}
                      onPress={() => {
                        setPresetDays(preset.days);
                        setUnlockAt(isoFromDays(preset.days));
                      }}
                      style={[styles.preset, active ? styles.presetActive : null]}
                    >
                      <Text style={[styles.presetLabel, active ? styles.presetLabelActive : null]}>{preset.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
              <View style={styles.privacyNote}>
                <Lock size={12} color={colors.muted} />
                <Text style={styles.privacyText}>Sealed until {dateLabel}. Early unlock available later from billing.</Text>
              </View>
            </View>
          </Stagger>

          <Stagger delay={500}>
            <PrimaryButton onPress={create} loading={saving} icon={Sparkles}>
              Seal this capsule
            </PrimaryButton>
          </Stagger>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  content: { padding: 24, paddingBottom: 140, gap: 22 },
  title: { ...type.hero, color: colors.fog },
  fields: { gap: 14 },
  textAreaWrap: { gap: 8 },
  label: { ...type.micro, color: colors.muted },
  textArea: {
    minHeight: 130,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    color: colors.fog,
    ...type.body,
    textAlignVertical: "top"
  },
  unlockBlock: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 14
  },
  unlockHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  unlockHeadInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockTitle: { ...type.subtitle, color: colors.fog, fontWeight: "700" },
  unlockValue: { ...type.body, color: colors.gold, fontWeight: "700" },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  presetActive: { backgroundColor: colors.fog, borderColor: colors.fog },
  presetLabel: { ...type.caption, color: colors.fog, fontWeight: "700" },
  presetLabelActive: { color: colors.ink },
  privacyNote: { flexDirection: "row", alignItems: "center", gap: 6 },
  privacyText: { ...type.caption, color: colors.muted }
});
