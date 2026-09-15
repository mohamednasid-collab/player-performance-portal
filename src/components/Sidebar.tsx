import { BarChart3, CalendarDays, LayoutDashboard, MessageSquare, Settings, ShieldCheck, Users, UserRoundCheck } from 'lucide-react'
import type { Profile } from '../types'

type View = 'dashboard' | 'teams' | 'sessions' | 'performance' | 'reports' | 'messages' | 'settings'

export function Sidebar({ view, onChange, profile }: { view: View; onChange: (v: View) => void; profile: Profile }) {
  const items: Array<[View, string, React.ElementType]> = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['teams', 'Teams', Users],
    ['sessions', 'Training Sessions', CalendarDays],
    ['performance', 'Player Performance', BarChart3],
    ['reports', 'Reports', UserRoundCheck],
    ['messages', 'Messages', MessageSquare],
    ['settings', 'Settings', Settings],
  ]

  return <aside className="sidebar">
    <div className="brand-row">
      <div className="brand-ball">⚽</div>
      <div><div className="brand-title">CoachPortal</div><div className="brand-sub">Train. Track. Grow.</div></div>
    </div>
    <nav className="side-nav">
      {items.map(([id,label,Icon]) => <button key={id} className={`side-link ${view===id?'active':''}`} onClick={()=>onChange(id)}><Icon size={20}/><span>{label}</span></button>)}
    </nav>
    <div className="sidebar-quote">
      <div className="quote-tag"><ShieldCheck size={16}/> Development first</div>
      <div className="quote-copy">Better<br/>Players.<br/>Brighter<br/>Tomorrows.</div>
      <div className="quote-line" />
    </div>
    <div className="sidebar-user">
      <div className="user-avatar">{profile.full_name.charAt(0).toUpperCase()}</div>
      <div><strong>{profile.full_name}</strong><span>{profile.role.replace('_',' ')}</span></div>
    </div>
  </aside>
}
