import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const SETTINGS_KEY = "time-capsule-notify-prefs";

export interface NotificationPrefs {
  weeklyPrompt: boolean;
  onThisDay: boolean;
  anniversaries: boolean;
  capsuleUnlocks: boolean;
}

export const defaultPrefs: NotificationPrefs = {
  weeklyPrompt: true,
  onThisDay: true,
  anniversaries: true,
  capsuleUnlocks: true
};

const weeklyId = "weekly-prompt";
const dailyId = "daily-on-this-day";

let configured = false;
function ensureHandler() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}

export async function loadPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as NotificationPrefs) };
  } catch {
    return defaultPrefs;
  }
}

export async function savePrefs(prefs: NotificationPrefs) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
  await reschedule(prefs);
}

export async function ensurePermissions(): Promise<boolean> {
  ensureHandler();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (settings.canAskAgain) {
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  }
  return false;
}

export async function reschedule(prefs: NotificationPrefs) {
  ensureHandler();
  try {
    await Notifications.cancelScheduledNotificationAsync(weeklyId).catch(() => undefined);
    await Notifications.cancelScheduledNotificationAsync(dailyId).catch(() => undefined);

    if (Platform.OS === "web") return;

    if (prefs.weeklyPrompt) {
      await Notifications.scheduleNotificationAsync({
        identifier: weeklyId,
        content: {
          title: "Sunday capture",
          body: "What was the best 30 seconds of your week?",
          data: { kind: "weekly-prompt" }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday in Expo (1=Sun)
          hour: 19,
          minute: 0
        }
      });
    }

    if (prefs.onThisDay) {
      await Notifications.scheduleNotificationAsync({
        identifier: dailyId,
        content: {
          title: "On this day",
          body: "A memory from a past year is waiting for you.",
          data: { kind: "on-this-day" }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 30
        }
      });
    }
  } catch {
    // best-effort, expo-notifications may not be available everywhere
  }
}

export async function sendLocalNow(title: string, body: string) {
  try {
    ensureHandler();
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null
    });
  } catch {
    // ignore
  }
}
