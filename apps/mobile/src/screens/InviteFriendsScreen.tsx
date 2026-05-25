import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Check, Copy, Link, Send, UserRound, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Animated, Easing, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export function InviteFriendsScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "InviteFriends">) {
  const insets = useSafeAreaInsets();
  const { eventId, title, openOnDone = true } = route.params;
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareLink, setShareLink] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<{ friends: Friend[] }>("/friends").then((r) => setFriends(r.friends)).catch(() => setFriends([]));
    api<{ url: string }>(`/events/${eventId}/share`, { method: "POST" })
      .then((r) => setShareLink(r.url))
      .catch(() => undefined);
  }, [eventId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    Haptics.selectionAsync().catch(() => undefined);
  }

  async function copyLink() {
    if (!shareLink) return;
    await Clipboard.setStringAsync(shareLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareViaSheet() {
    if (!shareLink) return;
    try {
      await Share.share({ message: `Join my "${title}" capsule\n${shareLink}`, url: shareLink });
    } catch {
      // user cancelled
    }
  }

  async function send() {
    setSending(true);
    try {
      if (selected.size > 0) {
        await api(`/events/${eventId}/invite`, {
          method: "POST",
          body: JSON.stringify({ userIds: Array.from(selected) })
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
      finish();
    } catch (error) {
      Alert.alert("Could not send invites", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSending(false);
    }
  }

  function finish() {
    if (openOnDone) navigation.replace("EventDetail", { eventId });
    else navigation.goBack();
  }

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <X color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>INVITE</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <Stagger delay={80}>
          <Text style={styles.title}>Who's in this one?</Text>
          <Text style={styles.subtitle}>“{title}” — contributors can add memories until the collection window closes.</Text>
        </Stagger>

        <Stagger delay={220}>
          <View style={styles.linkCard}>
            <View style={styles.linkRow}>
              <Link color={colors.gold} size={14} />
              <Text style={styles.linkLabel}>SHARE LINK</Text>
            </View>
            <Text style={styles.linkUrl} numberOfLines={1}>{shareLink ?? "Generating…"}</Text>
            <View style={styles.linkActions}>
              <View style={{ flex: 1 }}>
                <PrimaryButton onPress={copyLink} icon={copied ? Check : Copy} variant="ghost" disabled={!shareLink}>
                  {copied ? "Copied" : "Copy"}
                </PrimaryButton>
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton onPress={shareViaSheet} icon={Send} disabled={!shareLink}>
                  Share
                </PrimaryButton>
              </View>
            </View>
          </View>
        </Stagger>

        <Stagger delay={360}>
          <Text style={styles.sectionLabel}>FRIENDS</Text>
          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Text style={styles.emptyText}>You haven't added any friends yet. Use the share link instead.</Text>
            </View>
          ) : (
            <View style={styles.friendList}>
              {friends.map((friend) => {
                const checked = selected.has(friend.id);
                return (
                  <AnimatedPressable
                    key={friend.id}
                    onPress={() => toggle(friend.id)}
                    style={[styles.friendRow, checked ? styles.friendRowActive : null]}
                  >
                    {friend.avatarUrl ? (
                      <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} contentFit="cover" transition={250} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <UserRound color={colors.muted} size={16} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.friendName}>{friend.displayName}</Text>
                      <Text style={styles.friendHandle}>@{friend.username}</Text>
                    </View>
                    <View style={[styles.checkbox, checked ? styles.checkboxActive : null]}>
                      {checked ? <Check color={colors.ink} size={14} /> : null}
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          )}
        </Stagger>

        <Stagger delay={500} style={{ marginTop: 16, gap: 10 }}>
          <PrimaryButton onPress={send} loading={sending}>
            {selected.size > 0 ? `Invite ${selected.size}` : "Continue"}
          </PrimaryButton>
          <PrimaryButton onPress={finish} variant="ghost">
            Skip for now
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
  content: { padding: 24, gap: 22 },
  title: { ...type.hero, color: colors.fog },
  subtitle: { ...type.body, color: colors.muted, marginTop: 8 },
  linkCard: { borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(232,194,107,0.30)", backgroundColor: "rgba(232,194,107,0.06)", padding: 14, gap: 10 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  linkLabel: { ...type.micro, color: colors.gold, letterSpacing: 1.4 },
  linkUrl: { ...type.body, color: colors.fog, fontWeight: "600" },
  linkActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  sectionLabel: { ...type.micro, color: colors.muted, marginBottom: 8 },
  emptyFriends: { padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: "center" },
  emptyText: { ...type.body, color: colors.muted, textAlign: "center" },
  friendList: { gap: 8 },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  friendRowActive: { borderColor: colors.gold, backgroundColor: "rgba(232,194,107,0.08)" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.dusk },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  friendName: { ...type.body, color: colors.fog, fontWeight: "600" },
  friendHandle: { ...type.caption, color: colors.muted },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: colors.gold, borderColor: colors.gold }
});
