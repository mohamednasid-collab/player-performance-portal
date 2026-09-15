# CoachPortal — Player Performance Portal

Updated React + TypeScript + Supabase version styled to match the supplied CoachPortal dashboard reference.

## What changed
- Dark professional left navigation
- Global search/header area
- Dashboard summary cards
- Team overview panel
- Upcoming training sessions panel
- Player performance table
- Assessment trend chart
- Responsive tablet/mobile layout
- Supabase-backed Teams, Players, Training Sessions and Assessments
- Existing Supabase login retained

## Deploy
1. Upload all files to the root of your GitHub repository.
2. Keep the Vercel Framework Preset set to `Vite`.
3. Keep these Vercel environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Vercel should build with `npm run build` and output `dist`.

The existing live Supabase schema is reused. No database reset is required.
