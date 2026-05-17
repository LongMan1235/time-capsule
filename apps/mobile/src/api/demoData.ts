import type { CapsuleState, ContributorScope, EventSummary, MemorySearchResult, SubscriptionTier, Visibility } from "@time-capsule/shared";

export interface DemoUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
}

export interface DemoCredential {
  emailOrUsername: string;
  password: string;
  userId: string;
}

export const seedUsers: DemoUser[] = [
  {
    id: "user-rithik",
    email: "rithik@time-capsule.app",
    username: "rithik",
    displayName: "Rithik",
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=80",
    subscriptionTier: "FREE"
  },
  {
    id: "user-amal",
    email: "amal@time-capsule.app",
    username: "amal",
    displayName: "Amal",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    subscriptionTier: "FREE"
  },
  {
    id: "user-ryan",
    email: "ryan@time-capsule.app",
    username: "ryan",
    displayName: "Ryan",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
    subscriptionTier: "FREE"
  }
];

export const seedCredentials: DemoCredential[] = [
  { emailOrUsername: "rithik", password: "mypassword123", userId: "user-rithik" },
  { emailOrUsername: "rithik@time-capsule.app", password: "mypassword123", userId: "user-rithik" }
];

export interface DemoMedia {
  id: string;
  url: string;
  kind: "PHOTO" | "VIDEO" | "VOICE_NOTE";
  caption?: string;
  capturedAt?: string;
  addedByUserId: string;
}

export interface DemoReaction {
  id: string;
  mediaId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface DemoComment {
  id: string;
  mediaId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export const REACTION_EMOJIS = ["❤️", "🔥", "😂", "😮", "😢", "🎉"] as const;

export interface DemoEvent extends Omit<EventSummary, "state" | "mediaCount"> {
  createdAt: string;
  description?: string;
  earlyUnlockedAt?: string | null;
  mediaCapPerUser?: number | null;
  unlockNote?: string | null;
  unlockNoteAuthorId?: string | null;
  disposableMode?: boolean;
  geoLockRadiusMeters?: number | null;
  ceremonySeenAt?: string | null;
  isPublic?: boolean;
  templateId?: string | null;
  spotifyUri?: string | null;
  spotifyTitle?: string | null;
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const photo = (id: string, query: string, caption: string | undefined, daysOld: number, addedBy: string): DemoMedia => ({
  id,
  url: `https://images.unsplash.com/${query}?auto=format&fit=crop&w=1200&q=80`,
  kind: "PHOTO",
  caption,
  capturedAt: daysAgo(daysOld),
  addedByUserId: addedBy
});

export const seedEvents: DemoEvent[] = [
  {
    id: "evt-europe-2026",
    title: "Europe Trip 2026",
    description: "Three weeks across Lisbon, Barcelona, and Florence.",
    coverUrl: "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(120),
    locationName: "Lisbon, Portugal",
    latitude: 38.7223,
    longitude: -9.1393,
    collectionClosesAt: daysAgo(110),
    unlockAt: daysFromNow(284),
    visibility: "FRIENDS" as Visibility,
    contributorScope: "FRIENDS" as ContributorScope,
    mediaCap: null,
    mediaCapPerUser: 10,
    unlockNote: "If we ever forget how alive we were that summer, this is the proof.",
    unlockNoteAuthorId: "user-rithik",
    disposableMode: false,
    geoLockRadiusMeters: null,
    ceremonySeenAt: null,
    isPublic: false,
    templateId: "trip",
    spotifyUri: "https://open.spotify.com/track/3sP08wT0lt9HrGEX3FrV2A",
    spotifyTitle: "Walking on a Dream — Empire of the Sun",
    createdAt: daysAgo(120)
  },
  {
    id: "evt-graduation",
    title: "Graduation Day",
    description: "The walk across the stage, the photos in the quad, the dinner that ran until midnight.",
    coverUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(45),
    locationName: "Toronto, Canada",
    latitude: 43.6629,
    longitude: -79.3957,
    collectionClosesAt: daysAgo(40),
    unlockAt: daysFromNow(1825),
    visibility: "FRIENDS" as Visibility,
    contributorScope: "FRIENDS" as ContributorScope,
    mediaCap: null,
    mediaCapPerUser: 15,
    createdAt: daysAgo(45)
  },
  {
    id: "evt-amal-bday",
    title: "Amal's Birthday",
    description: "Rooftop, candles, the song everyone sang too loud.",
    coverUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(8),
    locationName: "Brooklyn, NY",
    latitude: 40.6782,
    longitude: -73.9442,
    collectionClosesAt: daysFromNow(2),
    unlockAt: daysFromNow(357),
    visibility: "COLLABORATIVE" as Visibility,
    contributorScope: "OPEN_LINK" as ContributorScope,
    mediaCap: 60,
    mediaCapPerUser: 5,
    unlockNote: null,
    disposableMode: true,
    geoLockRadiusMeters: null,
    ceremonySeenAt: null,
    createdAt: daysAgo(8)
  },
  {
    id: "evt-snowboarding",
    title: "Whistler Weekend",
    description: "Powder day, beer at the bottom, that wipeout we keep replaying.",
    coverUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(380),
    locationName: "Whistler, BC",
    latitude: 50.1163,
    longitude: -122.9574,
    collectionClosesAt: daysAgo(378),
    unlockAt: daysAgo(15),
    earlyUnlockedAt: daysAgo(15),
    visibility: "FRIENDS" as Visibility,
    contributorScope: "FRIENDS" as ContributorScope,
    mediaCap: null,
    mediaCapPerUser: null,
    unlockNote: "If you're reading this, the season's already changed. Hope you're still chasing first chair.",
    unlockNoteAuthorId: "user-rithik",
    disposableMode: false,
    ceremonySeenAt: null,
    createdAt: daysAgo(380)
  },
  {
    id: "evt-frosh-week",
    title: "First Year Engineering",
    description: "Move-in. Frosh. Late-night problem sets. The friendships that lasted.",
    coverUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(640),
    locationName: "Waterloo, ON",
    latitude: 43.4723,
    longitude: -80.5449,
    collectionClosesAt: daysAgo(620),
    unlockAt: daysAgo(40),
    earlyUnlockedAt: null,
    visibility: "PRIVATE" as Visibility,
    contributorScope: "OWNER_ONLY" as ContributorScope,
    mediaCap: null,
    mediaCapPerUser: null,
    unlockNote: "Future me — remember the first week before you got cynical. The world felt enormous.",
    unlockNoteAuthorId: "user-rithik",
    disposableMode: false,
    ceremonySeenAt: null,
    createdAt: daysAgo(640)
  },
  {
    id: "evt-draft-roadtrip",
    title: "Pacific Coast Roadtrip",
    description: "Adding photos as we go — locking it when we're back.",
    coverUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(2),
    locationName: "Highway 1, California",
    latitude: 36.2704,
    longitude: -121.8081,
    collectionClosesAt: daysFromNow(5),
    unlockAt: null,
    visibility: "PRIVATE" as Visibility,
    contributorScope: "OWNER_ONLY" as ContributorScope,
    mediaCap: null,
    mediaCapPerUser: null,
    createdAt: daysAgo(2)
  }
];

export const seedMedia: Record<string, DemoMedia[]> = {
  "evt-europe-2026": [
    photo("m-eu-1", "photo-1499856871958-5b9627545d1a", "Lisbon, golden hour", 118, "user-rithik"),
    photo("m-eu-2", "photo-1533105079780-92b9be482077", "Pastéis & espresso", 115, "user-amal"),
    photo("m-eu-3", "photo-1502602898657-3e91760cbb34", "The Eiffel detour", 110, "user-rithik"),
    photo("m-eu-4", "photo-1467269204594-9661b134dd2b", "Barcelona market run", 108, "user-ryan"),
    photo("m-eu-5", "photo-1534430480872-3498386e7856", "Florence rooftops", 100, "user-amal")
  ],
  "evt-graduation": [
    photo("m-grad-1", "photo-1523050854058-8df90110c9f1", "On stage", 45, "user-rithik"),
    photo("m-grad-2", "photo-1571260899304-425eee4c7efc", "Quad portraits", 45, "user-amal"),
    photo("m-grad-3", "photo-1607013251379-e6eecfffe234", "After party", 44, "user-rithik")
  ],
  "evt-amal-bday": [
    photo("m-amal-1", "photo-1530103862676-de8c9debad1d", "Candles", 8, "user-amal"),
    photo("m-amal-2", "photo-1492684223066-81342ee5ff30", "Rooftop crowd", 8, "user-rithik"),
    photo("m-amal-3", "photo-1481833761820-0509d3217039", "The cake reveal", 8, "user-ryan")
  ],
  "evt-snowboarding": [
    photo("m-snow-1", "photo-1551524559-8af4e6624178", "Top of the lift", 379, "user-rithik"),
    photo("m-snow-2", "photo-1517490232338-06b912a786b5", "Powder line", 378, "user-ryan"),
    photo("m-snow-3", "photo-1551698618-1dfe5d97d256", "Lodge beers", 378, "user-rithik"),
    photo("m-snow-4", "photo-1486919704480-d56c2c6acfc1", "Night ride", 377, "user-amal")
  ],
  "evt-frosh-week": [
    photo("m-frosh-1", "photo-1523580494863-6f3031224c94", "Dorm move-in", 640, "user-rithik"),
    photo("m-frosh-2", "photo-1541339907198-e08756dedf3f", "Lecture hall day one", 638, "user-rithik"),
    photo("m-frosh-3", "photo-1517245386807-bb43f82c33c4", "Late-night library", 600, "user-rithik")
  ],
  "evt-draft-roadtrip": [
    photo("m-road-1", "photo-1469854523086-cc02fe5d8800", "First overlook", 2, "user-rithik"),
    photo("m-road-2", "photo-1502920917128-1aa500764cbd", "Gas station diner", 1, "user-rithik")
  ]
};

export const seedReactions: Record<string, DemoReaction[]> = {
  "m-eu-1": [
    { id: "rx-1", mediaId: "m-eu-1", userId: "user-amal", emoji: "❤️", createdAt: daysAgo(115) },
    { id: "rx-2", mediaId: "m-eu-1", userId: "user-ryan", emoji: "🔥", createdAt: daysAgo(114) }
  ],
  "m-eu-3": [
    { id: "rx-3", mediaId: "m-eu-3", userId: "user-amal", emoji: "❤️", createdAt: daysAgo(108) }
  ],
  "m-amal-1": [
    { id: "rx-4", mediaId: "m-amal-1", userId: "user-rithik", emoji: "❤️", createdAt: daysAgo(7) },
    { id: "rx-5", mediaId: "m-amal-1", userId: "user-ryan", emoji: "🎉", createdAt: daysAgo(7) }
  ],
  "m-amal-3": [
    { id: "rx-6", mediaId: "m-amal-3", userId: "user-rithik", emoji: "🔥", createdAt: daysAgo(7) },
    { id: "rx-7", mediaId: "m-amal-3", userId: "user-amal", emoji: "❤️", createdAt: daysAgo(7) }
  ]
};

export const seedComments: Record<string, DemoComment[]> = {
  "m-eu-1": [
    { id: "c-1", mediaId: "m-eu-1", userId: "user-amal", body: "Pastel buildings still living rent-free in my head", createdAt: hoursAgo(2750) },
    { id: "c-2", mediaId: "m-eu-1", userId: "user-rithik", body: "That walk back from dinner 🌅", createdAt: hoursAgo(2748) }
  ],
  "m-amal-1": [
    { id: "c-3", mediaId: "m-amal-1", userId: "user-rithik", body: "Best night of the year", createdAt: hoursAgo(168) },
    { id: "c-4", mediaId: "m-amal-1", userId: "user-ryan", body: "We need to do this every year", createdAt: hoursAgo(160) }
  ],
  "m-snow-1": [
    { id: "c-5", mediaId: "m-snow-1", userId: "user-ryan", body: "first run of the day hits different", createdAt: hoursAgo(9000) }
  ]
};

export const seedSearchResults: MemorySearchResult[] = [
  {
    mediaId: "m-amal-1",
    eventId: "evt-amal-bday",
    score: 0.92,
    reason: "Faces matched · Amal",
    caption: "Candles",
    thumbnailUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80"
  },
  {
    mediaId: "m-amal-3",
    eventId: "evt-amal-bday",
    score: 0.84,
    reason: "Caption match",
    caption: "The cake reveal",
    thumbnailUrl: "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=400&q=80"
  },
  {
    mediaId: "m-snow-4",
    eventId: "evt-snowboarding",
    score: 0.78,
    reason: "Scene · nighttime",
    caption: "Night ride",
    thumbnailUrl: "https://images.unsplash.com/photo-1486919704480-d56c2c6acfc1?auto=format&fit=crop&w=400&q=80"
  },
  {
    mediaId: "m-eu-1",
    eventId: "evt-europe-2026",
    score: 0.72,
    reason: "Location · Lisbon",
    caption: "Lisbon, golden hour",
    thumbnailUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80"
  }
];

export function computeMediaCount(eventId: string, media: Record<string, DemoMedia[]>) {
  return media[eventId]?.length ?? 0;
}

export function computeState(event: DemoEvent): CapsuleState {
  const now = Date.now();
  if (!event.unlockAt && !event.collectionClosesAt) return "DRAFT";
  if (event.earlyUnlockedAt) return "UNLOCKED";

  const collectionStillOpen = event.collectionClosesAt
    ? new Date(event.collectionClosesAt).getTime() > now
    : false;

  if (collectionStillOpen) return "COLLECTING";
  if (event.unlockAt && new Date(event.unlockAt).getTime() <= now) return "UNLOCKED";
  if (event.unlockAt) return "LOCKED";
  return "DRAFT";
}

export function toEventSummary(event: DemoEvent, media: Record<string, DemoMedia[]>): EventSummary {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    coverUrl: event.coverUrl,
    eventDate: event.eventDate,
    locationName: event.locationName ?? null,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    unlockAt: event.unlockAt,
    collectionClosesAt: event.collectionClosesAt ?? null,
    state: computeState(event),
    visibility: event.visibility,
    contributorScope: event.contributorScope,
    mediaCount: computeMediaCount(event.id, media),
    mediaCap: event.mediaCap ?? null,
    mediaCapPerUser: event.mediaCapPerUser ?? null,
    unlockNote: event.unlockNote ?? null,
    unlockNoteAuthor: event.unlockNoteAuthorId ?? null,
    disposableMode: event.disposableMode ?? false,
    geoLockRadiusMeters: event.geoLockRadiusMeters ?? null,
    ceremonySeenAt: event.ceremonySeenAt ?? null,
    isPublic: event.isPublic ?? false,
    templateId: event.templateId ?? null,
    spotifyUri: event.spotifyUri ?? null,
    spotifyTitle: event.spotifyTitle ?? null
  };
}
