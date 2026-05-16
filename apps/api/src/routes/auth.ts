import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword, signAuthToken, verifyPassword } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(80)
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        username: body.username,
        displayName: body.displayName,
        passwordHash,
        profile: { create: {} },
        subscription: { create: { tier: "FREE" } }
      }
    });

    res.status(201).json({ token: signAuthToken({ sub: user.id, username: user.username }), user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user?.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ token: signAuthToken({ sub: user.id, username: user.username }), user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/oauth", async (req, res, next) => {
  try {
    const body = z
      .object({
        provider: z.enum(["GOOGLE", "APPLE"]),
        providerUserId: z.string(),
        email: z.string().email(),
        username: z.string().min(3).optional(),
        displayName: z.string().default("Time Capsule User")
      })
      .parse(req.body);

    const user = await prisma.user.upsert({
      where: { email: body.email.toLowerCase() },
      update: {},
      create: {
        email: body.email.toLowerCase(),
        username: body.username ?? `user_${randomUUID().slice(0, 8)}`,
        displayName: body.displayName,
        authAccounts: { create: { provider: body.provider, providerUserId: body.providerUserId } },
        profile: { create: {} },
        subscription: { create: { tier: "FREE" } }
      }
    });

    res.json({ token: signAuthToken({ sub: user.id, username: user.username }), user });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { profile: true, subscription: true }
  });
  res.json({ user });
});
