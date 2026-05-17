import { Image } from "expo-image";
import { ArrowLeft, ChevronRight, Flame, Gift, ImageIcon, Lock, Pencil, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../store/session";

interface Stats {
  streakWeeks: number;
  eventsOwned: number;
  memoriesAdded: number;
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const [stats, setStats] = useState<Stats | undefined>();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");

  useEffect(() => {
    api<Stats>("/me/stats").then(setStats).catch(() => undefined);
  }, []);

  async function save() {
    if (!user) return;
    await setUser({ ...user, displayName: displayName.trim() || user.username });
    setEditing(false);
    Alert.alert("Saved", "Profile updated.");
  }

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>PROFILE</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stagger delay={80}>
          <View style={styles.identity}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" transition={300} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]} />
            )}
            <Text style={styles.name}>{user?.displayName}</Text>
            <Text style={styles.handle}>@{user?.username}</Text>
          </View>
        </Stagger>

        <Stagger delay={200}>
          <View style={styles.statRow}>
            <StatTile Icon={Flame} value={stats?.streakWeeks ?? 0} label={stats?.streakWeeks === 1 ? "WEEK" : "WEEKS"} accent />
            <StatTile Icon={Lock} value={stats?.eventsOwned ?? 0} label="CAPSULES" />
            <StatTile Icon={ImageIcon} value={stats?.memoriesAdded ?? 0} label="MEMORIES" />
          </View>
        </Stagger>

        <Stagger delay={300}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DISPLAY NAME</Text>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.input}
                  selectionColor={colors.gold}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton onPress={save}>Save</PrimaryButton>
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton onPress={() => { setEditing(false); setDisplayName(user?.displayName ?? ""); }} variant="ghost">
                      Cancel
                    </PrimaryButton>
                  </View>
                </View>
              </View>
            ) : (
              <AnimatedPressable onPress={() => setEditing(true)} style={styles.row}>
                <Text style={styles.rowValue}>{user?.displayName}</Text>
                <Pencil color={colors.muted} size={14} />
              </AnimatedPressable>
            )}
          </View>
        </Stagger>

        <Stagger delay={380}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EMAIL</Text>
            <View style={styles.row}>
              <Text style={styles.rowValue}>{user?.email}</Text>
            </View>
          </View>
        </Stagger>

        <Stagger delay={460}>
          <View style={styles.streakCard}>
            <Flame color={colors.gold} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>
                {stats?.streakWeeks ? `${stats.streakWeeks}-week streak` : "Start a streak"}
              </Text>
              <Text style={styles.streakBody}>
                Add a memory this week to keep your streak going.
              </Text>
            </View>
          </View>
        </Stagger>

        <Stagger delay={540}>
          <View style={styles.menuGroup}>
            <ProfileMenuRow Icon={Users} title="Friends" onPress={() => navigation.navigate("Friends")} />
            <Divider />
            <ProfileMenuRow Icon={ImageIcon} title="Friend feed" onPress={() => navigation.navigate("FriendFeed")} />
            <Divider />
            <ProfileMenuRow Icon={Gift} title="Gift a capsule" onPress={() => navigation.navigate("GiftCapsule")} />
          </View>
        </Stagger>
      </ScrollView>
    </Screen>
  );
}

function ProfileMenuRow({ Icon, title, onPress }: { Icon: React.ComponentType<{ color?: string; size?: number }>; title: string; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <Icon color={colors.fog} size={14} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <ChevronRight color={colors.muted} size={14} />
    </AnimatedPressable>
  );
}

function Divider() {
  return <View style={styles.menuDivider} />;
}

function StatTile({
  Icon,
  value,
  label,
  accent = false
}: {
  Icon: React.ComponentType<{ color?: string; size?: number }>;
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.stat, accent ? styles.statAccent : null]}>
      <Icon color={accent ? colors.gold : colors.muted} size={16} />
      <Text style={[styles.statValue, accent ? styles.statValueAccent : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eyebrow: { ...type.micro, color: colors.muted },
  content: { padding: 24, gap: 22, paddingBottom: 140 },
  identity: { alignItems: "center", gap: 6 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.dusk },
  avatarFallback: { borderWidth: 1, borderColor: colors.line },
  name: { ...type.title, color: colors.fog, marginTop: 8 },
  handle: { ...type.caption, color: colors.muted },
  statRow: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, padding: 14, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, gap: 6, alignItems: "flex-start" },
  statAccent: { borderColor: "rgba(232,194,107,0.30)", backgroundColor: "rgba(232,194,107,0.06)" },
  statValue: { ...type.hero, color: colors.fog, fontVariant: ["tabular-nums"] },
  statValueAccent: { color: colors.gold },
  statLabel: { ...type.micro, color: colors.muted },
  section: { gap: 8 },
  sectionLabel: { ...type.micro, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  rowValue: { ...type.body, color: colors.fog, fontWeight: "600" },
  input: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.card, color: colors.fog, ...type.body },
  editRow: { gap: 10 },
  editActions: { flexDirection: "row", gap: 10 },
  streakCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(232,194,107,0.30)", backgroundColor: "rgba(232,194,107,0.06)" },
  streakTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  streakBody: { ...type.caption, color: colors.muted, marginTop: 2 },
  menuGroup: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, overflow: "hidden", marginTop: 4 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  menuIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  menuTitle: { ...type.body, color: colors.fog, fontWeight: "600", flex: 1 },
  menuDivider: { height: 1, backgroundColor: colors.line, marginLeft: 56 }
});
