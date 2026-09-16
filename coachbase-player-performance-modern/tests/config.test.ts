import { expect, it } from 'vitest'
import { resolveSupabaseConfig } from '../src/lib/config'
it('uses the original public project when Vercel variables are absent',()=>{
 expect(resolveSupabaseConfig({}).url).toBe('https://ncdyitiniyqeupkmflru.supabase.co')
 expect(resolveSupabaseConfig({}).key).toMatch(/^sb_publishable_/)
})
it('allows a complete explicit project override',()=>expect(resolveSupabaseConfig({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'test'})).toEqual({url:'https://example.supabase.co',key:'test'}))
it('supports the legacy anon key variable',()=>expect(resolveSupabaseConfig({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_ANON_KEY:'legacy'}).key).toBe('legacy'))
it('rejects partial configuration rather than mixing projects',()=>expect(()=>resolveSupabaseConfig({VITE_SUPABASE_URL:'https://other.supabase.co'})).toThrow('incomplete'))
it('rejects invalid URLs with a useful error',()=>expect(()=>resolveSupabaseConfig({VITE_SUPABASE_URL:'oops',VITE_SUPABASE_PUBLISHABLE_KEY:'test'})).toThrow('valid Supabase project URL'))
