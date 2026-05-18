import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Bell, CalendarHeart, Flame, Lock, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { IconComponent } from "../design/icons";
import { defaultPrefs, ensurePermissions, loadPrefs, savePrefs, sendLocalNow, type NotificationPrefs } from "../api/notifications";

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    loadPrefs().then(setPrefs);
    ensurePermissions().then(setGranted);
  }, []);

  async function update<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    if (value && !granted) {
      const ok = await ensurePermissions();
      setGranted(ok);
      if (!ok) {
        Alert.alert("Notifications off", "Allow notifications in system settings to enable this.");
        return;
      }
    }
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await savePrefs(next);
  }

  async function testWeekly() {
    const ok = await ensurePermissions();
    if (!ok) {
      Alert.alert("Notifications off", "Allow notifications in system settings to test.");
      return;
    }
    await sendLocalNow("Sunday capture", "What was the best 30 seconds of your week?");
  }

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stagger delay={80}>
          <Text style={styles.title}>What we should ping you about.</Text>
        </Stagger>

        {!granted ? (
          <Stagger delay={200}>
            <View style={styles.permission}>
              <Bell color={colors.gold} size={14} />
              <Text style={styles.permissionText}>
                System notifications are off. Toggle anything below and we'll request permission.
              </Text>
            </View>
          </Stagger>
        ) : null}

        <Stagger delay={300}>
          <View style={styles.group}>
            <Row Icon={Send} title="Weekly prompt" body="Sunday 7pm: 'What was the best 30 seconds of your week?'" value={prefs.weeklyPrompt} onChange={(v) => update("weeklyPrompt", v)} />
            <Divider />
            <Row Icon={CalendarHeart} title="On this day" body="A daily ping with a memory from a past year." value={prefs.onThisDay} onChange={(v) => update("onThisDay", v)} />
            <Divider />
            <Row Icon={Lock} title="Capsule unlocks" body="Notify when a sealed capsule opens." value={prefs.capsuleUnlocks} onChange={(v) => update("capsuleUnlocks", v)} />
            <Divider />
            <Row Icon={Flame} title="Anniversaries" body="Reminders as a sealed capsule's unlock day approaches." value={prefs.anniversaries} onChange={(v) => update("anniversaries", v)} />
          </View>
        </Stagger>

        <Stagger delay={420} style={{ marginTop: 16 }}>
          <PrimaryButton onPress={testWeekly} variant="ghost">
            Send a test ping now
          </PrimaryButton>
        </Stagger>
      </ScrollView>
    </Screen>
  );
}

function Row({ Icon, title, body, value, onChange }: { Icon: IconComponent; title: string; body: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.actionIcon}>
        <Icon color={colors.fog} size={14} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "rgba(255,255,255,0.10)", true: colors.gold }} thumbColor={colors.fog} />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eyebrow: { ...type.micro, color: colors.muted },
  content: { padding: 24, gap: 16, paddingBottom: 140 },
  title: { ...type.hero, color: colors.fog },
  permission: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(232,194,107,0.30)", backgroundColor: "rgba(232,194,107,0.06)" },
  permissionText: { ...type.caption, color: colors.fog, flex: 1 },
  group: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  actionIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  rowTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  rowBody: { ...type.caption, color: colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 56 }
});
