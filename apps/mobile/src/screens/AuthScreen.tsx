import { Apple, AtSign, KeyRound, Sparkles, UserRound } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { Stagger } from "../components/Stagger";
import { TextField } from "../components/TextField";
import { colors, radii, type } from "../design/theme";
import { useSessionStore, type SessionUser } from "../store/session";

type Mode = "signup" | "login";

const modeOptions: Array<{ value: Mode; label: string }> = [
  { value: "signup", label: "Create account" },
  { value: "login", label: "Sign in" }
];

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useSessionStore((state) => state.signIn);

  const swap = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(swap, { toValue: mode === "signup" ? 0 : 1, duration: 280, useNativeDriver: true }).start();
  }, [mode, swap]);

  function fillTestAccount() {
    setMode("login");
    setIdentifier("Rithik");
    setPassword("mypassword123");
  }

  async function submit() {
    setLoading(true);
    try {
      const payload =
        mode === "signup"
          ? { email: identifier, password, username, displayName: displayName || username }
          : { email: identifier, password };
      const result = await api<{ token: string; user?: SessionUser }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await signIn(result.token, result.user);
    } catch (error) {
      Alert.alert("Could not sign in", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen tone="warm">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <Stagger delay={80}>
            <Text style={styles.eyebrow}>TIME CAPSULE</Text>
          </Stagger>
          <Stagger delay={200}>
            <Text style={styles.title}>{mode === "signup" ? "Create your capsule." : "Welcome back."}</Text>
          </Stagger>
          <Stagger delay={320}>
            <Text style={styles.subtitle}>Your memories stay private until the day you choose.</Text>
          </Stagger>

          <Stagger delay={440} style={{ marginTop: 22 }}>
            <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
          </Stagger>

          <Stagger delay={560} style={styles.fields}>
            <TextField
              label={mode === "signup" ? "EMAIL" : "EMAIL OR USERNAME"}
              icon={mode === "signup" ? AtSign : UserRound}
              placeholder={mode === "signup" ? "you@somewhere.com" : "rithik or rithik@time-capsule.app"}
              keyboardType={mode === "signup" ? "email-address" : "default"}
              autoCapitalize="none"
              autoComplete={mode === "signup" ? "email" : "username"}
              value={identifier}
              onChangeText={setIdentifier}
            />
            <TextField
              label="PASSWORD"
              icon={KeyRound}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {mode === "signup" ? (
              <>
                <TextField
                  label="USERNAME"
                  icon={AtSign}
                  placeholder="future_you"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
                <TextField
                  label="DISPLAY NAME"
                  icon={UserRound}
                  placeholder="How friends find you"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </>
            ) : null}
          </Stagger>

          {mode === "login" ? (
            <Stagger delay={620}>
              <AnimatedPressable onPress={fillTestAccount} style={styles.testHint}>
                <Sparkles color={colors.gold} size={13} />
                <Text style={styles.testHintText}>
                  Demo account ready: <Text style={styles.testHintAccent}>Rithik</Text> · <Text style={styles.testHintAccent}>mypassword123</Text>
                </Text>
              </AnimatedPressable>
            </Stagger>
          ) : null}

          <Stagger delay={680} style={styles.cta}>
            <PrimaryButton onPress={submit} loading={loading}>
              {mode === "signup" ? "Create my capsule" : "Sign in"}
            </PrimaryButton>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.oauthRow}>
              <AnimatedPressable style={styles.oauth} onPress={() => Alert.alert("Coming soon", "Google sign-in plugs in here.") }>
                <Text style={styles.oauthGlyph}>G</Text>
                <Text style={styles.oauthText}>Google</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.oauth} onPress={() => Alert.alert("Coming soon", "Apple sign-in plugs in here.") }>
                <Apple color={colors.fog} size={18} />
                <Text style={styles.oauthText}>Apple</Text>
              </AnimatedPressable>
            </View>
          </Stagger>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 6 },
  eyebrow: { ...type.micro, color: colors.gold },
  title: { ...type.hero, color: colors.fog, marginTop: 8 },
  subtitle: { ...type.body, color: colors.muted, marginTop: 6 },
  fields: { marginTop: 24, gap: 14 },
  testHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(232,194,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,194,107,0.28)",
    marginTop: 14
  },
  testHintText: { ...type.caption, color: colors.fog, flex: 1 },
  testHintAccent: { color: colors.gold, fontWeight: "800" },
  cta: { marginTop: 22, gap: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { ...type.micro, color: colors.muted },
  oauthRow: { flexDirection: "row", gap: 10 },
  oauth: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  oauthGlyph: { ...type.subtitle, color: colors.fog, fontWeight: "900" },
  oauthText: { ...type.body, color: colors.fog, fontWeight: "700" }
});
