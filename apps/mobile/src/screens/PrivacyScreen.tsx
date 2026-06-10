import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { ChevronRight, LogOut, Moon, ShieldCheck, Sparkles, Sun, Trash2, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { useTheme } from "../design/ThemeProvider";
import { radii, type } from "../design/themes";
import type { IconComponent } from "../design/icons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../store/session";

export function PrivacyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, mode, setMode } = useTheme();
  const [aiOptIn, setAiOptIn] = useState(false);
  const [faceRecognitionOptIn, setFaceRecognitionOptIn] = useState(false);
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);

  async function save(nextAi = aiOptIn, nextFace = faceRecognitionOptIn) {
    try {
      await api("/privacy/ai-consent", { method: "PATCH", body: JSON.stringify({ aiOptIn: nextAi, faceRecognitionOptIn: nextFace }) });
    } catch (error) {
      Alert.alert("Could not save privacy settings", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function requestDeletion() {
    Alert.alert(
      "Delete your account?",
      "All capsules, photos, and embeddings will be queued for permanent deletion.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            api("/privacy/delete-request", { method: "POST" })
              .then(() => Alert.alert("Request received", "We'll start deletion within 24 hours."))
              .catch(() => Alert.alert("Try again", "Could not reach the server."));
          }
        }
      ]
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stagger delay={60}>
          <Text style={[styles.eyebrow, { color: theme.accent.gold }]}>SETTINGS</Text>
        </Stagger>
        <Stagger delay={160}>
          <Text style={[styles.title, { color: theme.ink.primary }]}>You decide what we see.</Text>
        </Stagger>

        {user ? (
          <Stagger delay={280}>
            <AnimatedPressable
              onPress={() => navigation.navigate("Profile")}
              style={[styles.profileCard, { backgroundColor: theme.bg.elevated, borderColor: theme.line.soft }]}
            >
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" transition={300} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { borderColor: theme.line.hard, backgroundColor: theme.bg.surface }]}>
                  <UserRound color={theme.ink.muted} size={20} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: theme.ink.primary }]}>{user.displayName}</Text>
                <Text style={[styles.profileMeta, { color: theme.ink.muted }]}>@{user.username}</Text>
              </View>
              <ChevronRight color={theme.ink.muted} size={16} />
            </AnimatedPressable>
          </Stagger>
        ) : null}

        {/* APPEARANCE */}
        <Stagger delay={360}>
          <View style={[styles.group, { backgroundColor: theme.bg.elevated, borderColor: theme.line.soft }]}>
            <Text style={[styles.groupLabel, { color: theme.ink.muted }]}>APPEARANCE</Text>
            <View style={[styles.appearanceRow]}>
              <ThemeOption
                icon={Sun}
                label="Marble"
                description="Warm cream, gold accents"
                active={mode === "marble"}
                onPress={() => setMode("marble")}
              />
              <ThemeOption
                icon={Moon}
                label="Obsidian"
                description="Deep ink, gold accents"
                active={mode === "obsidian"}
                onPress={() => setMode("obsidian")}
              />
            </View>
          </View>
        </Stagger>

        <Stagger delay={420}>
          <View style={[styles.group, { backgroundColor: theme.bg.elevated, borderColor: theme.line.soft }]}>
            <Text style={[styles.groupLabel, { color: theme.ink.muted }]}>AI &amp; SEARCH</Text>
            <Row
              Icon={Sparkles}
              title="Smart memory search"
              body="Index captions, images, and metadata."
              value={aiOptIn}
              onChange={(value) => { setAiOptIn(value); save(value, faceRecognitionOptIn); }}
            />
            <Divider />
            <Row
              Icon={UserRound}
              title="Face recognition"
              body="Consent-based identity clusters."
              value={faceRecognitionOptIn}
              onChange={(value) => { setFaceRecognitionOptIn(value); save(aiOptIn, value); }}
            />
          </View>
        </Stagger>

        <Stagger delay={520}>
          <View style={[styles.group, { backgroundColor: theme.bg.elevated, borderColor: theme.line.soft }]}>
            <Text style={[styles.groupLabel, { color: theme.ink.muted }]}>ACCOUNT</Text>
            <AnimatedPressable style={styles.action} onPress={requestDeletion}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: "rgba(181,82,62,0.10)", borderColor: "rgba(181,82,62,0.32)" }
                ]}
              >
                <Trash2 color={theme.accent.danger} size={15} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: theme.accent.danger }]}>Delete account</Text>
                <Text style={[styles.actionBody, { color: theme.ink.muted }]}>Capsules and media are wiped.</Text>
              </View>
            </AnimatedPressable>
            <Divider />
            <AnimatedPressable style={styles.action} onPress={() => signOut()}>
              <View style={[styles.actionIcon, { backgroundColor: theme.bg.surface, borderColor: theme.line.hard }]}>
                <LogOut color={theme.ink.primary} size={15} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: theme.ink.primary }]}>Sign out</Text>
                <Text style={[styles.actionBody, { color: theme.ink.muted }]}>Your capsules stay where they are.</Text>
              </View>
            </AnimatedPressable>
          </View>
        </Stagger>

        <Stagger delay={640}>
          <View style={[styles.assurance, { backgroundColor: theme.bg.surface, borderColor: theme.line.soft }]}>
            <ShieldCheck color={theme.ink.muted} size={14} />
            <Text style={[styles.assuranceText, { color: theme.ink.muted }]}>
              End-to-end encrypted · GDPR-style deletion
            </Text>
          </View>
        </Stagger>
      </ScrollView>
    </Screen>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  description,
  active,
  onPress
}: {
  icon: IconComponent;
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.themeOption,
        {
          backgroundColor: active ? theme.bg.inverse : theme.bg.surface,
          borderColor: active ? theme.bg.inverse : theme.line.soft
        }
      ]}
    >
      <View
        style={[
          styles.themeOptionIcon,
          {
            backgroundColor: active ? "rgba(232,194,107,0.18)" : theme.bg.canvas,
            borderColor: active ? "rgba(232,194,107,0.42)" : theme.line.soft
          }
        ]}
      >
        <Icon color={active ? theme.accent.goldSoft : theme.ink.muted} size={16} />
      </View>
      <Text style={[styles.themeOptionLabel, { color: active ? theme.ink.onInverse : theme.ink.primary }]}>
        {label}
      </Text>
      <Text style={[styles.themeOptionDesc, { color: active ? theme.ink.onInverse : theme.ink.muted, opacity: active ? 0.7 : 1 }]}>
        {description}
      </Text>
    </AnimatedPressable>
  );
}

function Row({
  Icon,
  title,
  body,
  value,
  onChange
}: {
  Icon: IconComponent;
  title: string;
  body: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.actionIcon, { backgroundColor: theme.bg.surface, borderColor: theme.line.soft }]}>
        <Icon color={theme.ink.primary} size={15} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: theme.ink.primary }]}>{title}</Text>
        <Text style={[styles.actionBody, { color: theme.ink.muted }]}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.line.hard, true: theme.accent.gold }}
        thumbColor={theme.bg.canvas}
      />
    </View>
  );
}

function Divider() {
  const { theme } = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.line.soft }]} />;
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 140, gap: 18 },
  eyebrow: { ...type.micro, letterSpacing: 2.8 },
  title: { ...type.hero, marginTop: 6 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
  profileName: { ...type.subtitle, fontWeight: "700" },
  profileMeta: { ...type.caption, marginTop: 2 },
  group: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 6
  },
  groupLabel: { ...type.micro, letterSpacing: 2.4, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  appearanceRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
  themeOption: {
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 8
  },
  themeOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  themeOptionLabel: { ...type.body, fontWeight: "700" },
  themeOptionDesc: { ...type.caption },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  actionCopy: { flex: 1 },
  actionTitle: { ...type.body, fontWeight: "700" },
  actionBody: { ...type.caption, marginTop: 2 },
  divider: { height: 1, marginLeft: 58 },
  assurance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1
  },
  assuranceText: { ...type.caption, flex: 1 }
});
