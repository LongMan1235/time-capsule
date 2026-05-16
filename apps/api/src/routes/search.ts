import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { searchMemories } from "../services/ai.js";

export const searchRouter = Router();
searchRouter.use(requireAuth);

searchRouter.post("/", async (req, res, next) => {
  try {
    const body = z.object({ query: z.string().min(2).max(300) }).parse(req.body);
    const results = await searchMemories(req.user!.id, body.query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});
