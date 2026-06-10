import { AtSign, KeyRound, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { Stagger } from "../components/Stagger";
import { TextField } from "../components/TextField";
import { useTheme } from "../design/ThemeProvider";
import { radii, type } from "../design/themes";
import { useSessionStore, type SessionUser } from "../store/session";

type Mode = "signup" | "login";

const modeOptions: Array<{ value: Mode; label: string }> = [
  { value: "login", label: "Sign in" },
  { value: "signup", label: "Create account" }
];

export function AuthScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useSessionStore((state) => state.signIn);

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
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Stagger delay={80}>
            <Text style={[styles.eyebrow, { color: theme.accent.gold }]}>TIME CAPSULE</Text>
          </Stagger>
          <Stagger delay={200}>
            <Text style={[styles.title, { color: theme.ink.primary }]}>
              {mode === "signup" ? "Create your capsule." : "Welcome back."}
            </Text>
          </Stagger>
          <Stagger delay={320}>
            <Text style={[styles.subtitle, { color: theme.ink.muted }]}>
              Memories stay private until the day you choose.
            </Text>
          </Stagger>

          <Stagger delay={440} style={{ marginTop: 32 }}>
            <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
          </Stagger>

          <Stagger delay={560} style={styles.fields}>
            <TextField
              label={mode === "signup" ? "EMAIL" : "EMAIL OR USERNAME"}
              icon={mode === "signup" ? AtSign : UserRound}
              placeholder={mode === "signup" ? "you@somewhere.com" : "rithik"}
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
                <TextField label="USERNAME" icon={AtSign} placeholder="future_you" autoCapitalize="none" value={username} onChangeText={setUsername} />
                <TextField label="DISPLAY NAME" icon={UserRound} placeholder="How friends find you" value={displayName} onChangeText={setDisplayName} />
              </>
            ) : null}
          </Stagger>

          <Stagger delay={680} style={styles.cta}>
            <PrimaryButton onPress={submit} loading={loading}>
              {mode === "signup" ? "Create account" : "Sign in"}
            </PrimaryButton>
          </Stagger>

          {mode === "login" ? (
            <Stagger delay={780}>
              <AnimatedPressable
                onPress={fillTestAccount}
                style={[styles.testHint, { borderColor: theme.line.soft, backgroundColor: theme.bg.surface }]}
              >
                <Text style={[styles.testHintText, { color: theme.ink.muted }]}>
                  Demo · Rithik <Text style={{ color: theme.ink.faint }}>/</Text> mypassword123
                </Text>
              </AnimatedPressable>
            </Stagger>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 28, paddingTop: 40, justifyContent: "center" },
  eyebrow: { ...type.micro, letterSpacing: 3 },
  title: { ...type.hero, fontSize: 36, marginTop: 14 },
  subtitle: { ...type.body, marginTop: 8 },
  fields: { marginTop: 26, gap: 14 },
  cta: { marginTop: 26 },
  testHint: {
    marginTop: 20,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1
  },
  testHintText: { ...type.caption }
});
