# CoachPortal 2.3.0

React + TypeScript + Vite, using the existing Supabase project and login accounts.

## Detailed assessments (2.3.0)

All 47 requested observable areas and their guidance are included: Technical (10), Tactical (11), Physical (8), Mental (8), Attitude (10). Every new detailed assessment requires a 1–5 score for each area. The form shows completion counts and live category-average previews.

The same labels apply to every area:

1. Very Low / Needs Significant Improvement
2. Below Average / Needs Improvement
3. Average / Meets Expected Level
4. Good / Above Expected Level
5. Excellent / Consistently High Level

A category rating is the arithmetic mean of its area scores. Overall performance is the mean of the five category ratings, giving each category equal weight regardless of its number of areas. Profiles, dashboards and trends retain decimal averages, displayed to one decimal place. CSV category averages use two decimals and include all 47 individual area scores.

Profiles show both category summaries and area averages, plus expandable area ratings for each detailed assessment in history. Existing assessments are preserved as category-only; area averages exclude those records rather than inventing sub-scores. Existing category ratings still contribute to historical category summaries and trends.

**Required before deployment:** run `supabase/migrations/20260916091633_detailed_player_assessments.sql` after the two earlier migrations. If already on 2.2.0, only the new migration is needed. It adds validated JSON area scores and calculates category averages inside the database. No live database migration has been applied by this update.

## Player update (2.2.0)

- Fixes the RLS failure when adding a player and returning the saved row.
- Admins and authorized Coaches can add players and edit them from **Player Profile → Edit Player**. Team Managers remain read-only.
- Name, Nick Name, Date of birth, Mobile number, Position, Preferred foot, Height (cm), Weight (kg), and automatic BMI are included. Existing jersey number, notes, active status and account link are retained.
- BMI updates while entering measurements and is recalculated from saved height/weight on the profile; it is not an independently editable or stale stored value.
- Adult (20+) BMI: below 18.5 orange; 18.5–under 25 green; 25+ red. Youth BMI has no category, as requested. Missing date of birth also leaves the category neutral.
- **Required:** run `supabase/migrations/20260916062343_player_details_and_insert_visibility.sql` before deploying this version. If the earlier rating/access migration is already installed, run only this new SQL file.

## Included changes

- Real, refreshable routes for dashboard, teams, players, player profiles, sessions, session details, performance and reports.
- Dashboard Teams, Training Sessions and Players cards open their respective pages.
- Team Managers can read only assigned teams. UI filtering and database row-level security also block direct links and direct API access to other teams. Managers are read-only.
- Admins can work across teams; Coaches can edit and assess teams they created or have a coach membership for.
- Sessions can be filtered/grouped by team, opened, edited and deleted with explicit confirmation. Deleting a session retains assessments and removes only their session link.
- Player profiles show every player field from the supplied schema, assessment history, category averages, trends and the authorized Review / Assess Player action. Inactive players remain visible with a status label.
- Five-point ratings across forms, validation, storage, averages, dashboards, profiles, charts and CSV reports:
  1. Very Low / Needs Significant Improvement
  2. Below Average / Needs Improvement
  3. Average / Meets Expected Level
  4. Good / Above Expected Level
  5. Excellent / Consistently High Level
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
