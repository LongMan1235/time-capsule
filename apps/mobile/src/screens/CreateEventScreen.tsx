import { useNavigation } from "@react-navigation/native";
import { CalendarClock, Camera, Globe, Heading2, Hourglass, MapPin, User, Users, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ContributorScope } from "@time-capsule/shared";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { TextField } from "../components/TextField";
import { colors, radii, type } from "../design/theme";
import type { IconComponent } from "../design/icons";

const collectionWindows = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
  { label: "1 month", hours: 720 }
];

const unlockPresets = [
  { label: "1 mo", days: 30 },
  { label: "6 mo", days: 182 },
  { label: "1 yr", days: 365 },
  { label: "5 yr", days: 365 * 5 }
];

const contributorOptions: Array<{ value: ContributorScope; label: string; description: string; Icon: IconComponent }> = [
  { value: "OWNER_ONLY", label: "Just me", description: "Only you can add memories.", Icon: Camera },
  { value: "FRIENDS", label: "Friends", description: "People you invite can contribute.", Icon: Users },
  { value: "OPEN_LINK", label: "Open link", description: "Anyone with the link can add.", Icon: Globe }
];

function isoFromHours(hours: number) {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

function isoFromDays(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function localDateLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function CreateEventScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [collectionHours, setCollectionHours] = useState(168);
  const [unlockDays, setUnlockDays] = useState(365);
  const [contributorScope, setContributorScope] = useState<ContributorScope>("OWNER_ONLY");
  const [mediaCap, setMediaCap] = useState<number | null>(null);
  const [mediaCapPerUser, setMediaCapPerUser] = useState<number | null>(10);
  const [saving, setSaving] = useState(false);

  const collectionClosesAt = useMemo(() => isoFromHours(collectionHours), [collectionHours]);
  const unlockAt = useMemo(() => isoFromDays(unlockDays + Math.ceil(collectionHours / 24)), [unlockDays, collectionHours]);

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
          collectionClosesAt,
          unlockAt,
          visibility: contributorScope === "OPEN_LINK" ? "COLLABORATIVE" : contributorScope === "FRIENDS" ? "FRIENDS" : "PRIVATE",
          contributorScope,
          mediaCap,
          mediaCapPerUser: contributorScope === "OWNER_ONLY" ? null : mediaCapPerUser
        })
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not create capsule", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={["left", "right"]} tone="paper">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.close}>
            <X color={colors.fog} size={20} />
          </AnimatedPressable>
          <Text style={styles.eyebrow}>NEW CAPSULE</Text>
          <View style={styles.close} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
          <Stagger delay={80}>
            <Text style={styles.title}>Start a new page.</Text>
          </Stagger>

          <Stagger delay={200} style={styles.fields}>
            <TextField
              label="TITLE"
              icon={Heading2}
              placeholder="Europe Trip 2026"
              value={title}
              onChangeText={setTitle}
              maxLength={64}
            />
            <View style={styles.textAreaWrap}>
              <Text style={styles.label}>NOTE</Text>
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

          <Stagger delay={320}>
            <SettingsBlock Icon={Hourglass} title="Collection window" value={`Closes ${localDateLabel(collectionClosesAt)}`}>
              <View style={styles.chipRow}>
                {collectionWindows.map((option) => {
                  const active = option.hours === collectionHours;
                  return (
                    <AnimatedPressable
                      key={option.label}
                      onPress={() => setCollectionHours(option.hours)}
                      style={[styles.chip, active ? styles.chipActive : null]}
                    >
                      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{option.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
              <Text style={styles.helperText}>
                After the window closes, no new memories can be added. The capsule auto-seals.
              </Text>
            </SettingsBlock>
          </Stagger>

          <Stagger delay={420}>
            <SettingsBlock Icon={CalendarClock} title="Unlock date" value={localDateLabel(unlockAt)}>
              <View style={styles.chipRow}>
                {unlockPresets.map((option) => {
                  const active = option.days === unlockDays;
                  return (
                    <AnimatedPressable
                      key={option.label}
                      onPress={() => setUnlockDays(option.days)}
                      style={[styles.chip, active ? styles.chipActive : null]}
                    >
                      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{option.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </SettingsBlock>
          </Stagger>

          <Stagger delay={520}>
            <SettingsBlock Icon={Users} title="Who can add">
              <View style={styles.optionList}>
                {contributorOptions.map((option) => {
                  const active = option.value === contributorScope;
                  return (
                    <AnimatedPressable
                      key={option.value}
                      onPress={() => setContributorScope(option.value)}
                      style={[styles.option, active ? styles.optionActive : null]}
                    >
                      <View style={[styles.optionIcon, active ? styles.optionIconActive : null]}>
                        <option.Icon color={active ? colors.ink : colors.muted} size={14} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, active ? styles.optionTitleActive : null]}>{option.label}</Text>
                        <Text style={styles.optionBody}>{option.description}</Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </SettingsBlock>
          </Stagger>

          <Stagger delay={620}>
            <SettingsBlock Icon={Camera} title="Capsule photo cap" value={mediaCap ? `${mediaCap} photos` : "Unlimited"}>
              <View style={styles.chipRow}>
                {[null, 20, 50, 100, 250].map((cap) => {
                  const active = cap === mediaCap;
                  return (
                    <AnimatedPressable
                      key={cap ?? "none"}
                      onPress={() => setMediaCap(cap)}
                      style={[styles.chip, active ? styles.chipActive : null]}
                    >
                      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{cap ?? "∞"}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
              <Text style={styles.helperText}>Total photos this capsule can hold across all contributors.</Text>
            </SettingsBlock>
          </Stagger>

          {contributorScope !== "OWNER_ONLY" ? (
            <Stagger delay={680}>
              <SettingsBlock
                Icon={User}
                title="Per-person cap"
                value={mediaCapPerUser ? `${mediaCapPerUser} each` : "Unlimited"}
              >
                <View style={styles.chipRow}>
                  {[null, 3, 5, 10, 20].map((cap) => {
                    const active = cap === mediaCapPerUser;
                    return (
                      <AnimatedPressable
                        key={cap ?? "none"}
                        onPress={() => setMediaCapPerUser(cap)}
                        style={[styles.chip, active ? styles.chipActive : null]}
                      >
                        <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>{cap ?? "∞"}</Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
                <Text style={styles.helperText}>How many photos a single contributor can add to this capsule.</Text>
              </SettingsBlock>
            </Stagger>
          ) : null}

          <Stagger delay={760}>
            <PrimaryButton onPress={create} loading={saving}>
              Open collection
            </PrimaryButton>
          </Stagger>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SettingsBlock({
  Icon,
  title,
  value,
  children
}: {
  Icon: IconComponent;
  title: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <View style={styles.blockHeadInner}>
          <Icon color={colors.muted} size={14} />
          <Text style={styles.blockTitle}>{title}</Text>
        </View>
        {value ? <Text style={styles.blockValue}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  content: { padding: 24, gap: 20 },
  title: { ...type.hero, color: colors.fog },
  fields: { gap: 12 },
  textAreaWrap: { gap: 8 },
  label: { ...type.micro, color: colors.muted },
  textArea: {
    minHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    color: colors.fog,
    ...type.body,
    textAlignVertical: "top"
  },
  block: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
    gap: 12
  },
  blockHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blockHeadInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  blockTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  blockValue: { ...type.caption, color: colors.muted },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  chipActive: { backgroundColor: colors.fog, borderColor: colors.fog },
  chipLabel: { ...type.caption, color: colors.fog, fontWeight: "600" },
  chipLabelActive: { color: colors.ink },
  helperText: { ...type.caption, color: colors.muted, lineHeight: 18 },
  optionList: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  optionActive: { borderColor: colors.gold, backgroundColor: "rgba(232,194,107,0.08)" },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  optionIconActive: { borderColor: colors.gold, backgroundColor: colors.gold },
  optionTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  optionTitleActive: { color: colors.gold },
  optionBody: { ...type.caption, color: colors.muted, marginTop: 2 }
});
