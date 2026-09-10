import { NavLink } from "react-router-dom";
import { Activity, ClipboardCheck, Dumbbell, LayoutDashboard, LogOut, Target, Users, UserCog } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types";

const items = [
  ["/", "Dashboard", LayoutDashboard],
  ["/teams", "Teams", Users],
  ["/players", "Players", Users],
  ["/sessions", "Sessions", Dumbbell],
  ["/assessments", "Assessments", ClipboardCheck],
  ["/development", "Development", Target],
];

export function Sidebar({ profile }: { profile: Profile }) {
  const admin = ["super_admin", "administrator"].includes(profile.role);
  return (
    <aside className="sidebar">
      <div className="brand"><Activity size={26}/><div><strong>CoachLab</strong><span>Performance Hub</span></div></div>
      <nav>
        {items.map(([to, label, Icon]) => (
          <NavLink key={to as string} to={to as string} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            {(() => { const I = Icon as typeof LayoutDashboard; return <I size={18}/>; })()}<span>{label as string}</span>
          </NavLink>
        ))}
        {admin && <NavLink to="/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><UserCog size={18}/><span>User Management</span></NavLink>}
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">{profile.full_name.slice(0,1).toUpperCase()}</div>
        <div className="user-meta"><strong>{profile.full_name}</strong><span>{profile.role.replace("_"," ")}</span></div>
        <button className="icon-btn" title="Sign out" onClick={() => supabase.auth.signOut()}><LogOut size={18}/></button>
      </div>
    </aside>
  );
}
