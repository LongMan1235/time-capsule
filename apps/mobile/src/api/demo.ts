import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventSummary } from "@time-capsule/shared";
import {
  computeState,
  seedCredentials,
  seedEvents,
  seedMedia,
  seedSearchResults,
  seedUsers,
  toEventSummary,
  type DemoCredential,
  type DemoEvent,
  type DemoMedia,
  type DemoUser
} from "./demoData";

interface DemoStore {
  version: number;
  events: DemoEvent[];
  media: Record<string, DemoMedia[]>;
  users: DemoUser[];
  credentials: DemoCredential[];
  currentUserId?: string;
  privacy: { aiOptIn: boolean; faceRecognitionOptIn: boolean };
  subscription: { tier: "FREE" | "PLUS" | "PREMIUM" };
}

const STORAGE_KEY = "time-capsule-demo-store";
const STORE_VERSION = 2;

let store: DemoStore = freshStore();

let hydrated = false;
let hydrating: Promise<void> | undefined;

function freshStore(): DemoStore {
  return {
    version: STORE_VERSION,
    events: [...seedEvents],
    media: cloneMedia(seedMedia),
    users: [...seedUsers],
    credentials: [...seedCredentials],
    currentUserId: undefined,
    privacy: { aiOptIn: false, faceRecognitionOptIn: false },
    subscription: { tier: "FREE" }
  };
}

function cloneMedia(input: Record<string, DemoMedia[]>): Record<string, DemoMedia[]> {
  const out: Record<string, DemoMedia[]> = {};
  for (const [key, value] of Object.entries(input)) out[key] = [...value];
  return out;
}

async function ensureHydrated() {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DemoStore;
          if (parsed.version === STORE_VERSION) {
            store = mergeWithSeeds(parsed);
          } else {
            store = freshStore();
            await persist();
          }
        } else {
          await persist();
        }
      } catch {
        // fall back to seeds
      } finally {
        hydrated = true;
      }
    })();
  }
  await hydrating;
}

function mergeWithSeeds(parsed: DemoStore): DemoStore {
  const userIds = new Set(parsed.users.map((u) => u.id));
  const users = [...parsed.users];
  for (const seed of seedUsers) if (!userIds.has(seed.id)) users.push(seed);

  const credentialKeys = new Set(parsed.credentials.map((c) => `${c.emailOrUsername.toLowerCase()}::${c.userId}`));
  const credentials = [...parsed.credentials];
  for (const seed of seedCredentials) {
    const key = `${seed.emailOrUsername.toLowerCase()}::${seed.userId}`;
    if (!credentialKeys.has(key)) credentials.push(seed);
  }

  return { ...parsed, users, credentials };
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function resetDemoStore() {
  store = freshStore();
  hydrated = true;
  await persist();
}

export async function attachDemoMedia(eventId: string, media: DemoMedia) {
  await ensureHydrated();
  const list = store.media[eventId] ?? [];
  store.media[eventId] = [...list, media];
  await persist();
}

interface RequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

function parseBody<T>(options: RequestOptions): T | undefined {
  if (!options.body) return undefined;
  try {
    return JSON.parse(options.body) as T;
  } catch {
    return undefined;
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function tokenForUser(userId: string) {
  return `demo.${userId}.${Date.now().toString(36)}`;
}

function findUser(emailOrUsername: string): DemoUser | undefined {
  const lookup = emailOrUsername.trim().toLowerCase();
  return store.users.find(
    (user) => user.email.toLowerCase() === lookup || user.username.toLowerCase() === lookup
  );
}

function findCredential(emailOrUsername: string): DemoCredential | undefined {
  const lookup = emailOrUsername.trim().toLowerCase();
  return store.credentials.find((credential) => credential.emailOrUsername.toLowerCase() === lookup);
}

async function setCurrentUser(userId: string) {
  store.currentUserId = userId;
  await persist();
}

interface AuthBody {
  email?: string;
  password?: string;
  username?: string;
  displayName?: string;
}

interface CreateEventBody {
  title: string;
  description?: string;
  locationName?: string;
  eventDate: string;
  unlockAt?: string;
  collectionClosesAt?: string;
  visibility?: DemoEvent["visibility"];
  contributorScope?: DemoEvent["contributorScope"];
  mediaCap?: number | null;
  latitude?: number;
  longitude?: number;
}

interface SearchBody {
  query: string;
}

interface PrivacyBody {
  aiOptIn?: boolean;
  faceRecognitionOptIn?: boolean;
}

interface EarlyUnlockBody {
  eventId: string;
}

export async function handleDemoRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  await ensureHydrated();
  const method = (options.method ?? "GET").toUpperCase();
  const route = `${method} ${path}`;

  await delay(180);

  if (route === "POST /auth/login") {
    const body = parseBody<AuthBody>(options) ?? {};
    const identifier = (body.email ?? "").trim();
    if (!identifier) throw new Error("Enter your email or username.");
    const credential = findCredential(identifier);
    const user = findUser(identifier);

    if (credential) {
      if (body.password !== credential.password) {
        throw new Error("Incorrect password for this account.");
      }
      await setCurrentUser(credential.userId);
      const matchedUser = store.users.find((u) => u.id === credential.userId);
      return { token: tokenForUser(credential.userId), user: matchedUser } as T;
    }

    if (user) {
      // Known user with no stored password — accept and sign in
      await setCurrentUser(user.id);
      return { token: tokenForUser(user.id), user } as T;
    }

    // Unknown identifier — sign in as a generic guest so demo stays explorable
    const guest = ensureGuestUser(identifier);
    await setCurrentUser(guest.id);
    return { token: tokenForUser(guest.id), user: guest } as T;
  }

  if (route === "POST /auth/signup") {
    const body = parseBody<AuthBody>(options) ?? {};
    const email = body.email?.trim();
    const username = body.username?.trim();
    if (!email || !username) throw new Error("Email and username are required.");

    if (findCredential(email) || findCredential(username)) {
      throw new Error("An account with those credentials already exists. Try signing in.");
    }

    const user: DemoUser = {
      id: makeId("user"),
      email,
      username,
      displayName: body.displayName?.trim() || username,
      subscriptionTier: "FREE"
    };
    store.users.push(user);
    if (body.password) {
      store.credentials.push({ emailOrUsername: email, password: body.password, userId: user.id });
      store.credentials.push({ emailOrUsername: username, password: body.password, userId: user.id });
    }
    await setCurrentUser(user.id);
    return { token: tokenForUser(user.id), user } as T;
  }

  if (route === "POST /auth/oauth") {
    const body = parseBody<AuthBody>(options) ?? {};
    const email = body.email ?? "oauth@time-capsule.app";
    const user = findUser(email) ?? ensureGuestUser(email);
    await setCurrentUser(user.id);
    return { token: tokenForUser(user.id), user } as T;
  }

  if (route === "GET /auth/me") {
    const user = store.users.find((u) => u.id === store.currentUserId);
    return { user: user ?? null } as T;
  }

  if (route === "POST /auth/logout") {
    store.currentUserId = undefined;
    await persist();
    return { ok: true } as T;
  }

  if (route === "GET /events") {
    const events: EventSummary[] = store.events
      .slice()
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .map((event) => toEventSummary(event, store.media));
    return { events } as T;
  }

  if (route === "POST /events") {
    const body = parseBody<CreateEventBody>(options);
    if (!body?.title) throw new Error("Title is required");
    const event: DemoEvent = {
      id: makeId("evt"),
      title: body.title,
      description: body.description,
      coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
      eventDate: body.eventDate ?? new Date().toISOString(),
      locationName: body.locationName ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      unlockAt: body.unlockAt ?? null,
      collectionClosesAt: body.collectionClosesAt ?? null,
      visibility: body.visibility ?? "PRIVATE",
      contributorScope: body.contributorScope ?? "OWNER_ONLY",
      mediaCap: body.mediaCap ?? null,
      createdAt: new Date().toISOString()
    };
    store.events.unshift(event);
    store.media[event.id] = [];
    await persist();
    return { event } as T;
  }

  if (route === "GET /events/map") {
    const events = store.events
      .filter((event) => event.latitude != null && event.longitude != null)
      .map((event) => ({
        id: event.id,
        title: event.title,
        locationName: event.locationName,
        latitude: event.latitude as number,
        longitude: event.longitude as number
      }));
    return { events } as T;
  }

  const eventDetailMatch = path.match(/^\/events\/([^/]+)$/);
  if (method === "GET" && eventDetailMatch) {
    const eventId = eventDetailMatch[1];
    const event = store.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
    const state = computeState(event);
    const media = state === "LOCKED" ? [] : store.media[eventId] ?? [];
    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        locationName: event.locationName,
        coverUrl: event.coverUrl,
        unlockAt: event.unlockAt,
        collectionClosesAt: event.collectionClosesAt,
        state,
        visibility: event.visibility,
        contributorScope: event.contributorScope,
        mediaCap: event.mediaCap ?? null,
        media
      }
    } as T;
  }

  if (route === "POST /media/presign") {
    const id = makeId("media");
    return {
      uploadUrl: `https://demo.local/upload/${id}`,
      key: id,
      publicUrl: `https://demo.local/media/${id}`
    } as T;
  }

  if (route === "POST /media") {
    return { ok: true } as T;
  }

  if (route === "POST /search") {
    const body = parseBody<SearchBody>(options);
    const query = body?.query?.toLowerCase().trim() ?? "";
    if (!query) return { results: seedSearchResults } as T;
    const filtered = seedSearchResults
      .map((result) => {
        const haystack = `${result.caption ?? ""} ${result.reason}`.toLowerCase();
        const tokenMatch = query
          .split(/\s+/)
          .filter(Boolean)
          .some((token) => haystack.includes(token));
        return { result, match: tokenMatch };
      })
      .filter((entry) => entry.match)
      .map((entry) => entry.result);
    return { results: filtered.length ? filtered : seedSearchResults } as T;
  }

  if (route === "POST /billing/early-unlock/intent") {
    const body = parseBody<EarlyUnlockBody>(options);
    const event = store.events.find((e) => e.id === body?.eventId);
    if (!event?.unlockAt) {
      return { amountCents: 499, currency: "usd", remainingDays: 0, discountPercent: 0 } as T;
    }
    const remainingDays = Math.max(0, Math.ceil((new Date(event.unlockAt).getTime() - Date.now()) / 86_400_000));
    const amountCents = Math.min(9999, Math.max(199, remainingDays * 6));
    return { amountCents, currency: "usd", remainingDays, discountPercent: 0 } as T;
  }

  if (route === "PATCH /privacy/ai-consent") {
    const body = parseBody<PrivacyBody>(options) ?? {};
    store.privacy = {
      aiOptIn: body.aiOptIn ?? store.privacy.aiOptIn,
      faceRecognitionOptIn: body.faceRecognitionOptIn ?? store.privacy.faceRecognitionOptIn
    };
    await persist();
    return { privacy: store.privacy } as T;
  }

  if (route === "POST /privacy/delete-request") {
    return { ok: true, requestedAt: new Date().toISOString() } as T;
  }

  if (route === "GET /health") {
    return { ok: true, service: "time-capsule-demo" } as T;
  }

  throw new Error(`No demo handler for ${route}`);
}

function ensureGuestUser(identifier: string): DemoUser {
  const existing = findUser(identifier);
  if (existing) return existing;
  const looksLikeEmail = identifier.includes("@");
  const guest: DemoUser = {
    id: makeId("user"),
    email: looksLikeEmail ? identifier : `${identifier}@time-capsule.app`,
    username: looksLikeEmail ? identifier.split("@")[0] : identifier,
    displayName: looksLikeEmail ? identifier.split("@")[0] : identifier,
    subscriptionTier: "FREE"
  };
  store.users.push(guest);
  return guest;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
