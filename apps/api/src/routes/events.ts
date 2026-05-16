import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { assertEventReadable, isUnlocked } from "../services/capsules.js";

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

const eventSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  coverImageKey: z.string().optional(),
  eventDate: z.coerce.date(),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  visibility: z.enum(["PRIVATE", "FRIENDS", "COLLABORATIVE"]).default("PRIVATE"),
  unlockAt: z.coerce.date().optional()
});

eventsRouter.get("/", async (req, res) => {
  const events = await prisma.event.findMany({
    where: { OR: [{ ownerId: req.user!.id }, { collaborators: { some: { userId: req.user!.id } } }] },
    include: { _count: { select: { media: true } } },
    orderBy: { eventDate: "desc" }
  });

  res.json({
    events: events.map((event) => ({
      ...event,
      mediaCount: event._count.media,
      state: isUnlocked(event.unlockAt, event.earlyUnlockedAt) ? "UNLOCKED" : "LOCKED"
    }))
  });
});

eventsRouter.post("/", async (req, res, next) => {
  try {
    const body = eventSchema.parse(req.body);
    const event = await prisma.event.create({
      data: {
        ...body,
        ownerId: req.user!.id,
        lockedAt: body.unlockAt ? new Date() : null
      }
    });
    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/map", async (req, res) => {
  const events = await prisma.event.findMany({
    where: {
      ownerId: req.user!.id,
      latitude: { not: null },
      longitude: { not: null }
    },
    select: {
      id: true,
      title: true,
      coverImageKey: true,
      locationName: true,
      eventDate: true,
      unlockAt: true,
      earlyUnlockedAt: true,
      latitude: true,
      longitude: true
    }
  });
  res.json({ events });
});

eventsRouter.get("/:eventId", async (req, res) => {
  const access = await assertEventReadable(req.params.eventId, req.user!.id);
  if (!access.ok) return res.status(access.status).json(access);

  const event = await prisma.event.findUnique({
    where: { id: req.params.eventId },
    include: {
      media: { orderBy: { capturedAt: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      collaborators: { include: { user: true } }
    }
  });
  res.json({ event });
});

eventsRouter.post("/:eventId/lock", async (req, res, next) => {
  try {
    const body = z.object({ unlockAt: z.coerce.date().refine((date) => date > new Date()) }).parse(req.body);
    const result = await prisma.event.updateMany({
      where: { id: req.params.eventId, ownerId: req.user!.id },
      data: { unlockAt: body.unlockAt, lockedAt: new Date(), earlyUnlockedAt: null }
    });
    if (!result.count) return res.status(404).json({ error: "Event not found" });

    const event = await prisma.event.findUniqueOrThrow({ where: { id: req.params.eventId } });
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:eventId/comments", async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().min(1).max(1000) }).parse(req.body);
    const access = await assertEventReadable(req.params.eventId, req.user!.id);
    if (!access.ok) return res.status(access.status).json(access);

    const comment = await prisma.comment.create({
      data: { eventId: req.params.eventId, authorId: req.user!.id, body: body.body }
    });
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});
