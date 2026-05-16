import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { calculateEarlyUnlockPrice } from "../services/capsules.js";
import { createPaymentIntent } from "../services/payments.js";

export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.post("/early-unlock/quote", async (req, res, next) => {
  try {
    const { eventId } = z.object({ eventId: z.string() }).parse(req.body);
    const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: req.user!.id } });
    if (!event?.unlockAt) return res.status(404).json({ error: "Locked event not found" });

    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
    const quote = calculateEarlyUnlockPrice(event.unlockAt, subscription?.tier ?? "FREE");
    res.json({ eventId, ...quote });
  } catch (error) {
    next(error);
  }
});

billingRouter.post("/early-unlock/intent", async (req, res, next) => {
  try {
    const { eventId } = z.object({ eventId: z.string() }).parse(req.body);
    const event = await prisma.event.findFirst({ where: { id: eventId, ownerId: req.user!.id } });
    if (!event?.unlockAt) return res.status(404).json({ error: "Locked event not found" });

    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user!.id } });
    const quote = calculateEarlyUnlockPrice(event.unlockAt, subscription?.tier ?? "FREE");
    const payment = await createPaymentIntent(req.user!.id, eventId, quote.amountCents);
    res.json({ ...quote, ...payment });
  } catch (error) {
    next(error);
  }
});
