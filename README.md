# Time Capsule

A scrapbook-on-your-phone for memories that lock until a future date. Built
with Expo (SDK 54) + React Native, an Express/Prisma API skeleton, a
FastAPI AI service skeleton, and a fully self-contained demo data layer so
the app runs end-to-end without any backend.

## Quick start

```bash
git clone https://github.com/LongMan1235/time-capsule.git
cd time-capsule
npm install
cd apps/mobile
npx expo start --ios     # or --android, or scan the QR with Expo Go
```

Sign in with the seeded demo account:

> **rithik** / **mypassword123**

Or type any other email — demo mode is permissive and creates a guest user.

## Stack

- **Mobile**: Expo SDK 54, React Native 0.81, React 19, new architecture on
- **State**: Zustand + AsyncStorage for session and demo persistence
- **Media**: `expo-image`, `expo-image-picker`, `expo-camera`,
  `expo-av` (audio + video), `react-native-svg`
- **Animations**: built-in `Animated` API with native-driven transforms,
  `expo-haptics` for tactile feedback
- **API skeleton**: Express + Prisma + JWT (in `apps/api/`)
- **AI skeleton**: FastAPI in `services/ai-search/`
- **Infra**: Docker Compose with Postgres, Redis, MinIO

## Feature inventory

Everything below works in demo mode (no backend). See
[docs/INFRA_TODO.md](docs/INFRA_TODO.md) for the items that need external
services or native targets.

### Capsule lifecycle
- DRAFT → COLLECTING → LOCKED → UNLOCKED, computed from `collectionClosesAt`
  and `unlockAt` on every read
- Collection window (1 day / 3 days / 1 week / 1 month) auto-seals the
  capsule when it closes
- Unlock date independent of collection close
- Per-event photo cap and per-contributor cap
- Disposable mode (contributors add but can't view until window closes)
- Geo-locked capsules (haversine check on `expo-location`, 100m–1km radius)
- Letter to future-you (text revealed only at the unlock ceremony)
- Spotify URI attached to a capsule, opens via deep link
- Public memorial flag → surfaces in the Explore feed
- Capsule templates: Blank, First Year of College, Wedding, Year in Review,
  Birthday, Trip

### The unlock ceremony
- Wax-seal monogram fades in, cracks in half with gold flash and haptic
- Letter card unfurls below
- 6 simulated friend reactions float up during the reveal
- "Amal, Ryan are here · live" pill suggests synchronous co-watching
- Marks `ceremonySeenAt` so it only plays once per capsule per user

### Photos / videos / voice notes
- In-app Camera with front/back flip and shutter
- Library upload (images + videos)
- Voice notes with full-screen recorder, pulsing ring, preview play/pause
- PhotoViewer with horizontal paging, supports photos, videos, voice notes
- Reactions (❤ 🔥 😂 😮 😢 🎉) toggle per user, aggregated counts
- Comments thread with composer, @mentions highlight in gold
- Long-press a photo (or tap "..." in viewer) for ActionSheet:
  set as capsule cover, delete (own only)
- Per-tile chips show top reaction + comment count

### Social / network
- Friends list (add / remove by username or email)
- Friend feed: chronological timeline of friends' uploaded memories
- Capsule gifts: pick a capsule, send to a username/email with a note
- Share link via native Share with deep-link routing
- Deep linking on `timecapsule://` and `https://timecapsule.app`
- Explore: public-memorial gallery

### Home & retention
- Greeting by display name, time-of-day prefix
- Filter chips: All / Sealed / Open / Drafts with counts
- "On this day" banner with cover thumb when today matches a past
  unlocked capsule
- Upcoming unlocks strip (next 7 days + monthly milestones since sealing)
- "Year recap" link → Instagram-Stories-style auto-advancing slideshow
  of last year's unlocked memories with progress bars + share

### Map
- Real 3D globe via SVG orthographic projection, parallels/meridians
  clipped to visible hemisphere
- Drag to rotate (longitude full, latitude ±80°)
- Gold pins for capsules with coordinates, tap to select + see metadata

### Profile / streak
- Profile screen: avatar, editable display name, email
- Stat tiles: weeks-in-a-row streak, capsules owned, memories added
- Menu rows for Friends, Friend feed, Gift a capsule, Notifications
- Streak counter scans your media timestamps backwards from this week

### Notifications
- expo-notifications scheduler: weekly Sunday-7pm prompt, daily 8:30am
  on-this-day reminder
- Per-channel toggles persisted to AsyncStorage
- "Send a test ping now" button for verification
- Permission flow + warning banner when system notifs are off

### Privacy
- AI search toggle, face recognition toggle
- Profile card → Profile screen
- Account deletion request flow
- Sign out

### Onboarding
- Cinematic empty-polaroid hero (no photo background)
- Auth: segmented Sign in / Create account, gold-tinted demo hint card
  that auto-fills the test credentials
- Personalize step: pick interests (Trips / Birthdays / Weddings /
  Milestones / Everyday) shown once on first launch

### Visual / safe-area
- Scrapbook aesthetic: paper texture overlay, tilted polaroid cards
  with washi-tape corners
- Floating blurred tab bar, respects bottom safe-area inset
- All screens use `useSafeAreaInsets()` — text never collides with the
  Dynamic Island, status bar, or home indicator
- Stack transitions tuned per route (fade modals, slide-right for
  navigation, slide-up for create/camera/voice/gift/personalize/paywall)

## Repo layout

```
apps/
  mobile/            Expo + React Native client (this is the live app)
  api/               Express + Prisma + JWT skeleton (not wired by default)
packages/
  shared/            Shared TypeScript types
services/
  ai-search/         FastAPI skeleton for semantic + face search
infra/
  docker-compose.yml Postgres + Redis + MinIO for local dev
docs/
  INFRA_TODO.md      What needs accounts/native targets to enable
```

## Switching from demo to real backend

When you're ready to wire up the actual API:

1. `npm run docker:up` (from repo root)
2. `npm run db:generate -w apps/api && npm run db:migrate -w apps/api`
3. `npm run dev -w apps/api`
4. In `apps/mobile/app.json`, change `extra.apiMode` from `"demo"` to
   `"remote"`
5. Reload the Expo app

The client `api()` helper in
[apps/mobile/src/api/client.ts](apps/mobile/src/api/client.ts) routes
between the in-memory demo handler and the real fetch call based on that
flag.

## Privacy

- AI features are opt-in per user
- End-to-end encrypted storage path (handled at the API layer when enabled)
- Face identities scoped to a single account
- GDPR-style account deletion flow
