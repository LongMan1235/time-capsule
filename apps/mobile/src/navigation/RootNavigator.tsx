import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { CalendarPlus, Map, Search, Settings, Sparkles } from "lucide-react-native";
import { useEffect, useRef, type ComponentType } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { colors, radii, shadow } from "../design/theme";
import type { IconComponent } from "../design/icons";
import { useSessionStore } from "../store/session";
import { AuthScreen } from "../screens/AuthScreen";
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
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const tabs: Array<{ name: string; component: ComponentType<any>; icon: IconComponent; label: string }> = [
  { name: "Home", component: HomeScreen, icon: Sparkles, label: "Capsules" },
  { name: "Map", component: MapScreen, icon: Map, label: "Map" },
  { name: "Create", component: CreateEventScreen, icon: CalendarPlus, label: "Create" },
  { name: "Search", component: SearchScreen, icon: Search, label: "Search" },
  { name: "Privacy", component: PrivacyScreen, icon: Settings, label: "Privacy" }
];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={styles.tabBarWrap}>
      <View style={[styles.tabBar, shadow.card]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15,12,22,0.92)" }]} />
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
  const scale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: focused ? 1 : 0, useNativeDriver: true, friction: 7, tension: 160 }).start();
  }, [focused, scale]);

  const dotScale = scale.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const dotOpacity = scale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const iconScale = scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const iconTranslate = scale.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Pressable onPress={onPress} style={styles.tabButton} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale: iconScale }, { translateY: iconTranslate }] }}>
        <Icon color={focused ? colors.gold : colors.muted} size={22} />
      </Animated.View>
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
    left: 18,
    right: 18,
    bottom: Platform.OS === "ios" ? 22 : 16,
    alignItems: "center"
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    height: 64,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: Platform.OS === "ios" ? "rgba(15,12,22,0.55)" : "rgba(15,12,22,0.92)"
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
    gap: 6,
    paddingVertical: 12
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }
  }
});
