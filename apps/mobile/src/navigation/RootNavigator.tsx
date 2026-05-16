import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { CalendarPlus, Map, Search, Settings, Sparkles } from "lucide-react-native";
import { useEffect, useRef, type ComponentType } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "../design/theme";
import type { IconComponent } from "../design/icons";
import { useSessionStore } from "../store/session";
import { AuthScreen } from "../screens/AuthScreen";
import { CameraCaptureScreen } from "../screens/CameraCaptureScreen";
import { CountdownScreen } from "../screens/CountdownScreen";
import { CreateEventScreen } from "../screens/CreateEventScreen";
import { EventDetailScreen } from "../screens/EventDetailScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { SearchScreen } from "../screens/SearchScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Tabs: undefined;
  EventDetail: { eventId: string };
  Countdown: { eventId: string; title: string; unlockAt: string; createdAt?: string };
  CreateEvent: undefined;
  CameraCapture: { eventId: string; title: string };
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const tabs: Array<{ name: string; component: ComponentType<any>; icon: IconComponent }> = [
  { name: "Home", component: HomeScreen, icon: Sparkles },
  { name: "Map", component: MapScreen, icon: Map },
  { name: "Create", component: CreateEventScreen, icon: CalendarPlus },
  { name: "Search", component: SearchScreen, icon: Search },
  { name: "Privacy", component: PrivacyScreen, icon: Settings }
];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom + 8, 16);

  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrap, { bottom: bottomOffset }]}>
      <View style={styles.tabBar}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,12,22,0.94)" }]} />
        )}
        <View style={styles.tabBarBorder} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const tab = tabs.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TabButton key={route.key} Icon={tab.icon} focused={focused} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function TabButton({
  Icon,
  focused,
  onPress
}: {
  Icon: IconComponent;
  focused: boolean;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: focused ? 1 : 0, useNativeDriver: true, friction: 8, tension: 140 }).start();
  }, [focused, progress]);

  const dotOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const dotScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Pressable onPress={onPress} style={styles.tabButton} hitSlop={10}>
      <Icon color={focused ? colors.fog : colors.muted} size={20} />
      <Animated.View style={[styles.activeDot, { opacity: dotOpacity, transform: [{ scale: dotScale }] }]} />
    </Pressable>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
    >
      {tabs.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token, hydrated, hydrate } = useSessionStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.ink } }}>
      {token ? (
        <>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Countdown" component={CountdownScreen} options={{ animation: "fade", presentation: "modal" }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="CameraCapture" component={CameraCaptureScreen} options={{ animation: "slide_from_bottom", presentation: "modal" }} />
          <Stack.Screen name="Paywall" component={PaywallScreen} options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: "slide_from_right" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center"
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    height: 56,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: Platform.OS === "ios" ? "rgba(15,12,22,0.50)" : "rgba(15,12,22,0.94)"
  },
  tabBarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineBright
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.fog
  }
});
