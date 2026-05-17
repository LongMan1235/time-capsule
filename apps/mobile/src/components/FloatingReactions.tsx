import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

export interface FloatingReaction {
  id: string;
  emoji: string;
  fromName?: string;
}

interface Props {
  feed: FloatingReaction[];
}

const LIFE_MS = 2800;

export function FloatingReactions({ feed }: Props) {
  const [active, setActive] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (feed.length === 0) return;
    const latest = feed[feed.length - 1];
    setActive((prev) => [...prev, latest]);
    const timeout = setTimeout(() => {
      setActive((prev) => prev.filter((r) => r.id !== latest.id));
    }, LIFE_MS);
    return () => clearTimeout(timeout);
  }, [feed]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {active.map((reaction) => (
        <FloatingBubble key={reaction.id} reaction={reaction} />
      ))}
    </View>
  );
}

function FloatingBubble({ reaction }: { reaction: FloatingReaction }) {
  const rise = useRef(new Animated.Value(0)).current;
  const driftX = (Math.random() - 0.5) * 80;
  const startX = 40 + Math.random() * 180;

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: LIFE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [rise]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [0, -240] });
  const translateX = rise.interpolate({ inputRange: [0, 1], outputRange: [0, driftX] });
  const opacity = rise.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale = rise.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.05, 0.95] });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          right: startX,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }]
        }
      ]}
    >
      <Text style={styles.emoji}>{reaction.emoji}</Text>
      {reaction.fromName ? <Text style={styles.name}>{reaction.fromName}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: "absolute", bottom: 80, alignItems: "center" },
  emoji: { fontSize: 32 },
  name: { color: "#F5F1EA", fontSize: 10, marginTop: 2, opacity: 0.78, fontWeight: "600" }
});
