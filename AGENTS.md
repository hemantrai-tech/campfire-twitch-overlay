# Campfire architecture and development rules

## Architecture

- `src/core`: pure streak, fire, leaderboard, poll, recap-stat, and card SVG logic.
- `src/db/schema.sql` and `src/db/index.ts`: SQLite schema, versioned additive migration, constraints, and indexes.
- `src/twitch`: OAuth token refresh, Helix API, and EventSub WebSocket subscriptions/reconnect handling.
- `src/server.ts`: Fastify routes, access control, simulation commands, event processing, persistence, and SSE.
- `src/web/public`: plain HTML/CSS/JS dashboard and OBS overlay.
- `scripts`: repeatable seed data and build asset copying.
- `test`: Vitest domain, SQLite-constraint, and PNG verification tests.

## Rules

- Every new feature must include tests for its business behavior, validation, and important edge cases.
- Keep domain rules deterministic and independent from Fastify and browser state.
- Persist stream, event, attendance, poll, and recap data in SQLite. Use transactions for related mutations and unique constraints for idempotency.
- Keep the simulation namespace isolated from Twitch streamer records. Demo reset must only delete demo-owned data.
- Validate all public input and enforce authorization on the server. Overlay tokens grant read-only access.
- Never commit `.env`, access tokens, refresh tokens, or database files.
- When a check cannot run because a runtime or service is unavailable, report it as unverified rather than assuming it passed.
