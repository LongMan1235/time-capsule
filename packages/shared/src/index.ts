export type Visibility = "PRIVATE" | "FRIENDS" | "COLLABORATIVE";
export type CapsuleState = "DRAFT" | "COLLECTING" | "LOCKED" | "UNLOCKED";
export type MediaKind = "PHOTO" | "VIDEO" | "VOICE_NOTE";
export type SubscriptionTier = "FREE" | "PLUS" | "PREMIUM";
export type ContributorScope = "OWNER_ONLY" | "FRIENDS" | "OPEN_LINK";

export const storageTiersGb: Record<SubscriptionTier, number> = {
  FREE: 5,
  PLUS: 100,
  PREMIUM: 1000
};

export interface EventSummary {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  eventDate: string;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  unlockAt?: string | null;
  collectionClosesAt?: string | null;
  state: CapsuleState;
  visibility: Visibility;
  contributorScope: ContributorScope;
  mediaCount: number;
  mediaCap?: number | null;
  mediaCapPerUser?: number | null;
  unlockNote?: string | null;
  unlockNoteAuthor?: string | null;
  disposableMode?: boolean;
  geoLockRadiusMeters?: number | null;
  ceremonySeenAt?: string | null;
  isPublic?: boolean;
  templateId?: string | null;
  spotifyUri?: string | null;
  spotifyTitle?: string | null;
}

export interface MediaReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface MediaComment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; username: string; displayName: string; avatarUrl?: string };
}

export interface MediaDetail {
  id: string;
  url: string;
  kind: "PHOTO" | "VIDEO" | "VOICE_NOTE";
  caption?: string | null;
  capturedAt?: string | null;
  addedBy: { id: string; username: string; displayName: string; avatarUrl?: string };
  reactions: MediaReaction[];
  comments: MediaComment[];
}

export interface MemorySearchResult {
  mediaId: string;
  eventId: string;
  score: number;
  reason: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface EarlyUnlockQuote {
  eventId: string;
  remainingDays: number;
  amountCents: number;
  currency: "usd";
  discountPercent: number;
}
