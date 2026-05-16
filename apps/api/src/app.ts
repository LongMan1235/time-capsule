import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.js";
import { billingRouter } from "./routes/billing.js";
import { eventsRouter } from "./routes/events.js";
import { mediaRouter } from "./routes/media.js";
import { privacyRouter } from "./routes/privacy.js";
import { searchRouter } from "./routes/search.js";
import { errorHandler } from "./middleware/errors.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));

app.get("/health", (_req, res) => res.json({ ok: true, service: "time-capsule-api" }));
app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/media", mediaRouter);
app.use("/search", searchRouter);
app.use("/billing", billingRouter);
app.use("/privacy", privacyRouter);
app.use(errorHandler);
