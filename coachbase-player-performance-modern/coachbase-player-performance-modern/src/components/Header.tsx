import { LogOut, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
export function Header({ profile, search, setSearch }: { profile: Profile; search: string; setSearch: (v:string)=>void }) {
  return <header className="topbar"><div className="global-search"><Search size={18}/><input aria-label="Search players, teams or sessions" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search players, teams or sessions…"/></div><div className="top-actions"><div className="top-user"><div className="top-avatar">{profile.full_name.charAt(0)}</div><div><strong>{profile.full_name}</strong><span>{profile.role.replace('_',' ')}</span></div></div><button className="icon-circle" title="Sign out" aria-label="Sign out" onClick={()=>void supabase.auth.signOut()}><LogOut size={18}/></button></div></header>
}
