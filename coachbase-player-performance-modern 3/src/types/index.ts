import type { AreaRatings } from '../lib/ratings'
export type AppRole = 'super_admin' | 'administrator' | 'coach' | 'manager' | 'player'

export type Profile = {
  id: string
  username: string
  full_name: string
  role: AppRole
  active: boolean
  must_change_password: boolean
}

export type Team = {
  id: string
  name: string
  age_group: string | null
  season: string | null
  created_by: string
  created_at?: string
}

export type Player = {
  id: string
  team_id: string
  linked_user_id: string | null
  full_name: string
  nickname: string | null
  mobile_number: string | null
  height_cm: number | null
  weight_kg: number | null
  jersey_number: number | null
  position: string | null
  date_of_birth: string | null
  preferred_foot: string | null
  notes: string | null
  active: boolean
}

export type TrainingSession = {
  id: string
  team_id: string
  session_date: string
  title: string
  focus: string | null
  duration_minutes: number | null
  notes: string | null
  created_by: string
}

export type Assessment = {
  id: string
  team_id: string
  player_id: string
  session_id: string | null
  area_ratings?: AreaRatings | null
  assessment_date: string
  technical: number | null
  tactical: number | null
  physical: number | null
  mental: number | null
  attitude: number | null
  comments: string | null
  assessed_by: string
}

export type TeamMember = { team_id: string; user_id: string; role: 'coach' | 'manager' | 'player' }
export type PortalData = { teams: Team[]; players: Player[]; sessions: TrainingSession[]; assessments: Assessment[]; memberships: TeamMember[] }
