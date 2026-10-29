# Campfire

Campfire is a Twitch community engine for small streamers. **Every message keeps the fire alive.** It includes a persistent simulation dashboard, OBS overlay, attendance tracking, intermission polls, and personal recap cards.

## Requirements and setup

- Node.js 20 or newer and npm.
- Twitch developer credentials are optional for Simulation Mode.

```sh
npm install
cp .env.example .env   # optional for Simulation Mode; required for Twitch login
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Campfire creates `campfire.sqlite` and its tables on first start. For a separate seeded historical demo stream, run `npm run seed`. The dashboard’s **Reset demo data** button only clears rows owned by the simulation account.

For a populated first run, use `npm run dev:demo` instead of `npm run dev`. This seeds four sample streams, five demo viewers, attendance gaps and message activity, then starts the server with a live demo stream ready to explore. Open the dashboard at `http://localhost:3000`; open it through this URL rather than by double-clicking the HTML file so its controls can reach Fastify. The demo uses the same SQLite-backed state, API routes, event handling, and live updates as the dashboard’s simulation controls.

`npm run build` compiles TypeScript and copies the SQL schema and browser assets. `npm start` starts the production build. Set `DATABASE_PATH` to a durable local file. `npm run typecheck`, `npm run lint`, and `npm test` run the checks.

## Try Simulation Mode

No Twitch account or credentials are needed.

1. Open the dashboard and select **Start demo stream**.
2. Send a message as one of the named demo viewers. Messages use the same normalized chat event handler as Twitch events and are stored in SQLite. Chat activity changes the fire and the viewer leaderboard.
3. Start an intermission, then cast poll votes as demo viewers. The first vote from each viewer is locked for that poll; percentages update through SSE.
4. End the stream. Completed stream records remain in history and each participating demo viewer gets a recap link and downloadable 1080 × 1920 PNG.
5. Refresh the dashboard to confirm records persist. **Reset demo data** removes only the simulation stream, events, attendance, intermissions, and votes.

The dashboard, seeded stream, and recap pages identify simulated data explicitly. Sample viewers and events are demonstration data, not Twitch activity.

## Streamer and OBS setup

1. Create an application at [Twitch Developer Console](https://dev.twitch.tv/console). Add the callback URL `http://localhost:3000/auth/twitch/callback` (use your production URL when hosted).
2. Put `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI`, `SESSION_SECRET` (at least 32 random characters), and `PUBLIC_URL` in `.env`. Never commit `.env`.
3. Open `/auth/twitch`, approve the requested permissions, then copy the private overlay URL shown after login.
4. In OBS, add a Browser Source with that URL. Use 1920 × 1080 or 1280 × 720 and enable transparency. Keep the random overlay token private; it grants read-only access to that channel’s overlay.
5. Keep Campfire running during the stream. Use `!streak` in chat. The broadcaster or a moderator can use `!brb` and `!back`; viewers vote A, B, or C while the poll is open.

Twitch mode uses EventSub WebSocket transport, so it does not require a public webhook. The chat subscription is `channel.chat.message` v1 and requests `user:read:chat`. Replies use Helix `POST /helix/chat/messages` and `user:write:chat`. Stream lifecycle subscriptions are `stream.online` v1 and `stream.offline` v1; Twitch lists no scopes for these events. On login and restart, Campfire also checks the current stream via Get Streams so a stream already in progress can be tracked. OAuth tokens remain server side and are encrypted in SQLite using AES-256-GCM with a key derived from `SESSION_SECRET`.

The OAuth callback can also authenticate a viewer before opening `/recap/:streamId/:viewer`; the route checks that the signed-in Twitch account matches the viewer ID. Set `PUBLIC_URL` and Twitch’s callback URL to the same HTTPS origin for deployment.

## Architecture

- `src/core`: pure streak, fire, leaderboard, voting, viewer-stat, and social-card SVG logic.
- `src/db/schema.sql` and `src/db/index.ts`: SQLite schema and additive compatibility migrations.
- `src/twitch`: OAuth token/Helix helpers and EventSub WebSocket lifecycle.
- `src/server.ts`: Fastify routes, persistence, simulation, Twitch event processing, authorization, and SSE.
- `src/web/public`: plain HTML/CSS/JS dashboard and transparent OBS overlay.
- `test`: Vitest domain and PNG output tests.

`/health` reports app health. Public routes have rate limiting and validate request fields. Streamer-only chat commands check Twitch broadcaster/moderator badges. Poll options and one-vote-per-viewer rules are enforced in SQLite. Chat event IDs are unique to make repeated EventSub deliveries idempotent. Fire contributions are capped at five messages per viewer per five-minute decay window, then fade linearly to zero.

## Production notes and limitations

- SQLite is suitable for a single app instance on persistent local storage. Multiple instances need shared database/locking and a shared real-time event broker; the current in-memory SSE and rate-limit registries are process-local. Fastify sessions also use the default in-memory store, so production deployments should configure a persistent session store.
- The demo dashboard is an intentionally public simulation control surface. Actual Twitch stream management controls are not exposed in that demo UI. Real Twitch OAuth, EventSub, overlay reads, `!streak`, and private recap access are separate paths.
- Session cookies are secure in production. Set a stable `SESSION_SECRET`; without one, Twitch login is disabled and an ephemeral key is used for Simulation Mode. Rotating this key requires viewers and streamers to log in again and Twitch tokens to be reauthorized.
- Configure Twitch credentials and consent in your own developer application. This project contains no credentials.
- Migrations currently cover additive schema compatibility in code; there is no migration runner or rollback tool yet.

## How Codex was used

Codex checked Twitch’s current EventSub, scope, and chat API documentation, built the initial Fastify/SQLite project, then added the simulation-first dashboard, event pipeline, core rules, tests, and setup documentation. Run the listed checks locally before deploying.
