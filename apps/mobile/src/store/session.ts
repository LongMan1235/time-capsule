import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface SessionState {
  token?: string;
  user?: SessionUser;
  hydrated: boolean;
  setToken: (token?: string) => Promise<void>;
  setUser: (user?: SessionUser) => Promise<void>;
  signIn: (token: string, user?: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = "time-capsule-token";
const USER_KEY = "time-capsule-user";

export const useSessionStore = create<SessionState>((set) => ({
  hydrated: false,
  setToken: async (token) => {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
    set({ token });
  },
  setUser: async (user) => {
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(USER_KEY);
    set({ user });
  },
  signIn: async (token, user) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  signOut: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({ token: undefined, user: undefined });
  },
  hydrate: async () => {
    const [tokenEntry, userEntry] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    const token = tokenEntry[1] ?? undefined;
    let user: SessionUser | undefined;
    if (userEntry[1]) {
      try {
        user = JSON.parse(userEntry[1]) as SessionUser;
      } catch {
        user = undefined;
      }
    }
    set({ token, user, hydrated: true });
  }
}));
