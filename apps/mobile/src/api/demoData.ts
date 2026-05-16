import type { CapsuleState, EventSummary, MemorySearchResult, SubscriptionTier, Visibility } from "@time-capsule/shared";

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
}

export interface DemoEvent extends Omit<EventSummary, "state" | "mediaCount"> {
  createdAt: string;
  description?: string;
  earlyUnlockedAt?: string | null;
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const photo = (id: string, query: string, caption?: string, daysOld = 30): DemoMedia => ({
  id,
  url: `https://images.unsplash.com/${query}?auto=format&fit=crop&w=1200&q=80`,
  kind: "PHOTO",
  caption,
  capturedAt: daysAgo(daysOld)
});

export const seedEvents: DemoEvent[] = [
  {
    id: "evt-europe-2026",
    title: "Europe Trip 2026",
    description: "Three weeks across Lisbon, Barcelona, and Florence. The pastry tour, the rooftop sunsets, the train where everyone fell asleep.",
    coverUrl: "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?auto=format&fit=crop&w=1600&q=80",
    eventDate: daysAgo(120),
    locationName: "Lisbon, Portugal",
    latitude: 38.7223,
    longitude: -9.1393,
    unlockAt: daysFromNow(284),
    visibility: "FRIENDS" as Visibility,
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
    unlockAt: daysFromNow(1825),
    visibility: "FRIENDS" as Visibility,
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
    unlockAt: daysFromNow(357),
    visibility: "COLLABORATIVE" as Visibility,
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
    unlockAt: daysAgo(15),
    earlyUnlockedAt: daysAgo(15),
    visibility: "FRIENDS" as Visibility,
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
    unlockAt: daysAgo(40),
    earlyUnlockedAt: null,
    visibility: "PRIVATE" as Visibility,
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
    unlockAt: null,
    visibility: "PRIVATE" as Visibility,
    createdAt: daysAgo(2)
  }
];

export const seedMedia: Record<string, DemoMedia[]> = {
  "evt-europe-2026": [
    photo("m-eu-1", "photo-1499856871958-5b9627545d1a", "Lisbon, golden hour", 118),
    photo("m-eu-2", "photo-1533105079780-92b9be482077", "Pastéis & espresso", 115),
    photo("m-eu-3", "photo-1502602898657-3e91760cbb34", "The Eiffel detour", 110),
    photo("m-eu-4", "photo-1467269204594-9661b134dd2b", "Barcelona market run", 108),
    photo("m-eu-5", "photo-1534430480872-3498386e7856", "Florence rooftops", 100)
  ],
  "evt-graduation": [
    photo("m-grad-1", "photo-1523050854058-8df90110c9f1", "On stage", 45),
    photo("m-grad-2", "photo-1571260899304-425eee4c7efc", "Quad portraits", 45),
    photo("m-grad-3", "photo-1607013251379-e6eecfffe234", "After party", 44)
  ],
  "evt-amal-bday": [
    photo("m-amal-1", "photo-1530103862676-de8c9debad1d", "Candles", 8),
    photo("m-amal-2", "photo-1492684223066-81342ee5ff30", "Rooftop crowd", 8),
    photo("m-amal-3", "photo-1481833761820-0509d3217039", "The cake reveal", 8)
  ],
  "evt-snowboarding": [
    photo("m-snow-1", "photo-1551524559-8af4e6624178", "Top of the lift", 379),
    photo("m-snow-2", "photo-1517490232338-06b912a786b5", "Powder line", 378),
    photo("m-snow-3", "photo-1551698618-1dfe5d97d256", "Lodge beers", 378),
    photo("m-snow-4", "photo-1486919704480-d56c2c6acfc1", "Night ride", 377)
  ],
  "evt-frosh-week": [
    photo("m-frosh-1", "photo-1523580494863-6f3031224c94", "Dorm move-in", 640),
    photo("m-frosh-2", "photo-1541339907198-e08756dedf3f", "Lecture hall day one", 638),
    photo("m-frosh-3", "photo-1517245386807-bb43f82c33c4", "Late-night library", 600)
  ],
  "evt-draft-roadtrip": [
    photo("m-road-1", "photo-1469854523086-cc02fe5d8800", "First overlook", 2),
    photo("m-road-2", "photo-1502920917128-1aa500764cbd", "Gas station diner", 1)
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
  if (!event.unlockAt) return "DRAFT";
  if (event.earlyUnlockedAt) return "UNLOCKED";
  return new Date(event.unlockAt).getTime() <= Date.now() ? "UNLOCKED" : "LOCKED";
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
    state: computeState(event),
    visibility: event.visibility,
    mediaCount: computeMediaCount(event.id, media)
  };
}
