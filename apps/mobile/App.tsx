import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import type { RootStackParamList } from "./src/navigation/RootNavigator";

const linking = {
  prefixes: ["timecapsule://", "https://timecapsule.app"],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: "home",
          Map: "map",
          Create: "create",
          Search: "search",
          Privacy: "privacy"
        }
      },
      EventDetail: "capsule/:eventId",
      UnlockCeremony: "capsule/:eventId/open",
      PhotoViewer: "capsule/:eventId/photo/:startIndex",
      Explore: "explore",
      Profile: "profile",
      Paywall: "premium",
      Auth: "auth",
      Onboarding: "welcome"
    }
  } as const
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking as any}>
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
