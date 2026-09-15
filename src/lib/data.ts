import { supabase } from './supabase'
import type { Assessment, Player, Profile, Team, TrainingSession } from '../types'

export async function getProfile(): Promise<Profile> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single()
  if (error) throw error
  return data as Profile
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Team[]
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').eq('active', true).order('full_name')
  if (error) throw error
  return (data ?? []) as Player[]
}

export async function getSessions(): Promise<TrainingSession[]> {
  const { data, error } = await supabase.from('training_sessions').select('*').order('session_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as TrainingSession[]
}

export async function getAssessments(): Promise<Assessment[]> {
  const { data, error } = await supabase.from('assessments').select('*').order('assessment_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Assessment[]
}

export async function createTeam(input: { name: string; age_group?: string; season?: string }) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('teams').insert({
    name: input.name,
    age_group: input.age_group || null,
    season: input.season || null,
    created_by: auth.user.id,
  }).select().single()
  if (error) throw error
  await supabase.from('team_members').insert({ team_id: data.id, user_id: auth.user.id, role: 'coach' })
  return data as Team
}

export async function createPlayer(input: Omit<Player, 'id' | 'linked_user_id' | 'active'>) {
  const { data, error } = await supabase.from('players').insert({ ...input, linked_user_id: null, active: true }).select().single()
  if (error) throw error
  return data as Player
}

export async function createSession(input: Omit<TrainingSession, 'id' | 'created_by'>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('training_sessions').insert({ ...input, created_by: auth.user.id }).select().single()
  if (error) throw error
  return data as TrainingSession
}

export async function createAssessment(input: Omit<Assessment, 'id' | 'assessed_by'>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('assessments').insert({ ...input, assessed_by: auth.user.id }).select().single()
  if (error) throw error
  return data as Assessment
}
