# Validation — 16 September 2026

- TypeScript project checks: passed.
- Vite production build: passed.
- 63 automated unit/database tests: passed.
- 9 Chrome browser tests: passed.
- Mobile player profile screenshot inspected at 390 × 844: content fits the viewport; wide assessment history scrolls inside its table.

Database tests execute the actual migration twice against a local Postgres-compatible PGlite database with a fixture matching the inspected Supabase tables, roles, enums and relationships. They verify conversion, original-score backup, repeat safety, null handling, invalid scores, Admin/Coach writes, Manager read-only access, inactive/unassigned denial, blocked self-promotion, cross-team player/session links, anonymous access denial, linked-player access, and assessment preservation after session deletion.

Browser tests cover dashboard navigation, session filtering/grouping, full player profiles, all five assessment fields, saved history, session editing, deletion confirmation/cancellation, retained assessments, Manager restrictions and direct URLs, CSV download, empty report ranges and mobile layout. These use mocked Supabase API responses; they do not mutate the connected database.

The connected Supabase schema, current RLS policies, helper functions and constraints were inspected read-only. Preflight checks found zero mismatched assessment/player links, assessment/session links, development-plan/player links, and unassigned active managers. The migration has NOT been applied to production, and deployment has NOT been performed. A real-account smoke test after migration remains part of deployment.

The supplied archive had no Edge Function implementation, historical migration files or live database dump. The included migration upgrades the existing schema; it is not a fresh-database bootstrap.

## Startup fix 2.1.1

Inspected the deployed JavaScript and confirmed both Supabase environment values compiled to undefined, causing a module-level exception. Added the original public project configuration as a fallback, complete-override validation, legacy anon-key support, and a React startup error boundary. Type checks, build, 39 unit/database tests, and 7 browser tests pass. A separate production-preview test also passes using a build with both Supabase environment variables absent: login is visible and no uncaught browser errors occur.

## Player profile update 2.2.0

The previous database policy failure was reproduced locally with an authorized `INSERT INTO players ... RETURNING *`. After applying the new migration, the same operations succeed for Admin and assigned Coach users. Managers remain unable to insert or edit players, and Coaches cannot create players in other teams. Both migrations were tested for repeat application in their required order.

Current results: 63 unit/database tests, 9 browser tests, a separate production startup test, TypeScript checks and production build all pass. Browser coverage includes adding a player, reopening and editing their details, persisted nickname/mobile/measurements, all three live adult BMI color states, and youth BMI without a category. The new migration has not been applied to the live database; run the new SQL file before deploying the frontend.
