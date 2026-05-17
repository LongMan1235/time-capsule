import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Gift, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EventSummary } from "@time-capsule/shared";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";

export function GiftCapsuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [capsuleId, setCapsuleId] = useState<string | undefined>();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<{ events: EventSummary[] }>("/events")
      .then((r) => setEvents(r.events.filter((e) => e.state !== "DRAFT")))
      .catch(() => setEvents([]));
  }, []);

  async function send() {
    if (!capsuleId) {
      Alert.alert("Pick a capsule", "Choose a capsule to send.");
      return;
    }
    if (!recipient.trim()) {
      Alert.alert("Who's it for?", "Enter a username or email.");
      return;
    }
    setSending(true);
    try {
      await api("/gifts", {
        method: "POST",
        body: JSON.stringify({ capsuleId, toUsernameOrEmail: recipient.trim(), message: message.trim() || undefined })
      });
      Alert.alert("Capsule sent", "Your friend will see it when it unlocks.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not send", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>GIFT A CAPSULE</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Stagger delay={80}>
          <Text style={styles.title}>Send a capsule.</Text>
          <Text style={styles.subtitle}>
            Pick one of your capsules, send it to someone. They get a push when it unlocks.
          </Text>
        </Stagger>

        <Stagger delay={200}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHICH CAPSULE</Text>
            <View style={styles.list}>
              {events.map((event) => {
                const active = event.id === capsuleId;
                return (
                  <AnimatedPressable
                    key={event.id}
                    onPress={() => setCapsuleId(event.id)}
                    style={[styles.option, active ? styles.optionActive : null]}
                  >
                    <Lock color={active ? colors.gold : colors.muted} size={14} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, active ? styles.optionTitleActive : null]}>{event.title}</Text>
                      <Text style={styles.optionBody}>
                        {event.state === "LOCKED" ? "Sealed" : event.state === "UNLOCKED" ? "Open" : "Collecting"} ·{" "}
                        {event.mediaCount} {event.mediaCount === 1 ? "memory" : "memories"}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </Stagger>

        <Stagger delay={320}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TO</Text>
            <TextInput
              value={recipient}
              onChangeText={setRecipient}
              placeholder="username or email"
              placeholderTextColor={colors.mutedDim}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              selectionColor={colors.gold}
            />
          </View>
        </Stagger>

        <Stagger delay={400}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>A NOTE</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="A line they'll see when it arrives…"
              placeholderTextColor={colors.mutedDim}
              multiline
              style={styles.textArea}
              selectionColor={colors.gold}
            />
          </View>
        </Stagger>

        <Stagger delay={520} style={{ marginTop: 10 }}>
          <PrimaryButton onPress={send} loading={sending} icon={Gift}>
            Send capsule
          </PrimaryButton>
        </Stagger>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eyebrow: { ...type.micro, color: colors.muted },
  content: { padding: 24, gap: 18, paddingBottom: 140 },
  title: { ...type.hero, color: colors.fog },
  subtitle: { ...type.body, color: colors.muted, marginTop: 6 },
  section: { gap: 8 },
  sectionLabel: { ...type.micro, color: colors.muted },
  list: { gap: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  optionActive: { borderColor: colors.gold, backgroundColor: "rgba(232,194,107,0.08)" },
  optionTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  optionTitleActive: { color: colors.gold },
  optionBody: { ...type.caption, color: colors.muted, marginTop: 2 },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, color: colors.fog, ...type.body },
  textArea: { minHeight: 80, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, color: colors.fog, ...type.body, textAlignVertical: "top" }
});
