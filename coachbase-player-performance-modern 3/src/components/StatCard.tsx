import type { ElementType } from 'react'
import { Link } from 'react-router-dom'
export function StatCard({ icon: Icon, value, label, note, to }: { icon: ElementType; value: string | number; label: string; note: string; to: string }) {
  return <Link to={to} className="stat-card"><div className="stat-icon"><Icon size={30}/></div><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-note">{note}</div></div><span className="stat-arrow">›</span></Link>
}
