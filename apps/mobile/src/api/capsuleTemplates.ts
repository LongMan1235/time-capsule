import type { ContributorScope } from "@time-capsule/shared";

export interface CapsuleTemplate {
  id: string;
  title: string;
  description: string;
  unlockDays: number;
  collectionHours: number;
  contributorScope: ContributorScope;
  mediaCap: number | null;
  mediaCapPerUser: number | null;
  disposableMode: boolean;
  defaultTitle: string;
  promptUnlockNote: string;
}

export const capsuleTemplates: CapsuleTemplate[] = [
  {
    id: "blank",
    title: "Blank capsule",
    description: "Start from scratch — pick everything yourself.",
    unlockDays: 365,
    collectionHours: 168,
    contributorScope: "OWNER_ONLY",
    mediaCap: null,
    mediaCapPerUser: null,
    disposableMode: false,
    defaultTitle: "",
    promptUnlockNote: ""
  },
  {
    id: "first-year-college",
    title: "First Year of College",
    description: "Four-year unlock. Friends contribute. Cap at 100 photos.",
    unlockDays: 365 * 4,
    collectionHours: 365 * 24,
    contributorScope: "FRIENDS",
    mediaCap: 100,
    mediaCapPerUser: 15,
    disposableMode: false,
    defaultTitle: "First Year",
    promptUnlockNote: "Whatever happens, remember the version of you who started this."
  },
  {
    id: "wedding",
    title: "Wedding Day",
    description: "Open link for guests. 1-year unlock. Disposable mode — no peeking.",
    unlockDays: 365,
    collectionHours: 24,
    contributorScope: "OPEN_LINK",
    mediaCap: 500,
    mediaCapPerUser: 10,
    disposableMode: true,
    defaultTitle: "Our wedding",
    promptUnlockNote: "Thank you for being there."
  },
  {
    id: "year-in-review",
    title: "Year in Review",
    description: "Private. Closes Dec 31. Opens next New Year's Eve.",
    unlockDays: 365,
    collectionHours: 24 * 7,
    contributorScope: "OWNER_ONLY",
    mediaCap: null,
    mediaCapPerUser: null,
    disposableMode: false,
    defaultTitle: "2026 in review",
    promptUnlockNote: ""
  },
  {
    id: "birthday",
    title: "Birthday Capsule",
    description: "Friends drop one photo each. Opens on your next birthday.",
    unlockDays: 365,
    collectionHours: 48,
    contributorScope: "FRIENDS",
    mediaCap: 50,
    mediaCapPerUser: 3,
    disposableMode: true,
    defaultTitle: "Birthday",
    promptUnlockNote: "Hi, future birthday-you. Hope this year was kind."
  },
  {
    id: "trip",
    title: "Trip",
    description: "Collaborative. Cap 200. Closes when you're back.",
    unlockDays: 30,
    collectionHours: 24 * 14,
    contributorScope: "FRIENDS",
    mediaCap: 200,
    mediaCapPerUser: 30,
    disposableMode: false,
    defaultTitle: "Trip",
    promptUnlockNote: ""
  }
];
