import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseConfig } from './config'
const { url, key } = resolveSupabaseConfig(import.meta.env)
export const supabase = createClient(url, key)
