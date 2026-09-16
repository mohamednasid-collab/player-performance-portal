import { useState } from 'react'
import { Modal } from './Modal'
import { createAssessment, createPlayer, createTeam, errorMessage, saveTrainingSession } from '../lib/data'
import { metrics, ratingLabels } from '../lib/ratings'
import type { Player, Team, TrainingSession } from '../types'
export type FormRequest = { kind: 'team' | 'player' | 'session' | 'assessment'; teamId?: string; player?: Player; session?: TrainingSession }
export function EntityForm({ request, teams, players, sessions, onClose, onSaved }: { request: FormRequest; teams: Team[]; players: Player[]; sessions: TrainingSession[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [busy,setBusy] = useState(false), [error,setError] = useState('')
  const [teamId,setTeamId] = useState(request.player?.team_id ?? request.session?.team_id ?? request.teamId ?? '')
  const [playerId,setPlayerId] = useState(request.player?.id ?? '')
  const [sessionId,setSessionId] = useState('')
  const { kind } = request
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; setBusy(true); setError('')
    const f = new FormData(e.currentTarget)
    const text = (key: string) => String(f.get(key) ?? '').trim()
    const optional = (key: string) => text(key) || null
    try {
      if (kind !== 'team' && !teams.some(t => t.id === teamId)) throw new Error('Select an authorized team.')
      if (kind === 'team') {
        if (!text('name')) throw new Error('Enter a team name.')
        await createTeam({ name: text('name'), age_group: text('age_group'), season: text('season') })
      }
      if (kind === 'player') {
        if (!text('full_name')) throw new Error('Enter the player’s name.')
        await createPlayer({ team_id: teamId, full_name: text('full_name'), jersey_number: optional('jersey_number') === null ? null : Number(text('jersey_number')), position: optional('position'), date_of_birth: optional('date_of_birth'), preferred_foot: optional('preferred_foot'), notes: optional('notes') })
      }
      if (kind === 'session') await saveTrainingSession({ team_id: teamId, session_date: text('date'), title: text('title'), focus: optional('focus'), duration_minutes: optional('duration') === null ? null : Number(text('duration')), notes: optional('notes') }, request.session?.id)
      if (kind === 'assessment') {
        if (!players.some(p => p.id === playerId && p.team_id === teamId)) throw new Error('Select a player from this team.')
        if (sessionId && !sessions.some(s => s.id === sessionId && s.team_id === teamId)) throw new Error('Select a session from this team.')
        await createAssessment({ team_id: teamId, player_id: playerId, session_id: sessionId || null, assessment_date: text('date'), technical: Number(text('technical')), tactical: Number(text('tactical')), physical: Number(text('physical')), mental: Number(text('mental')), attitude: Number(text('attitude')), comments: optional('comments') })
      }
      await onSaved(); onClose()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  const title = kind === 'team' ? 'Add Team' : kind === 'player' ? 'Add Player' : kind === 'session' ? (request.session ? 'Edit Training Session' : 'New Training Session') : 'Assess Player'
  return <Modal title={title} onClose={onClose} busy={busy}><form onSubmit={submit}><fieldset disabled={busy} className="form-grid">
    {kind !== 'team' && <label>Team<select required value={teamId} disabled={!!request.player || !!request.session} onChange={e=>{setTeamId(e.target.value);setPlayerId('');setSessionId('')}}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
    {kind === 'team' && <><label>Team name<input name="name" required maxLength={150}/></label><label>Age group<input name="age_group" placeholder="U14"/></label><label>Season<input name="season" placeholder="2026"/></label></>}
    {kind === 'player' && <><label>Full name<input name="full_name" required maxLength={150}/></label><label>Jersey number<input name="jersey_number" type="number" min="0" step="1"/></label><label>Position<input name="position"/></label><label>Date of birth<input name="date_of_birth" type="date" max={new Date().toISOString().slice(0,10)}/></label><label>Preferred foot<select name="preferred_foot"><option value="">Not set</option><option>Right</option><option>Left</option><option>Both</option></select></label><label className="span-2">Notes<textarea name="notes"/></label></>}
    {(kind === 'session' || kind === 'assessment') && <label>Date<input name="date" type="date" required defaultValue={request.session?.session_date ?? new Date().toISOString().slice(0,10)}/></label>}
    {kind === 'session' && <><label>Title<input name="title" required defaultValue={request.session?.title}/></label><label>Focus<input name="focus" defaultValue={request.session?.focus ?? ''}/></label><label>Duration (minutes)<input name="duration" type="number" min="1" step="1" defaultValue={request.session?.duration_minutes ?? 90}/></label><label className="span-2">Notes<textarea name="notes" defaultValue={request.session?.notes ?? ''}/></label></>}
    {kind === 'assessment' && <><label>Player<select required value={playerId} disabled={!!request.player} onChange={e=>setPlayerId(e.target.value)}><option value="">Select player</option>{players.filter(p=>p.team_id===teamId).map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label>Session<select value={sessionId} onChange={e=>setSessionId(e.target.value)}><option value="">No linked session</option>{sessions.filter(s=>s.team_id===teamId).map(s=><option key={s.id} value={s.id}>{s.session_date} — {s.title}</option>)}</select></label>{metrics.map(k=><label key={k} className="capitalize">{k}<select name={k} required defaultValue=""><option value="" disabled>Select rating</option>{ratingLabels.map((label,i)=><option key={label} value={i+1}>{i+1} — {label}</option>)}</select></label>)}<label className="span-2">Comments<textarea name="comments"/></label></>}
    {error && <div role="alert" className="form-error span-2">{error}</div>}<div className="form-actions span-2"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn">{busy?'Saving…':'Save'}</button></div>
  </fieldset></form></Modal>
}
