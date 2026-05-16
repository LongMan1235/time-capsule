import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string(),
  API_PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(24),
  APP_URL: z.string().url().default("http://localhost:8081"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("time-capsule-media"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_CDN_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MONTHLY: z.string().optional(),
  AI_SEARCH_URL: z.string().url().default("http://localhost:7000")
});

export const env = schema.parse(process.env);
