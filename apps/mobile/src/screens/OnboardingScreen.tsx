import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useTheme } from "../design/ThemeProvider";
import { motion, radii, type } from "../design/themes";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const insets = useSafeAreaInsets();
  const { theme, shadows } = useTheme();

  const drift = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: motion.durations.cinematic,
      easing: Easing.bezier(...motion.ease),
      useNativeDriver: true
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 5400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 5400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [fadeIn, drift]);

  const cardLift = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const cardTilt = drift.interpolate({ inputRange: [0, 1], outputRange: ["-0.8deg", "0.8deg"] });

  return (
    <Screen edges={["left", "right"]}>
      <View style={[styles.top, { paddingTop: insets.top + 26 }]}>
        <Animated.Text
          style={[
            styles.wordmark,
            {
              color: theme.ink.muted,
              opacity: fadeIn,
              transform: [
                {
                  translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] })
                }
              ]
            }
          ]}
        >
          TIME CAPSULE
        </Animated.Text>
      </View>

      <View style={styles.stage}>
        {/* Three stacked cards — bottom is dark plate, middle is paper, top is the marble title card */}
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: fadeIn,
              transform: [
                {
                  translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [40, 0] })
                },
                { scale: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }
              ]
            }
          ]}
        >
          <View
            style={[
              styles.cardBack,
              {
                backgroundColor: theme.bg.inverse,
                transform: [{ rotate: "-8deg" }, { translateX: 16 }, { translateY: 22 }]
              }
            ]}
          />
          <View
            style={[
              styles.cardMid,
              {
                backgroundColor: theme.bg.surface,
                borderColor: theme.line.soft,
                transform: [{ rotate: "4deg" }, { translateX: -10 }, { translateY: 12 }]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.cardFront,
              shadows.card,
              {
                backgroundColor: theme.bg.elevated,
                borderColor: theme.line.soft,
                transform: [{ rotate: cardTilt }, { translateY: cardLift }]
              }
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.accent.gold }]}>EST. 2026</Text>
            <Text style={[styles.cardTitle, { color: theme.ink.primary }]}>Memories,{"\n"}for later.</Text>
            <View style={[styles.cardRule, { backgroundColor: theme.accent.gold }]} />
            <Text style={[styles.cardCaption, { color: theme.ink.muted }]}>
              Seal a moment. Open it on the date you choose.
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.bottom,
          {
            paddingBottom: insets.bottom + 32,
            opacity: fadeIn,
            transform: [
              {
                translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
              }
            ]
          }
        ]}
      >
        <Text style={[styles.tagline, { color: theme.ink.primary }]}>
          A quieter way to keep what matters.
        </Text>
        <Text style={[styles.subtagline, { color: theme.ink.muted }]}>
          Photos, voice notes, and a letter to future-you — all sealed until the day you decide to look back.
        </Text>
        <View style={{ marginTop: 22 }}>
          <PrimaryButton onPress={() => navigation.navigate("Auth")} icon={ArrowRight}>
            Begin
          </PrimaryButton>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 28 },
  wordmark: { ...type.micro, letterSpacing: 4.2 },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardWrap: { width: 220, height: 280, alignItems: "center", justifyContent: "center" },
  cardBack: {
    position: "absolute",
    width: 168,
    height: 220,
    borderRadius: radii.md,
    opacity: 0.22
  },
  cardMid: {
    position: "absolute",
    width: 178,
    height: 232,
    borderRadius: radii.md,
    borderWidth: 1,
    opacity: 0.55
  },
  cardFront: {
    width: 190,
    height: 250,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  cardLabel: { ...type.micro, letterSpacing: 2.6, fontWeight: "800" },
  cardTitle: { ...type.hero, textAlign: "center", fontSize: 26, lineHeight: 30 },
  cardRule: { width: 28, height: 1, opacity: 0.6, marginVertical: 8 },
  cardCaption: { ...type.caption, textAlign: "center", fontStyle: "italic", paddingHorizontal: 6 },
  bottom: { paddingHorizontal: 28 },
  tagline: { ...type.title, fontSize: 28, lineHeight: 34, maxWidth: 340 },
  subtagline: { ...type.body, marginTop: 12, maxWidth: 380, lineHeight: 22 }
});
