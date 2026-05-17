import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, UserMinus, UserPlus, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const response = await api<{ friends: Friend[] }>("/friends");
      setFriends(response.friends);
    } catch {
      setFriends([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!pending.trim()) return;
    setAdding(true);
    try {
      await api("/friends", { method: "POST", body: JSON.stringify({ usernameOrEmail: pending.trim() }) });
      setPending("");
      await load();
    } catch (error) {
      Alert.alert("Could not add friend", error instanceof Error ? error.message : "Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(friend: Friend) {
    Alert.alert(`Remove ${friend.displayName}?`, "You can add them back any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/friends/${friend.id}`, { method: "DELETE" });
            await load();
          } catch (error) {
            Alert.alert("Could not remove", error instanceof Error ? error.message : "Try again.");
          }
        }
      }
    ]);
  }

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>FRIENDS</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Stagger delay={80}>
          <Text style={styles.title}>Who you share moments with.</Text>
        </Stagger>

        <Stagger delay={200}>
          <View style={styles.addRow}>
            <TextInput
              value={pending}
              onChangeText={setPending}
              placeholder="Username or email"
              placeholderTextColor={colors.mutedDim}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              selectionColor={colors.gold}
              returnKeyType="done"
              onSubmitEditing={add}
            />
            <View style={{ width: 110 }}>
              <PrimaryButton onPress={add} loading={adding} icon={UserPlus}>
                Add
              </PrimaryButton>
            </View>
          </View>
        </Stagger>

        <Stagger delay={320}>
          {friends.length === 0 ? (
            <Text style={styles.empty}>You haven't added anyone yet. Try `amal` or `ryan` in demo mode.</Text>
          ) : (
            <View style={styles.list}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.row}>
                  {friend.avatarUrl ? (
                    <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} contentFit="cover" transition={300} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <UserRound color={colors.muted} size={16} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{friend.displayName}</Text>
                    <Text style={styles.handle}>@{friend.username}</Text>
                  </View>
                  <AnimatedPressable onPress={() => remove(friend)} style={styles.removeBtn}>
                    <UserMinus color={colors.muted} size={14} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          )}
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
  addRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    color: colors.fog,
    ...type.body
  },
  empty: { ...type.body, color: colors.muted, textAlign: "center", marginTop: 28 },
  list: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.dusk },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  name: { ...type.body, color: colors.fog, fontWeight: "600" },
  handle: { ...type.caption, color: colors.muted },
  removeBtn: { padding: 8 }
});
