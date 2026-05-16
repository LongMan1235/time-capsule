import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { createPresignedUpload, publicMediaUrl } from "../services/media.js";
import { queueMediaIndex } from "../services/ai.js";

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

mediaRouter.post("/presign", async (req, res, next) => {
  try {
    const body = z
      .object({
        eventId: z.string(),
        fileName: z.string(),
        contentType: z.string(),
        kind: z.enum(["PHOTO", "VIDEO", "VOICE_NOTE"])
      })
      .parse(req.body);

    const event = await prisma.event.findFirst({
      where: { id: body.eventId, OR: [{ ownerId: req.user!.id }, { collaborators: { some: { userId: req.user!.id } } }] }
    });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const key = `${req.user!.id}/${body.eventId}/${randomUUID()}-${body.fileName}`;
    const uploadUrl = await createPresignedUpload(key, body.contentType);

    res.json({ uploadUrl, key, publicUrl: publicMediaUrl(key) });
  } catch (error) {
    next(error);
  }
});

mediaRouter.post("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        eventId: z.string(),
        storageKey: z.string(),
        kind: z.enum(["PHOTO", "VIDEO", "VOICE_NOTE"]),
        caption: z.string().optional(),
        capturedAt: z.coerce.date().optional(),
        durationMs: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        sizeBytes: z.number().nonnegative()
      })
      .parse(req.body);

    const media = await prisma.media.create({
      data: {
        ...body,
        uploadedById: req.user!.id,
        url: publicMediaUrl(body.storageKey)
      }
    });
    await queueMediaIndex(media.id);

    res.status(201).json({ media });
  } catch (error) {
    next(error);
  }
});
