# Upgrade and deploy

## 1. Upgrade the existing Supabase database

1. Back up the database and pause assessment entry during the upgrade. The old frontend must stop writing 0–10 ratings before the conversion.
2. Open the existing project's **SQL Editor** in Supabase.
3. Run the entire file `supabase/migrations/20260916052019_team_access_five_point_ratings.sql` as one script. It requires the existing CoachPortal tables and enums. Do not run `tests/schema.sql`, reset the database, or recreate accounts.
4. Deploy this frontend, then ask existing users to refresh their browser.

The migration runs in a transaction. It copies original scores to the private table `private.assessment_ratings_before_five_point`, then converts **all existing old-scale scores** using `max(1, min(5, round(old_score / 2)))`. Examples: 0 → 1, 2 → 1, 5 → 3, 7 → 4, 10 → 5. Nulls stay null. This is a nearest-integer conversion because the new scale has five discrete choices. A private marker prevents conversion from running twice. Do not delete the marker and rerun the migration.

It replaces portal-table policies, restricts Team Managers to membership-based read access, permits Admin/authorized Coach writes, protects role/active fields from self-editing, validates that linked players/sessions belong to the same team, and constrains scores to integer values from 1 to 5 (or null for historical missing data). Session deletion keeps assessment history through the existing `ON DELETE SET NULL` relationship. Original ratings backups are not accessible to browser roles.

This migration targets the existing schema inspected on 16 September 2026. Preflight found zero inconsistent player/session/development-plan team links. If someone changes the schema or introduces inconsistent records later, a failed transaction must be investigated rather than bypassing the constraints.

### Team Manager assignment

Existing `team_members` assignments are reused. A manager with no memberships sees no teams. To assign an existing manager, replace the two UUID placeholders and run as an administrator in SQL Editor:

```sql
insert into public.team_members(team_id, user_id, role)
values ('TEAM_UUID'::uuid, 'MANAGER_AUTH_USER_UUID'::uuid, 'manager')
on conflict(team_id, user_id) do update set role = excluded.role;
```

Their `profiles.role` must already be `manager`, and `profiles.active` must be true. Each membership grants that team; remove an obsolete membership when changing assignments. Coaches require profile role `coach` plus a `coach` membership, or ownership through `teams.created_by`. Existing linked player accounts keep access to their own player record; they cannot assess other players.

Role/account administration must use the existing trusted server-side administration path or SQL Editor. Browser users cannot change their own role or active status. The ZIP contained an empty `supabase/functions/admin-create-user/` directory, so this update does not replace or redeploy any existing Edge Functions.

### Check after applying

```sql
select * from private.coachportal_migrations
where key = 'five_point_ratings_v1';

select count(*) as invalid_scores
from public.assessments a
cross join lateral (values(a.technical),(a.tactical),(a.physical),(a.mental),(a.attitude)) v(score)
where score is not null and (score < 1 or score > 5 or score <> trunc(score));
```

Expect one migration marker and zero invalid scores. Sign in as an Admin, an assigned Coach and a Team Manager. Confirm the Manager can open their own player/session but another team's copied URL shows “Page unavailable”. Confirm an Admin/Coach can save a five-point assessment and edit a session. Use a disposable session for the deletion check.

## 2. GitHub

Upload/commit the **contents** of this project folder to your repository root, including `src`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vercel.json` and the migration. Keep `.env.local`, `node_modules`, `dist`, `test-results` and private credentials out of Git. The included `.gitignore` covers these.

## 3. Vercel

Import the GitHub repository into Vercel (or push to its connected production branch):

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | Folder containing `package.json` |
| Node.js | 22.x or 24.x |
| Install command | `npx pnpm@11.19.0 install --frozen-lockfile` |
| Build command | `npm run build` |
| Output directory | `dist` |

Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the required Vercel environments before building. Redeploy after changing them. No secret/service-role key is required. Retain `vercel.json`; its SPA rewrite makes refreshed `/players/:id` and `/sessions/:id` links work. Set your production domain as the Supabase Auth Site URL, retaining any redirect URLs your existing auth workflows need.

Production data conversion is not reversed by a Vercel rollback. Do not redeploy the old 0–10 frontend after conversion. The private score backup is available for a deliberate database recovery if necessary.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [GitHub deployments](https://vercel.com/docs/git/vercel-for-github), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Blank-screen fix (2.1.1)

The previous deployed build had both Supabase environment values missing and threw before React started. This version bundles the original project’s public URL and publishable key as a fallback. If both Vercel variables are absent, no setup is needed. If overriding either value, set both values together and redeploy. The legacy `VITE_SUPABASE_ANON_KEY` is also accepted. Startup failures now display an error screen. Replace the repository files with this version and redeploy; no additional SQL is needed for this fix. The earlier team/rating migration is still required if not already applied.
