import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "../services/notifications.js";

export async function notifyOpeningCapsules() {
  const soon = new Date(Date.now() + 3 * 86_400_000);
  const events = await prisma.event.findMany({
    where: { unlockAt: { lte: soon, gt: new Date() }, earlyUnlockedAt: null },
    include: { owner: { include: { profile: true } } }
  });

  await Promise.all(
    events.map((event) => {
      const token = event.owner.profile?.expoPushToken;
      if (!token) return undefined;
      return sendPushNotification(
        token,
        "A capsule is almost ready",
        `${event.title} opens soon. The wait is almost over.`,
        { eventId: event.id }
      );
    })
  );
}
