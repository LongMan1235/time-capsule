import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventSummary, MediaComment, MediaDetail, MediaReaction } from "@time-capsule/shared";
import {
  computeState,
  seedComments,
  seedCredentials,
  seedEvents,
  seedMedia,
  seedReactions,
  seedSearchResults,
  seedUsers,
  toEventSummary,
  type DemoComment,
  type DemoCredential,
  type DemoEvent,
  type DemoMedia,
  type DemoReaction,
  type DemoUser
} from "./demoData";

interface DemoStore {
  version: number;
  events: DemoEvent[];
  media: Record<string, DemoMedia[]>;
  reactions: Record<string, DemoReaction[]>;
  comments: Record<string, DemoComment[]>;
  users: DemoUser[];
  credentials: DemoCredential[];
  currentUserId?: string;
  privacy: { aiOptIn: boolean; faceRecognitionOptIn: boolean };
  subscription: { tier: "FREE" | "PLUS" | "PREMIUM" };
}

const STORAGE_KEY = "time-capsule-demo-store";
const STORE_VERSION = 3;

let store: DemoStore = freshStore();
let hydrated = false;
let hydrating: Promise<void> | undefined;

function freshStore(): DemoStore {
  return {
    version: STORE_VERSION,
    events: [...seedEvents],
    media: cloneMap(seedMedia),
    reactions: cloneMap(seedReactions),
    comments: cloneMap(seedComments),
    users: [...seedUsers],
    credentials: [...seedCredentials],
    currentUserId: undefined,
    privacy: { aiOptIn: false, faceRecognitionOptIn: false },
    subscription: { tier: "FREE" }
  };
}

function cloneMap<T>(input: Record<string, T[]>): Record<string, T[]> {
  const out: Record<string, T[]> = {};
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

export async function attachDemoMedia(eventId: string, partial: Omit<DemoMedia, "addedByUserId"> & { addedByUserId?: string }) {
  await ensureHydrated();
  const userId = partial.addedByUserId ?? store.currentUserId ?? "user-rithik";
  const event = store.events.find((e) => e.id === eventId);
  const list = store.media[eventId] ?? [];

  if (event?.mediaCap && list.length >= event.mediaCap) {
    throw new Error("Capsule photo cap reached.");
  }
  if (event?.mediaCapPerUser) {
    const mine = list.filter((m) => m.addedByUserId === userId).length;
    if (mine >= event.mediaCapPerUser) {
      throw new Error(`You can only add ${event.mediaCapPerUser} photos to this capsule.`);
    }
  }

  const media: DemoMedia = { ...partial, addedByUserId: userId };
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

function publicUser(user: DemoUser) {
  return { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl };
}

function aggregateReactions(mediaId: string, viewerId?: string): MediaReaction[] {
  const list = store.reactions[mediaId] ?? [];
  const byEmoji = new Map<string, MediaReaction>();
  for (const reaction of list) {
    const existing = byEmoji.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(reaction.userId);
    } else {
      byEmoji.set(reaction.emoji, { emoji: reaction.emoji, count: 1, userIds: [reaction.userId] });
    }
  }
  void viewerId;
  return Array.from(byEmoji.values()).sort((a, b) => b.count - a.count);
}

function toMediaDetail(media: DemoMedia): MediaDetail {
  const author = store.users.find((u) => u.id === media.addedByUserId) ?? store.users[0];
  const comments: MediaComment[] = (store.comments[media.id] ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    author: publicUser(store.users.find((u) => u.id === c.userId) ?? store.users[0])
  }));
  return {
    id: media.id,
    url: media.url,
    kind: media.kind,
    caption: media.caption ?? null,
    capturedAt: media.capturedAt ?? null,
    addedBy: publicUser(author),
    reactions: aggregateReactions(media.id),
    comments
  };
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
  mediaCapPerUser?: number | null;
  latitude?: number;
  longitude?: number;
  unlockNote?: string | null;
  disposableMode?: boolean;
  geoLockRadiusMeters?: number | null;
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

interface ReactionBody {
  emoji: string;
}

interface CommentBody {
  body: string;
}

export async function handleDemoRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  await ensureHydrated();
  const method = (options.method ?? "GET").toUpperCase();
  const route = `${method} ${path}`;

  await delay(140);

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
      const matched = store.users.find((u) => u.id === credential.userId);
      return { token: tokenForUser(credential.userId), user: matched } as T;
    }

    if (user) {
      await setCurrentUser(user.id);
      return { token: tokenForUser(user.id), user } as T;
    }

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
    const ownerId = store.currentUserId ?? "user-rithik";
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
      mediaCapPerUser: body.mediaCapPerUser ?? null,
      unlockNote: body.unlockNote ?? null,
      unlockNoteAuthorId: body.unlockNote ? ownerId : null,
      disposableMode: body.disposableMode ?? false,
      geoLockRadiusMeters: body.geoLockRadiusMeters ?? null,
      ceremonySeenAt: null,
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
    const disposableHidden = !!event.disposableMode && state === "COLLECTING";
    const allMedia = state === "LOCKED" ? [] : store.media[eventId] ?? [];
    const visibleMedia = disposableHidden ? [] : allMedia;
    const media = visibleMedia.map((m) => toMediaDetail(m));
    const myUserId = store.currentUserId ?? "user-rithik";
    const myCount = allMedia.filter((m) => m.addedByUserId === myUserId).length;
    const noteAuthor = event.unlockNoteAuthorId
      ? store.users.find((u) => u.id === event.unlockNoteAuthorId)
      : undefined;
    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        locationName: event.locationName,
        coverUrl: event.coverUrl,
        latitude: event.latitude,
        longitude: event.longitude,
        unlockAt: event.unlockAt,
        collectionClosesAt: event.collectionClosesAt,
        state,
        visibility: event.visibility,
        contributorScope: event.contributorScope,
        mediaCap: event.mediaCap ?? null,
        mediaCapPerUser: event.mediaCapPerUser ?? null,
        mediaCountForMe: myCount,
        mediaTotalCount: allMedia.length,
        unlockNote: event.unlockNote ?? null,
        unlockNoteAuthor: noteAuthor ? publicUser(noteAuthor) : null,
        disposableMode: !!event.disposableMode,
        disposableHidden,
        geoLockRadiusMeters: event.geoLockRadiusMeters ?? null,
        ceremonySeenAt: event.ceremonySeenAt ?? null,
        media
      }
    } as T;
  }

  const setCoverMatch = path.match(/^\/events\/([^/]+)\/cover$/);
  if (method === "POST" && setCoverMatch) {
    const eventId = setCoverMatch[1];
    const body = parseBody<{ mediaId: string }>(options);
    if (!body?.mediaId) throw new Error("Pick a memory to use as the cover.");
    const event = store.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
    const media = (store.media[eventId] ?? []).find((m) => m.id === body.mediaId);
    if (!media) throw new Error("That memory isn't in this capsule.");
    event.coverUrl = media.url;
    await persist();
    return { ok: true } as T;
  }

  const deleteMediaMatch = path.match(/^\/media\/([^/]+)$/);
  if (method === "DELETE" && deleteMediaMatch) {
    const mediaId = deleteMediaMatch[1];
    const userId = store.currentUserId ?? "user-rithik";
    let removed = false;
    for (const [eventId, list] of Object.entries(store.media)) {
      const idx = list.findIndex((m) => m.id === mediaId);
      if (idx >= 0) {
        const item = list[idx];
        if (item.addedByUserId !== userId) {
          throw new Error("You can only delete memories you added.");
        }
        store.media[eventId] = [...list.slice(0, idx), ...list.slice(idx + 1)];
        removed = true;
        break;
      }
    }
    if (!removed) throw new Error("Memory not found");
    delete store.reactions[mediaId];
    delete store.comments[mediaId];
    await persist();
    return { ok: true } as T;
  }

  const ceremonyMatch = path.match(/^\/events\/([^/]+)\/ceremony-seen$/);
  if (method === "POST" && ceremonyMatch) {
    const eventId = ceremonyMatch[1];
    const event = store.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
    event.ceremonySeenAt = new Date().toISOString();
    await persist();
    return { ok: true, ceremonySeenAt: event.ceremonySeenAt } as T;
  }

  if (route === "GET /me/stats") {
    const userId = store.currentUserId ?? "user-rithik";
    const myMedia: DemoMedia[] = [];
    for (const list of Object.values(store.media)) {
      for (const m of list) if (m.addedByUserId === userId && m.capturedAt) myMedia.push(m);
    }
    const week = new Set<string>();
    const now = new Date();
    for (const m of myMedia) {
      const d = new Date(m.capturedAt!);
      const weekKey = `${d.getUTCFullYear()}-${Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / (7 * 86_400_000))}`;
      week.add(weekKey);
    }
    let streak = 0;
    const cursor = new Date(now);
    for (let i = 0; i < 52; i += 1) {
      const key = `${cursor.getUTCFullYear()}-${Math.floor((cursor.getTime() - Date.UTC(cursor.getUTCFullYear(), 0, 1)) / (7 * 86_400_000))}`;
      if (week.has(key)) {
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 7);
      } else {
        break;
      }
    }
    const eventsOwned = store.events.length;
    const memoriesAdded = myMedia.length;
    return { streakWeeks: streak, eventsOwned, memoriesAdded } as T;
  }

  if (route === "GET /memories/on-this-day") {
    const now = new Date();
    const matches = store.events
      .filter((event) => {
        if (computeState(event) !== "UNLOCKED") return false;
        const date = new Date(event.eventDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate() &&
          date.getFullYear() < now.getFullYear()
        );
      })
      .map((event) => {
        const yearsAgo = now.getFullYear() - new Date(event.eventDate).getFullYear();
        const cover = (store.media[event.id] ?? [])[0];
        return {
          id: event.id,
          title: event.title,
          locationName: event.locationName,
          coverUrl: cover?.url ?? event.coverUrl,
          yearsAgo
        };
      });
    return { memories: matches } as T;
  }

  const mediaDetailMatch = path.match(/^\/media\/([^/]+)$/);
  if (method === "GET" && mediaDetailMatch) {
    const mediaId = mediaDetailMatch[1];
    for (const list of Object.values(store.media)) {
      const found = list.find((m) => m.id === mediaId);
      if (found) return { media: toMediaDetail(found) } as T;
    }
    throw new Error("Photo not found");
  }

  const reactionPostMatch = path.match(/^\/media\/([^/]+)\/reactions$/);
  if (method === "POST" && reactionPostMatch) {
    const mediaId = reactionPostMatch[1];
    const body = parseBody<ReactionBody>(options);
    if (!body?.emoji) throw new Error("Pick an emoji.");
    const userId = store.currentUserId ?? "user-rithik";
    const existing = store.reactions[mediaId] ?? [];
    const already = existing.find((r) => r.userId === userId && r.emoji === body.emoji);
    if (already) {
      store.reactions[mediaId] = existing.filter((r) => r.id !== already.id);
    } else {
      const next: DemoReaction = {
        id: makeId("rx"),
        mediaId,
        userId,
        emoji: body.emoji,
        createdAt: new Date().toISOString()
      };
      store.reactions[mediaId] = [...existing, next];
    }
    await persist();
    return { reactions: aggregateReactions(mediaId) } as T;
  }

  const commentPostMatch = path.match(/^\/media\/([^/]+)\/comments$/);
  if (method === "POST" && commentPostMatch) {
    const mediaId = commentPostMatch[1];
    const body = parseBody<CommentBody>(options);
    if (!body?.body?.trim()) throw new Error("Type a comment first.");
    const userId = store.currentUserId ?? "user-rithik";
    const comment: DemoComment = {
      id: makeId("c"),
      mediaId,
      userId,
      body: body.body.trim(),
      createdAt: new Date().toISOString()
    };
    store.comments[mediaId] = [...(store.comments[mediaId] ?? []), comment];
    await persist();
    const author = store.users.find((u) => u.id === userId) ?? store.users[0];
    const mediaComment: MediaComment = {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: publicUser(author)
    };
    return { comment: mediaComment } as T;
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
