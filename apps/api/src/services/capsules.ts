import { prisma } from "../lib/prisma.js";

export function isUnlocked(unlockAt: Date | null, earlyUnlockedAt?: Date | null) {
  return Boolean(earlyUnlockedAt) || !unlockAt || unlockAt.getTime() <= Date.now();
}

export async function assertEventReadable(eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }]
    }
  });

  if (!event) return { ok: false as const, status: 404, error: "Event not found" };
  if (!isUnlocked(event.unlockAt, event.earlyUnlockedAt)) {
    return { ok: false as const, status: 423, error: "Capsule is locked", unlockAt: event.unlockAt };
  }

  return { ok: true as const, event };
}

export function calculateEarlyUnlockPrice(unlockAt: Date, tier: string) {
  const msRemaining = Math.max(0, unlockAt.getTime() - Date.now());
  const remainingDays = Math.ceil(msRemaining / 86_400_000);
  const base = 199;
  const urgency = Math.round(Math.pow(remainingDays, 1.18) * 9);
  const discountPercent = tier === "PREMIUM" ? 30 : tier === "PLUS" ? 15 : 0;
  const amountCents = Math.max(99, Math.round((base + urgency) * (1 - discountPercent / 100)));

  return { remainingDays, amountCents, currency: "usd" as const, discountPercent };
}
