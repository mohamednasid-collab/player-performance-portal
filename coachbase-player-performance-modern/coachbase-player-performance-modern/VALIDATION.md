# Validation — 16 September 2026

- TypeScript project checks: passed.
- Vite production build: passed.
- 84 automated unit/database tests: passed.
- 10 Chrome browser tests: passed.
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

## Detailed assessment update 2.3.0

Current checks: TypeScript, production build, 84 unit/database tests and 10 Chrome browser tests passed. The 47-area mobile form was visually inspected.

The new tests cover the exact rubric counts, Technical 4.1 from ten scores, equal category weighting, legacy category-only records, decimal trend values, missing/extra/invalid area rejection, database-derived averages despite a spoofed supplied total, Manager denial, complete form submission, profile area breakdown, completion count, validation and responsive layout. All three migrations are exercised locally in order; the new migration is applied twice to verify repeat safety.

The 2.3.0 migration has not been applied to the live database, and no production assessments were created. Browser workflows use mocked Supabase responses. Run the new SQL file and perform a real-account smoke test during deployment.
