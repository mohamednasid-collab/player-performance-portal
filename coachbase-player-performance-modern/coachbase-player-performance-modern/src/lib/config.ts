// Public browser configuration from the original project's .env.example.
// These are not service-role credentials. Database access is enforced by Supabase RLS.
const originalProject = {
  url: 'https://ncdyitiniyqeupkmflru.supabase.co',
  key: 'sb_publishable_sWvJ_mWhCf52DbfBjZKs2A_izAwC8ix',
}
export function resolveSupabaseConfig(env: { VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string; VITE_SUPABASE_ANON_KEY?: string }) {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url && !key) return originalProject
  if (!url || !key) throw new Error('Supabase configuration is incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY together in Vercel, then redeploy.')
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new Error('VITE_SUPABASE_URL must be a valid Supabase project URL. Correct it in Vercel and redeploy.') }
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('VITE_SUPABASE_URL must use https or http.')
  return { url, key }
}
