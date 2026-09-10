# CoachLab — Player Performance Portal

A proper React + TypeScript + Supabase rebuild of the original single-file browser-storage portal.

## Included
- Supabase Auth
- Coach / Manager / Player login selector
- Admin-created user accounts with temporary password
- Team management
- Player management
- Training sessions
- Assessments
- Development plans
- Supabase Row Level Security
- Vercel SPA routing

## Setup
1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run dev`.
4. In Vercel, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy.

The database schema and `admin-create-user` Edge Function have already been created/deployed in the connected Supabase project `player-performance-portal`.

## Important
The original uploaded `index.html` was a compiled production bundle. This project recreates the visible portal functionality as maintainable source files rather than trying to de-minify that bundle.
