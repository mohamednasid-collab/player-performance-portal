import { supabase } from './supabase'
import { metrics, validRating } from './ratings'
import { scopeData } from './access'
import { allRows } from './pagination'
import type { Assessment, Player, Profile, Team, TrainingSession, TeamMember, PortalData } from '../types'

export function errorMessage(error: unknown): string {
  return error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Something went wrong. Please try again.'
}
async function userId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in')
  return data.user.id
}
export async function getProfile(): Promise<Profile> {
  const id = await userId()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  if (!data.active) throw new Error('Your account is inactive. Contact your administrator.')
  return data as Profile
}
export async function getPortalData(profile: Profile): Promise<PortalData> {
  // Explicitly scoped queries avoid downloading other teams even before UI filtering.
  const memberships = await allRows<TeamMember>((from,to) => supabase.from('team_members').select('*').eq('user_id', profile.id).order('team_id').range(from,to))
  let teamQuery = supabase.from('teams').select('*').order('name').order('id')
  if (!['super_admin', 'administrator'].includes(profile.role)) {
    const ids = memberships.map(m => m.team_id)
    if (profile.role === 'coach') {
      const owned = await allRows<{id:string}>((from,to) => supabase.from('teams').select('id').eq('created_by', profile.id).order('id').range(from,to))
      ids.push(...owned.map(t => t.id))
    }
    if (profile.role === 'player') {
      const linked = await allRows<{team_id:string}>((from,to) => supabase.from('players').select('team_id').eq('linked_user_id', profile.id).order('id').range(from,to))
      ids.push(...linked.map(p => p.team_id))
    }
    if (!ids.length) return { teams: [], players: [], sessions: [], assessments: [], memberships }
    teamQuery = teamQuery.in('id', [...new Set(ids)])
  }
  const teams = await allRows<Team>((from,to) => teamQuery.range(from,to))
  if (!teams.length) return { teams, players: [], sessions: [], assessments: [], memberships }
  const ids = teams.map(t => t.id)
  let playerQuery = supabase.from('players').select('*').in('team_id', ids).order('full_name').order('id')
  if (profile.role === 'player') playerQuery = playerQuery.eq('linked_user_id', profile.id)
  const [p, s, a] = await Promise.all([
    allRows<Player>((from,to) => playerQuery.range(from,to)),
    allRows<TrainingSession>((from,to) => supabase.from('training_sessions').select('*').in('team_id', ids).order('session_date', { ascending: false }).order('id').range(from,to)),
    allRows<Assessment>((from,to) => supabase.from('assessments').select('*').in('team_id', ids).order('assessment_date', { ascending: false }).order('id').range(from,to)),
  ])
  const assessments = a
  if (assessments.some(a => metrics.some(k => a[k] !== null && !validRating(a[k])))) throw new Error('Legacy ratings detected. Run the supplied Supabase migration before using this version.')
  return scopeData(profile, { teams, players: p, sessions: s, assessments, memberships })
}
export async function createTeam(input: { name: string; age_group?: string; season?: string }) {
  const { data, error } = await supabase.from('teams').insert({ name: input.name.trim(), age_group: input.age_group || null, season: input.season || null, created_by: await userId() }).select().single()
  if (error) throw error
  // The creator already has coach access through teams.created_by; no non-atomic membership insert.
  return data as Team
}
export async function createPlayer(input: Omit<Player, 'id' | 'linked_user_id' | 'active'>) {
  const { data, error } = await supabase.from('players').insert({ ...input, full_name: input.full_name.trim(), linked_user_id: null, active: true }).select().single()
  if (error) throw error
  return data as Player
}
export async function saveTrainingSession(input: Omit<TrainingSession, 'id' | 'created_by'>, id?: string) {
  if (!input.title.trim() || !input.team_id || !input.session_date) throw new Error('Team, date and title are required.')
  if (input.duration_minutes !== null && (!Number.isInteger(input.duration_minutes) || input.duration_minutes <= 0)) throw new Error('Duration must be a positive whole number.')
  const payload = { ...input, title: input.title.trim() }
  const query = id ? supabase.from('training_sessions').update(payload).eq('id', id) : supabase.from('training_sessions').insert({ ...payload, created_by: await userId() })
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as TrainingSession
}
export async function deleteSession(id: string) {
  const { data, error } = await supabase.from('training_sessions').delete().eq('id', id).select('id').single()
  if (error) throw error
  if (!data) throw new Error('Session not found or permission denied.')
}
export async function createAssessment(input: Omit<Assessment, 'id' | 'assessed_by'>) {
  if (metrics.some(k => !validRating(input[k]))) throw new Error('All five ratings must be whole numbers from 1 to 5.')
  if (!input.player_id || !input.team_id || !input.assessment_date) throw new Error('Player, team and date are required.')
  const { data, error } = await supabase.from('assessments').insert({ ...input, assessed_by: await userId() }).select().single()
  if (error) throw error
  return data as Assessment
}
