import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
