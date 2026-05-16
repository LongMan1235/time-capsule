import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const privacyRouter = Router();
privacyRouter.use(requireAuth);

privacyRouter.patch("/ai-consent", async (req, res, next) => {
  try {
    const body = z.object({ aiOptIn: z.boolean(), faceRecognitionOptIn: z.boolean() }).parse(req.body);
    const profile = await prisma.profile.update({
      where: { userId: req.user!.id },
      data: body
    });
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

privacyRouter.post("/delete-request", async (req, res) => {
  await prisma.privacyRequest.create({
    data: { userId: req.user!.id, kind: "DELETE_ACCOUNT", status: "PENDING" }
  });
  res.status(202).json({ status: "PENDING" });
});
