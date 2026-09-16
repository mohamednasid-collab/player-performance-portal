# CoachPortal 2.1.1

React + TypeScript + Vite, using the existing Supabase project and login accounts.

## Included changes

- Real, refreshable routes for dashboard, teams, players, player profiles, sessions, session details, performance and reports.
- Dashboard Teams, Training Sessions and Players cards open their respective pages.
- Team Managers can read only assigned teams. UI filtering and database row-level security also block direct links and direct API access to other teams. Managers are read-only.
- Admins can work across teams; Coaches can edit and assess teams they created or have a coach membership for.
- Sessions can be filtered/grouped by team, opened, edited and deleted with explicit confirmation. Deleting a session retains assessments and removes only their session link.
- Player profiles show every player field from the supplied schema, assessment history, category averages, trends and the authorized Review / Assess Player action. Inactive players remain visible with a status label.
- Five-point ratings across forms, validation, storage, averages, dashboards, profiles, charts and CSV reports:
  1. Very Low / Needs Improvement
  2. Below Average
  3. Average
  4. Good
  5. Excellent
- Daily trend averages include all five categories. Missing ratings remain unassessed, not zero. Overall figures average non-null assessment averages; category trends average non-null scores by date.
- Search, responsive layout, Supabase login, team/player/session creation and existing schema names retained. The original Messages/Settings placeholders remain informational; no user-management Edge Function source was present in the ZIP.

## Required first step

Read [DEPLOYMENT.md](DEPLOYMENT.md). Apply the included SQL migration **before** deploying this frontend. No live database migration was applied during development.

## Local setup

Use Node.js 22.12+ (tested with Node 24). In this directory:

```sh
npx pnpm@11.19.0 install --frozen-lockfile
cp .env.example .env.local
npm run dev
```

The original public Supabase URL and publishable key are bundled as a fallback, so this project starts even when Vercel variables are absent. To override the project, set both Supabase values in `.env.local` or Vercel. The supplied example retains the original public configuration; never use a service-role key in the browser.

```sh
npm run typecheck
npm test
npm run build
```

For browser regression tests (isolated mocked Supabase responses):

```sh
npx playwright install chromium
npm run test:e2e
```

Alternatively, with Chrome installed: `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

The local database tests use PGlite (Postgres in a local process). `tests/schema.sql` is a test fixture, not an installation script. See [VALIDATION.md](VALIDATION.md) for results and limits.
