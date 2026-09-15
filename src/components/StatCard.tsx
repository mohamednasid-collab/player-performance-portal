import type { ElementType } from 'react'

export function StatCard({ icon: Icon, value, label, note }: { icon: ElementType; value: string | number; label: string; note: string }) {
  return <div className="stat-card"><div className="stat-icon"><Icon size={30}/></div><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-note">{note}</div></div><span className="stat-arrow">›</span></div>
}
