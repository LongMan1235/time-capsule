import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import { Mic, Pause, Play, Square, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attachDemoMedia } from "../api/demo";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Phase = "idle" | "recording" | "review";

export function VoiceNoteScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "VoiceNote">) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [uri, setUri] = useState<string | undefined>();
  const recordingRef = useRef<Audio.Recording | undefined>(undefined);
  const soundRef = useRef<Audio.Sound | undefined>(undefined);
  const tickerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const pulse = useRef(new Animated.Value(0)).current;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (phase === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [phase, pulse]);

  useEffect(() => {
    return () => {
      tickerRef.current && clearInterval(tickerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
      soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Mic access needed", "Allow microphone to record voice notes.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setElapsed(0);
      setPhase("recording");
      tickerRef.current = setInterval(() => setElapsed((v) => v + 1), 1000);
    } catch (error) {
      Alert.alert("Could not record", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function stopRecording() {
    tickerRef.current && clearInterval(tickerRef.current);
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const url = recording.getURI();
      recordingRef.current = undefined;
      if (url) {
        setUri(url);
        setPhase("review");
      } else {
        setPhase("idle");
      }
    } catch (error) {
      Alert.alert("Recording failed", error instanceof Error ? error.message : "Try again.");
      setPhase("idle");
    }
  }

  async function playPreview() {
    if (!uri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = undefined;
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlaying(false);
      });
      await sound.playAsync();
    } catch (error) {
      Alert.alert("Playback failed", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function pausePreview() {
    try {
      await soundRef.current?.pauseAsync();
      setPlaying(false);
    } catch {
      // ignore
    }
  }

  async function save() {
    if (!uri) return;
    try {
      await attachDemoMedia(route.params.eventId, {
        id: `voice-${Date.now().toString(36)}`,
        url: uri,
        kind: "VOICE_NOTE",
        capturedAt: new Date().toISOString(),
        caption: `${elapsed}s voice note`
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Try again.");
    }
  }

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <Screen tone="paper" edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <X color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.eyebrow}>VOICE NOTE</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{route.params.title}</Text>
        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>

        <View style={styles.stage}>
          <Animated.View style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <View style={[styles.coreBtn, phase === "recording" ? styles.coreBtnActive : null]}>
            {phase === "recording" ? (
              <AnimatedPressable onPress={stopRecording}>
                <Square color={colors.ink} size={28} fill={colors.ink} />
              </AnimatedPressable>
            ) : phase === "review" ? (
              <AnimatedPressable onPress={playing ? pausePreview : playPreview}>
                {playing ? <Pause color={colors.ink} size={28} fill={colors.ink} /> : <Play color={colors.ink} size={28} fill={colors.ink} />}
              </AnimatedPressable>
            ) : (
              <AnimatedPressable onPress={startRecording}>
                <Mic color={colors.ink} size={28} />
              </AnimatedPressable>
            )}
          </View>
          <Text style={styles.hint}>
            {phase === "idle"
              ? "Tap to record"
              : phase === "recording"
                ? "Tap to stop"
                : playing
                  ? "Playing…"
                  : "Tap to preview"}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {phase === "review" ? (
          <>
            <PrimaryButton onPress={save}>Add to capsule</PrimaryButton>
            <PrimaryButton onPress={() => { setUri(undefined); setPhase("idle"); setElapsed(0); }} variant="ghost">
              Retake
            </PrimaryButton>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  eyebrow: { ...type.micro, color: colors.muted },
  body: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 12 },
  title: { ...type.subtitle, color: colors.fog, marginTop: 28 },
  timer: { ...type.numeric, color: colors.fog, fontSize: 64, marginTop: 12, fontVariant: ["tabular-nums"] },
  stage: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
  pulse: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: colors.gold },
  coreBtn: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", backgroundColor: colors.fog, borderWidth: 1, borderColor: colors.line },
  coreBtnActive: { backgroundColor: colors.gold },
  hint: { ...type.caption, color: colors.muted, marginTop: 12 },
  footer: { paddingHorizontal: 24, gap: 10 }
});
