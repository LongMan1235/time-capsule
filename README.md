# Time Capsule

Time Capsule is a mobile-first social memory app for creating event-based digital capsules that unlock in the future. The scaffold includes an Expo app, Express API, Prisma/PostgreSQL schema, media upload pipeline, Stripe subscription and early-unlock hooks, notification jobs, and an AI search service boundary.

## Stack

- Mobile: Expo, React Native, NativeWind-ready styling, React Navigation
- API: Node.js, Express, Prisma, PostgreSQL, JWT auth
- Storage: S3/R2-compatible presigned uploads
- Payments: Stripe subscriptions and early unlock intents
- Notifications: Expo push notification adapter
- AI: Python FastAPI service boundary for semantic search, face clustering, and active learning
- Infra: Docker Compose for Postgres, Redis, MinIO, API, and AI service

## Quick Start

1. Copy `.env.example` to `.env` and fill secrets as needed.
2. Install dependencies with `npm install`.
3. Start local infrastructure with `npm run docker:up`.
4. Generate Prisma client with `npm run db:generate`.
5. Run migrations with `npm run db:migrate`.
6. Start the API and mobile app with `npm run dev`.

## Product Notes

Locked capsules protect media until `unlockAt` unless the owner purchases an early unlock. The API enforces access rules centrally, so the client never decides whether locked media is visible. AI indexing is opt-in per user and per event, and the schema keeps face identities, embeddings, consent, correction events, and deletion state explicit.

## Key Folders

- `apps/mobile`: Expo app and product UI
- `apps/api`: Express API, Prisma schema, providers, jobs
- `packages/shared`: Shared API types and constants
- `services/ai-search`: FastAPI service boundary for vector and face search
- `infra`: Local Docker setup
