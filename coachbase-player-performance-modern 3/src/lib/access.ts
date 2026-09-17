import type { Profile, Team, TeamMember, PortalData } from '../types'
export function isAdmin(p: Profile) { return p.active && ['super_admin', 'administrator'].includes(p.role) }
export function canReadTeam(p: Profile, team: Team, memberships: TeamMember[]) {
  if (!p.active) return false
  if (isAdmin(p)) return true
  if (p.role === 'coach' && team.created_by === p.id) return true
  return memberships.some(m => m.team_id === team.id && m.user_id === p.id)
}
export function canEditTeam(p: Profile, team: Team, memberships: TeamMember[]) {
  return isAdmin(p) || (p.active && p.role === 'coach' && (team.created_by === p.id || memberships.some(m => m.user_id === p.id && m.team_id === team.id && m.role === 'coach')))
}
export function canCreateTeam(p: Profile) { return isAdmin(p) || (p.active && p.role === 'coach') }
// Defense in depth. Database RLS remains the authority, including direct REST access.
export function scopeData(p: Profile, data: PortalData): PortalData {
  const teams = data.teams.filter(t => canReadTeam(p, t, data.memberships) || (p.active && p.role === 'player' && data.players.some(player => player.team_id === t.id && player.linked_user_id === p.id)))
  const ids = new Set(teams.map(t => t.id))
  const players = data.players.filter(x => ids.has(x.team_id) && (p.role !== 'player' || x.linked_user_id === p.id))
  const playerIds = new Set(players.map(x => x.id))
  return { teams, players, sessions: data.sessions.filter(x => ids.has(x.team_id)), assessments: data.assessments.filter(x => ids.has(x.team_id) && playerIds.has(x.player_id)), memberships: data.memberships.filter(x => ids.has(x.team_id)) }
}
