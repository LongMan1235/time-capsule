import Constants from "expo-constants";
import { handleDemoRequest } from "./demo";
import { useSessionStore } from "../store/session";

const apiMode = (Constants.expoConfig?.extra?.apiMode as "demo" | "remote" | undefined) ?? "demo";
const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:4000";

export const DEMO_MODE = apiMode === "demo";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (DEMO_MODE) {
    return handleDemoRequest<T>(path, options as { method?: string; body?: string });
  }

  const token = useSessionStore.getState().token;
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed: ${response.status}`);
  }

  return data as T;
}
