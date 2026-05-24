# Infrastructure / native items still to enable

Everything in the demo mode works end-to-end. The items below need either an
external account or a native Xcode/Android Studio target — they cannot be
configured purely from the codebase. Each section lists exactly what you need
and the file paths to wire it up.

---

## 9. AR location pin (capsule only opens if you point camera at the place)

Requires `expo-three` + a 3D scene at the location. Heavy lift, deferred.

**To enable later:**
```bash
npx expo install expo-three three @react-three/fiber expo-gl
```
Then build a new `ARCaptureScreen` that overlays a 3D pin on the camera feed
when the user is inside `geoLockRadiusMeters` of the capsule's pin. Currently
the geo-lock flag already gates EventDetail content; AR is purely a
delight-layer on top.

## 10. Time-warped audio (voice notes that fade as they age)

Needs offline audio DSP. Easiest path: render the waveform with a low-pass
filter via `expo-av`'s `setProgressUpdateIntervalAsync` + Web Audio (web only)
or a native module. Skip unless you're shipping.

## 24. Lock-screen widget (countdown to next unlock)

iOS-only, needs a WidgetKit extension target in Xcode. Expo can't generate
widget extensions from the JS bundle.

**Steps when you eject / dev-build:**
1. `npx expo prebuild` to generate the `ios/` folder.
2. In Xcode, File → New → Target → Widget Extension. Name it
   `TimeCapsuleWidget`.
3. Implement the widget in Swift using WidgetKit. Read the next unlock date
   from an App Group shared with the main app (`group.app.timecapsule.mobile`).
4. From the RN side, write the next unlock date to that App Group via
   `react-native-shared-group-preferences` or `expo-application` + a small
   native module.

Plan on 1–2 days of native work.

## 25. Apple Watch complication

Similar to widgets: requires a WatchKit Extension target in Xcode and a Swift
implementation. Share data via App Groups. Same 1–2 days of native work.

## 26. iMessage extension

`MSMessagesAppViewController` target in Xcode. Renders a custom bubble in
iMessage that opens the capsule on tap. Native-only, ~2 days.

## 27. Share extension (system Share sheet → Time Capsule)

iOS: Share Extension target. Android: `<intent-filter>` for `SEND` in
`AndroidManifest.xml`. Both need the native folders generated via
`expo prebuild`. After ejecting:

- iOS: New target → Share Extension. Use `appGroupIdentifier` to enqueue the
  shared photo URL into AsyncStorage's app-group-backed store.
- Android: edit the generated `AndroidManifest.xml` to add:
  ```xml
  <intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
  </intent-filter>
  ```
  Then handle the intent in the launched activity and route into
  `CreateEventScreen` with a pre-attached media URI.

## 28. Run the actual Express API (replace demo handler)

The full API already exists in `apps/api/`. Switch to it:

1. Boot infra: `npm run docker:up` from repo root (Postgres + Redis + MinIO).
2. `npm run db:generate -w apps/api` then `npm run db:migrate -w apps/api`.
3. `npm run dev -w apps/api` — server listens on `:4000`.
4. In `apps/mobile/app.json`, change `extra.apiMode` from `"demo"` to
   `"remote"`. Re-launch the app.

The mobile client's `api()` function in
`apps/mobile/src/api/client.ts` already routes between demo and remote based
on that flag. Demo data won't migrate; users sign in fresh against Postgres.

Caveats: every demo-only endpoint added in this session (collection windows,
contributor caps, gifts, friends, on-this-day, anniversaries, recap, share,
reactions, comments, cover, ceremony-seen, public explore, stats) needs an
Express implementation matching the same shape. About 1–2 days of backend
work, mostly straightforward Prisma queries.

## 29. Real S3 / R2 uploads

API already generates presigned PUT URLs via `@aws-sdk/s3-request-presigner`.
Wire it:

1. Create an S3 (or Cloudflare R2) bucket.
2. Set `S3_*` env vars in `apps/api/.env`:
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`
   - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
   - `S3_PUBLIC_CDN_URL` (the public read URL prefix)
3. Configure CORS on the bucket to allow `PUT` from your app domain.
4. The mobile `uploads.ts` already does the presign → PUT → record flow.

## 30. Real Stripe (early-unlock + Plus/Premium subscriptions)

1. Sign up at stripe.com, get test secret + publishable keys.
2. Create products: `Plus`, `Premium`, plus a one-off SKU template for early
   unlock (the price is computed server-side).
3. `apps/api/.env`:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - `STRIPE_PRICE_PREMIUM_MONTHLY=price_...`
4. Mobile: add `STRIPE_PUBLISHABLE_KEY=pk_test_...` to the Expo config's
   `extra`. The `@stripe/stripe-react-native` lib is already installed.
5. In `apps/api/src/routes/billing.ts` the early-unlock route exists but
   doesn't yet call `stripe.paymentIntents.create()`. Wire it.
6. Add a webhook endpoint at `POST /billing/webhook` that flips
   `subscription.tier` on `customer.subscription.updated`.

## 31. Real Google / Apple sign-in

The OAuth buttons currently `Alert("Coming soon")`. To enable:

**Google**
1. Create OAuth client at console.cloud.google.com (iOS + Android + Web).
2. Add `GOOGLE_CLIENT_ID` and platform-specific reversed-domain redirect URIs
   to `apps/mobile/app.json`.
3. `apps/mobile/src/screens/AuthScreen.tsx` — swap the Google button's
   `onPress` to use `expo-auth-session/providers/google`'s
   `useAuthRequest()`. POST the returned `idToken` to `/auth/oauth` with
   `provider: "GOOGLE"`. API already handles this route.

**Apple**
1. apple.com developer console → Sign in with Apple capability on your
   bundle ID. Register a Services ID for the web fallback.
2. `npx expo install expo-apple-authentication`.
3. AuthScreen — swap the Apple button onPress to call
   `AppleAuthentication.signInAsync({ requestedScopes: [...] })`. Send the
   credential to `/auth/oauth` with `provider: "APPLE"`.

## 32. Real AI search

`services/ai-search/` is a FastAPI skeleton. To make it real:

1. Add a vector store. Two options:
   - **pgvector** in the same Postgres: `CREATE EXTENSION vector;` and add an
     `embedding vector(768)` column to `Media`.
   - **Pinecone / Weaviate** as a managed service — set `PINECONE_API_KEY`.
2. On every new media upload, the API enqueues an embedding job to
   `services/ai-search` via a queue (Redis BullMQ).
3. The Python service computes CLIP image + caption embeddings (use
   `transformers` + `clip-vit-base-patch32`) and writes them to the store.
4. The search route in `apps/api/src/routes/search.ts` queries the vector
   store with a text-embedding of the query.

Face recognition (item #7 in the original spec) follows the same architecture
but uses `facenet-pytorch` for face embeddings and clusters per-user.

Plan on 2–3 days of backend ML work to get from skeleton to "actually
returns relevant results."

---

## Forward-compatibility maintenance

These are warnings, not bugs — everything still works on SDK 54 today, but
they should be addressed before SDK 55 to avoid future breakage.

### expo-av → expo-audio + expo-video

`expo-av` was deprecated in SDK 54 and will be removed in SDK 55. The
features that use it today (still working):

- `apps/mobile/src/screens/VoiceNoteScreen.tsx` — uses `Audio.Recording`
  and `Audio.Sound`. Migrate to `expo-audio`'s `useAudioRecorder()` and
  `useAudioPlayer()` hooks.
- `apps/mobile/src/screens/PhotoViewerScreen.tsx` — uses `Audio.Sound` for
  in-thread voice note playback and `Video` from expo-av for video tiles.
  Migrate audio to `expo-audio`'s `useAudioPlayer()` and video to
  `expo-video`'s `VideoView` + `useVideoPlayer()`.

```bash
npx expo install expo-audio expo-video
npm uninstall expo-av
```

The new APIs are hook-based — about 1-2 hours of focused refactoring.

### expo-notifications in Expo Go

`expo-notifications` will not schedule pushes inside Expo Go (limitation
since SDK 53). The current code (`apps/mobile/src/api/notifications.ts`)
wraps every call in try/catch so it no-ops gracefully in Expo Go.

To get real scheduled notifications, ship a development build:

```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

The user can then toggle the notification preferences and the schedules
will actually fire.

## What's deliberately stubbed in this session

Most of the buildable items (1–8, 11–23, 33–34) shipped as working features
in demo mode. They persist to AsyncStorage, animate, and respond to user
input. The seams to swap the backend in are:

| Concern                | File                                            | Toggle                                       |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- |
| API calls              | `apps/mobile/src/api/client.ts`                 | `extra.apiMode` in `app.json`                |
| Demo persistence       | `apps/mobile/src/api/demo.ts`                   | n/a (used only when apiMode = "demo")        |
| Demo store schema      | `apps/mobile/src/api/demoData.ts`               | bump `STORE_VERSION` when changing shapes    |
| Notification schedule  | `apps/mobile/src/api/notifications.ts`          | runs on Home mount, idempotent               |
| Native permissions     | `apps/mobile/app.json` plugins block            | re-run `expo prebuild` if you eject          |
