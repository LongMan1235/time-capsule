import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { ChevronRight, LogOut, ShieldCheck, Sparkles, Trash2, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { IconComponent } from "../design/icons";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../store/session";

export function PrivacyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
          <Text style={styles.eyebrow}>PRIVACY</Text>
        </Stagger>
        <Stagger delay={160}>
          <Text style={styles.title}>You decide what we see.</Text>
        </Stagger>

        {user ? (
          <Stagger delay={280}>
            <AnimatedPressable onPress={() => navigation.navigate("Profile")} style={styles.profileCard}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" transition={300} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <UserRound color={colors.muted} size={20} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.displayName}</Text>
                <Text style={styles.profileMeta}>@{user.username}</Text>
              </View>
              <ChevronRight color={colors.muted} size={16} />
            </AnimatedPressable>
          </Stagger>
        ) : null}

        <Stagger delay={400}>
          <View style={styles.group}>
            <Text style={styles.groupLabel}>AI &amp; SEARCH</Text>
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
          <View style={styles.group}>
            <Text style={styles.groupLabel}>ACCOUNT</Text>
            <AnimatedPressable style={styles.action} onPress={requestDeletion}>
              <View style={[styles.actionIcon, styles.actionIconDanger]}>
                <Trash2 color={colors.danger} size={15} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={[styles.actionTitle, { color: colors.danger }]}>Delete account</Text>
                <Text style={styles.actionBody}>Capsules and media are wiped.</Text>
              </View>
            </AnimatedPressable>
            <Divider />
            <AnimatedPressable style={styles.action} onPress={() => signOut()}>
              <View style={styles.actionIcon}>
                <LogOut color={colors.fog} size={15} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>Sign out</Text>
                <Text style={styles.actionBody}>Your capsules stay where they are.</Text>
              </View>
            </AnimatedPressable>
          </View>
        </Stagger>

        <Stagger delay={640}>
          <View style={styles.assurance}>
            <ShieldCheck color={colors.muted} size={14} />
            <Text style={styles.assuranceText}>End-to-end encrypted · GDPR-style deletion</Text>
          </View>
        </Stagger>
      </ScrollView>
    </Screen>
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
  return (
    <View style={styles.row}>
      <View style={styles.actionIcon}>
        <Icon color={colors.fog} size={15} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionBody}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "rgba(255,255,255,0.10)", true: colors.gold }}
        thumbColor={colors.fog}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 140, gap: 16 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.hero, color: colors.fog, marginTop: 6 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.dusk },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  profileName: { ...type.subtitle, color: colors.fog, fontWeight: "600" },
  profileMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
  group: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    overflow: "hidden"
  },
  groupLabel: { ...type.micro, color: colors.muted, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line
  },
  actionIconDanger: {
    backgroundColor: "rgba(227,122,106,0.08)",
    borderColor: "rgba(227,122,106,0.30)"
  },
  actionCopy: { flex: 1 },
  actionTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  actionBody: { ...type.caption, color: colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 56 },
  assurance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  assuranceText: { ...type.caption, color: colors.muted, flex: 1 }
});
