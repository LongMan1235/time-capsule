import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { RotateCcw, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attachDemoMedia } from "../api/demo";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { colors, radii, type } from "../design/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function CameraCaptureScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "CameraCapture">) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [taking, setTaking] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <Screen><View style={styles.center} /></Screen>;
  }

  if (!permission.granted) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <View style={styles.permission}>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            Allow camera so you can capture memories directly into this capsule.
          </Text>
          <PrimaryButton onPress={requestPermission}>Allow camera</PrimaryButton>
          <PrimaryButton onPress={() => navigation.goBack()} variant="ghost">
            Cancel
          </PrimaryButton>
        </View>
      </Screen>
    );
  }

  async function capture() {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!result?.uri) throw new Error("No image was captured.");
      await attachDemoMedia(route.params.eventId, {
        id: `media-${Date.now().toString(36)}`,
        url: result.uri,
        kind: "PHOTO",
        capturedAt: new Date().toISOString()
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not capture", error instanceof Error ? error.message : "Try again.");
    } finally {
      setTaking(false);
    }
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      <View pointerEvents="box-none" style={[styles.topBar, { top: insets.top + 8 }]}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <X color={colors.fog} size={20} />
        </AnimatedPressable>
        <Text style={styles.title}>{route.params.title}</Text>
        <AnimatedPressable onPress={() => setFacing(facing === "back" ? "front" : "back")} style={styles.iconButton}>
          <RotateCcw color={colors.fog} size={18} />
        </AnimatedPressable>
      </View>

      <View pointerEvents="box-none" style={[styles.controls, { bottom: insets.bottom + 24 }]}>
        <AnimatedPressable onPress={capture} disabled={taking}>
          <View style={styles.shutterOuter}>
            <View style={[styles.shutterInner, taking ? styles.shutterTaking : null]} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  topBar: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { ...type.subtitle, color: colors.fog, flex: 1, textAlign: "center" },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11,10,16,0.55)",
    borderWidth: 1,
    borderColor: colors.line
  },
  controls: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: colors.fog,
    alignItems: "center",
    justifyContent: "center"
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.fog
  },
  shutterTaking: { backgroundColor: colors.gold },
  permission: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  permTitle: { ...type.title, color: colors.fog },
  permBody: { ...type.body, color: colors.muted, marginBottom: 8 },
  center: { flex: 1, backgroundColor: "#000" }
});
