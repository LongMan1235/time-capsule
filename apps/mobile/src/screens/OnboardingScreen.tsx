import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const insets = useSafeAreaInsets();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [float]);

  const cardFloat = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const cardRotate = float.interpolate({ inputRange: [0, 1], outputRange: ["-1.5deg", "0.5deg"] });

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.top, { paddingTop: insets.top + 24 }]}>
        <Stagger delay={120} translate={-6}>
          <Text style={styles.brand}>TIME CAPSULE</Text>
        </Stagger>
      </View>

      <View style={styles.middle}>
        <Stagger delay={260}>
          <View style={styles.stack}>
            <Animated.View
              style={[
                styles.polaroid,
                styles.polaroidBack,
                { transform: [{ rotate: "-7deg" }] }
              ]}
            />
            <Animated.View
              style={[
                styles.polaroid,
                styles.polaroidFront,
                { transform: [{ rotate: cardRotate }, { translateY: cardFloat }] }
              ]}
            >
              <View style={styles.polaroidImage} />
              <Text style={styles.polaroidCaption}>seal it · open later</Text>
            </Animated.View>
          </View>
        </Stagger>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <Stagger delay={420}>
          <Text style={styles.title}>A scrapbook{"\n"}for future-you.</Text>
        </Stagger>
        <Stagger delay={580}>
          <Text style={styles.body}>
            Lock photos, voice notes, and short writings into a capsule that opens on the date you choose.
          </Text>
        </Stagger>
        <Stagger delay={760} style={{ marginTop: 8 }}>
          <PrimaryButton onPress={() => navigation.navigate("Auth")} icon={ArrowRight}>
            Begin
          </PrimaryButton>
        </Stagger>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 24 },
  brand: { ...type.micro, color: colors.muted, letterSpacing: 3.2 },
  middle: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  stack: { width: 220, height: 260, alignItems: "center", justifyContent: "center" },
  polaroid: {
    position: "absolute",
    width: 168,
    height: 196,
    backgroundColor: colors.fog,
    borderRadius: radii.xs,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }
  },
  polaroidBack: { opacity: 0.25 },
  polaroidFront: {},
  polaroidImage: {
    flex: 1,
    backgroundColor: "#2A2336",
    borderRadius: 4
  },
  polaroidCaption: {
    ...type.caption,
    color: colors.ink,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
    fontStyle: "italic"
  },
  bottom: { paddingHorizontal: 24, gap: 14 },
  title: { ...type.display, color: colors.fog },
  body: { ...type.body, color: colors.muted, maxWidth: 380 }
});
