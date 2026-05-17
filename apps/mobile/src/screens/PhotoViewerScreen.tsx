import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { ArrowLeft, MessageCircle, MoreHorizontal, Send } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MediaComment, MediaDetail, MediaReaction } from "@time-capsule/shared";
import { api } from "../api/client";
import { REACTION_EMOJIS } from "../api/demoData";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useSessionStore } from "../store/session";

interface EventBundle {
  id: string;
  title: string;
  media: MediaDetail[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function PhotoViewerScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "PhotoViewer">) {
  const insets = useSafeAreaInsets();
  const user = useSessionStore((state) => state.user);
  const myUserId = user?.id ?? "user-rithik";
  const [bundle, setBundle] = useState<EventBundle>();
  const [index, setIndex] = useState(route.params.startIndex ?? 0);
  const [pendingComment, setPendingComment] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<MediaDetail>>(null);

  useEffect(() => {
    api<{ event: EventBundle }>(`/events/${route.params.eventId}`)
      .then((response) => setBundle(response.event))
      .catch((err) => Alert.alert("Could not load", err instanceof Error ? err.message : "Try again."));
  }, [route.params.eventId]);

  const current = bundle?.media[index];

  async function toggleReaction(emoji: string) {
    if (!current) return;
    try {
      const response = await api<{ reactions: MediaReaction[] }>(`/media/${current.id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji })
      });
      setBundle((prev) => {
        if (!prev) return prev;
        const nextMedia = prev.media.map((m) => (m.id === current.id ? { ...m, reactions: response.reactions } : m));
        return { ...prev, media: nextMedia };
      });
    } catch (error) {
      Alert.alert("Could not react", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function setAsCover() {
    if (!current) return;
    try {
      await api(`/events/${route.params.eventId}/cover`, { method: "POST", body: JSON.stringify({ mediaId: current.id }) });
      Alert.alert("Cover updated", "This memory is now the capsule cover.");
    } catch (error) {
      Alert.alert("Could not set cover", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function deleteCurrent() {
    if (!current) return;
    Alert.alert(
      "Delete memory?",
      "This removes the photo, its comments, and its reactions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/media/${current.id}`, { method: "DELETE" });
              setBundle((prev) => {
                if (!prev) return prev;
                const nextMedia = prev.media.filter((m) => m.id !== current.id);
                return { ...prev, media: nextMedia };
              });
              if (index >= (bundle?.media.length ?? 1) - 1) {
                setIndex(Math.max(0, index - 1));
              }
            } catch (error) {
              Alert.alert("Could not delete", error instanceof Error ? error.message : "Try again.");
            }
          }
        }
      ]
    );
  }

  function openActions() {
    if (!current) return;
    const isMine = current.addedBy.id === myUserId;
    const buttons = ["Set as capsule cover", ...(isMine ? ["Delete memory"] : []), "Cancel"];
    const destructiveIdx = isMine ? 1 : -1;
    const cancelIdx = buttons.length - 1;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: buttons, destructiveButtonIndex: destructiveIdx, cancelButtonIndex: cancelIdx, userInterfaceStyle: "dark" },
        (i) => {
          if (i === 0) setAsCover();
          else if (i === 1 && isMine) deleteCurrent();
        }
      );
    } else {
      Alert.alert(
        "Memory actions",
        undefined,
        [
          { text: "Set as cover", onPress: setAsCover },
          ...(isMine ? [{ text: "Delete memory", style: "destructive" as const, onPress: deleteCurrent }] : []),
          { text: "Cancel", style: "cancel" as const }
        ]
      );
    }
  }

  async function sendComment() {
    if (!current || !pendingComment.trim()) return;
    setSending(true);
    try {
      const response = await api<{ comment: MediaComment }>(`/media/${current.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: pendingComment })
      });
      setBundle((prev) => {
        if (!prev) return prev;
        const nextMedia = prev.media.map((m) =>
          m.id === current.id ? { ...m, comments: [...m.comments, response.comment] } : m
        );
        return { ...prev, media: nextMedia };
      });
      setPendingComment("");
    } catch (error) {
      Alert.alert("Could not comment", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSending(false);
    }
  }

  if (!bundle) {
    return (
      <Screen tone="paper">
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.gold} /></View>
      </Screen>
    );
  }

  return (
    <Screen tone="paper" edges={[]} texture={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <ArrowLeft color={colors.fog} size={20} />
          </AnimatedPressable>
          <View style={styles.topCenter}>
            <Text style={styles.titleSmall} numberOfLines={1}>{bundle.title}</Text>
            <Text style={styles.counter}>{index + 1} / {bundle.media.length}</Text>
          </View>
          <AnimatedPressable onPress={openActions} style={styles.iconButton}>
            <MoreHorizontal color={colors.fog} size={20} />
          </AnimatedPressable>
        </View>

        <FlatList
          ref={listRef}
          data={bundle.media}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={route.params.startIndex ?? 0}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            if (nextIndex !== index) setIndex(nextIndex);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={1} onLongPress={openActions} style={styles.slide}>
              <Image source={{ uri: item.url }} style={styles.image} contentFit="contain" transition={250} />
            </TouchableOpacity>
          )}
        />

        {current ? (
          <View style={styles.bottomSheet}>
            <View style={styles.captionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.captionAuthor}>{current.addedBy.displayName}</Text>
                {current.caption ? <Text style={styles.caption}>{current.caption}</Text> : null}
              </View>
              {current.capturedAt ? (
                <Text style={styles.metaTime}>{formatRelative(current.capturedAt)}</Text>
              ) : null}
            </View>

            <View style={styles.reactionRow}>
              {REACTION_EMOJIS.map((emoji) => {
                const found = current.reactions.find((r) => r.emoji === emoji);
                const mine = found?.userIds.includes(myUserId) ?? false;
                return (
                  <AnimatedPressable
                    key={emoji}
                    onPress={() => toggleReaction(emoji)}
                    style={[styles.reactionChip, mine ? styles.reactionChipActive : null]}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {found && found.count > 0 ? (
                      <Text style={[styles.reactionCount, mine ? styles.reactionCountActive : null]}>
                        {found.count}
                      </Text>
                    ) : null}
                  </AnimatedPressable>
                );
              })}
            </View>

            <CommentsList comments={current.comments} />

            <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <TextInput
                value={pendingComment}
                onChangeText={setPendingComment}
                placeholder="Leave a comment…"
                placeholderTextColor={colors.mutedDim}
                style={styles.composerInput}
                selectionColor={colors.gold}
                multiline
                onSubmitEditing={sendComment}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={sendComment}
                disabled={!pendingComment.trim() || sending}
                style={[
                  styles.sendButton,
                  pendingComment.trim() && !sending ? styles.sendButtonReady : null
                ]}
              >
                <Send color={pendingComment.trim() && !sending ? colors.ink : colors.muted} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function CommentsList({ comments }: { comments: MediaComment[] }) {
  if (comments.length === 0) {
    return (
      <View style={styles.commentsEmpty}>
        <MessageCircle color={colors.muted} size={14} />
        <Text style={styles.commentsEmptyText}>Be the first to leave a comment.</Text>
      </View>
    );
  }
  return (
    <View style={styles.commentsList}>
      {comments.slice(-3).map((comment) => (
        <View key={comment.id} style={styles.commentRow}>
          <Text style={styles.commentAuthor}>{comment.author.displayName}</Text>
          <Text style={styles.commentBody}>{renderMentions(comment.body)}</Text>
        </View>
      ))}
      {comments.length > 3 ? (
        <Text style={styles.commentsMore}>+{comments.length - 3} more</Text>
      ) : null}
    </View>
  );
}

function renderMentions(body: string) {
  const parts = body.split(/(\s+)/);
  return parts.map((part, idx) => {
    if (part.startsWith("@") && part.length > 1) {
      return <Text key={idx} style={{ color: colors.gold, fontWeight: "700" }}>{part}</Text>;
    }
    return <Text key={idx}>{part}</Text>;
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = diff / 3_600_000;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  topCenter: { flex: 1, alignItems: "center", gap: 2 },
  titleSmall: { ...type.body, color: colors.fog, fontWeight: "600" },
  counter: { ...type.micro, color: colors.muted },
  slide: { width: SCREEN_WIDTH, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  image: { width: SCREEN_WIDTH - 32, height: SCREEN_WIDTH * 1.05, borderRadius: radii.md, backgroundColor: colors.dusk },
  bottomSheet: {
    backgroundColor: colors.cardElevated,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12
  },
  captionRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  captionAuthor: { ...type.body, color: colors.fog, fontWeight: "600" },
  caption: { ...type.caption, color: colors.muted, marginTop: 2 },
  metaTime: { ...type.micro, color: colors.muted, letterSpacing: 1 },
  reactionRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  reactionChipActive: { borderColor: colors.gold, backgroundColor: "rgba(232,194,107,0.12)" },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { ...type.caption, color: colors.muted, fontWeight: "600" },
  reactionCountActive: { color: colors.gold },
  commentsEmpty: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  commentsEmptyText: { ...type.caption, color: colors.muted },
  commentsList: { gap: 8 },
  commentRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  commentAuthor: { ...type.caption, color: colors.fog, fontWeight: "700" },
  commentBody: { ...type.caption, color: colors.muted, flex: 1, lineHeight: 18 },
  commentsMore: { ...type.micro, color: colors.muted, letterSpacing: 1 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 6
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    color: colors.fog,
    ...type.body
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  sendButtonReady: { backgroundColor: colors.gold, borderColor: colors.gold }
});
