import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

const hero = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80";

export function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const insets = useSafeAreaInsets();
  const heroZoom = useRef(new Animated.Value(0)).current;
  const heroFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(heroZoom, { toValue: 1, duration: 14_000, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [heroFade, heroZoom]);

  const scale = heroZoom.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.0] });

  return (
    <Screen edges={[]} ambient={false} grain={false}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: heroFade }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
          <Image source={{ uri: hero }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        </Animated.View>
        <LinearGradient
          colors={["rgba(0,0,0,0.20)", "rgba(0,0,0,0.45)", "rgba(11,10,16,0.96)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={[styles.top, { paddingTop: insets.top + 16 }]}>
        <Stagger delay={120} translate={-8}>
          <Text style={styles.brand}>TIME CAPSULE</Text>
        </Stagger>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <Stagger delay={300}>
          <Text style={styles.title}>Save the night.{"\n"}Open it when it matters.</Text>
        </Stagger>
        <Stagger delay={520}>
          <Text style={styles.body}>
            Lock photos, voice notes, and captions into a capsule that opens on a future date you choose.
          </Text>
        </Stagger>
        <Stagger delay={720}>
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
  brand: { ...type.micro, color: colors.fog, letterSpacing: 3.2, opacity: 0.85 },
  bottom: { paddingHorizontal: 24, paddingTop: 24, position: "absolute", left: 0, right: 0, bottom: 0, gap: 16 },
  title: { ...type.display, color: colors.fog },
  body: { ...type.body, color: colors.bone, opacity: 0.78, maxWidth: 380 }
});
