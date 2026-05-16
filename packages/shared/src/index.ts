export type Visibility = "PRIVATE" | "FRIENDS" | "COLLABORATIVE";
export type CapsuleState = "DRAFT" | "LOCKED" | "UNLOCKED";
export type MediaKind = "PHOTO" | "VIDEO" | "VOICE_NOTE";
export type SubscriptionTier = "FREE" | "PLUS" | "PREMIUM";

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
  state: CapsuleState;
  visibility: Visibility;
  mediaCount: number;
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
