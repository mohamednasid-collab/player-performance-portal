import { Bell, ChevronDown, LogOut, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export function Header({ profile, search, setSearch }: { profile: Profile; search: string; setSearch: (v:string)=>void }) {
  return <header className="topbar">
    <div className="global-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search players, teams or sessions..." /></div>
    <div className="top-actions">
      <button className="icon-circle"><Bell size={20}/><span className="notify-dot">3</span></button>
      <div className="top-user"><div className="top-avatar">{profile.full_name.charAt(0).toUpperCase()}</div><div><strong>{profile.full_name}</strong><span>{profile.role==='super_admin'?'Head Coach':profile.role.replace('_',' ')}</span></div><ChevronDown size={16}/></div>
      <button className="icon-circle" title="Sign out" onClick={()=>supabase.auth.signOut()}><LogOut size={18}/></button>
    </div>
  </header>
}
