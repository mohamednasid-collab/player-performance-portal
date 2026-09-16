import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Activity, BarChart3, CalendarDays, Plus, Search, TrendingUp, Users, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { createAssessment, createPlayer, createSession, createTeam, getAssessments, getPlayers, getProfile, getSessions, getTeams } from './lib/data'
import type { Assessment, Player, Profile, Team, TrainingSession } from './types'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { StatCard } from './components/StatCard'
import { TrendChart } from './components/TrendChart'

type View = 'dashboard' | 'teams' | 'sessions' | 'performance' | 'reports' | 'messages' | 'settings'
type ModalKind = null | 'team' | 'player' | 'session' | 'assessment'

function Login() {
  const [role,setRole] = useState('Coach')
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: `${username.trim().toLowerCase()}@coachbase.local`, password })
    if (error) setError('Incorrect username or password.')
    setBusy(false)
  }
  return <div className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="login-brand">⚽</div><h1>CoachPortal</h1><p>Train. Track. Grow.</p>
    <label>Access type<select value={role} onChange={e=>setRole(e.target.value)}><option>Coach</option><option>Manager</option><option>Player</option></select></label>
    <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username" /></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label>
    {error && <div className="form-error">{error}</div>}
    <button className="primary-btn" disabled={busy}>{busy?'Signing in…':`Sign in as ${role}`}</button>
  </form></div>
}

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={onClose}><X size={20}/></button></div>{children}</div></div>
}

function averageAssessment(a: Assessment) {
  const vals = [a.technical,a.tactical,a.physical,a.mental,a.attitude].filter((v):v is number=>typeof v==='number')
  return vals.length ? vals.reduce((x,y)=>x+y,0)/vals.length : 0
}

export default function App() {
  const [session,setSession] = useState<Session|null>(null)
  const [profile,setProfile] = useState<Profile|null>(null)
  const [view,setView] = useState<View>('dashboard')
  const [search,setSearch] = useState('')
  const [loading,setLoading] = useState(true)
  const [teams,setTeams] = useState<Team[]>([])
  const [players,setPlayers] = useState<Player[]>([])
  const [sessions,setSessions] = useState<TrainingSession[]>([])
  const [assessments,setAssessments] = useState<Assessment[]>([])
  const [modal,setModal] = useState<ModalKind>(null)
  const [error,setError] = useState('')

  const [teamForm,setTeamForm] = useState({name:'',age_group:'',season:''})
  const [playerForm,setPlayerForm] = useState({team_id:'',full_name:'',jersey_number:'',position:'',date_of_birth:'',preferred_foot:'',notes:''})
  const [sessionForm,setSessionForm] = useState({team_id:'',session_date:new Date().toISOString().slice(0,10),title:'',focus:'',duration_minutes:'90',notes:''})
  const [assessmentForm,setAssessmentForm] = useState({team_id:'',player_id:'',session_id:'',assessment_date:new Date().toISOString().slice(0,10),technical:7,tactical:7,physical:7,mental:7,attitude:7,comments:''})

  async function loadAll() {
    const [t,p,s,a] = await Promise.all([getTeams(),getPlayers(),getSessions(),getAssessments()])
    setTeams(t); setPlayers(p); setSessions(s); setAssessments(a)
  }

  useEffect(()=>{
    supabase.auth.getSession().then(async ({data})=>{
      setSession(data.session)
      if (data.session) { try { setProfile(await getProfile()); await loadAll() } catch {} }
      setLoading(false)
    })
    const {data:sub} = supabase.auth.onAuthStateChange(async (_event,next)=>{
      setSession(next)
      if(next){ try{setProfile(await getProfile()); await loadAll()}catch{} } else setProfile(null)
      setLoading(false)
    })
    return ()=>sub.subscription.unsubscribe()
  },[])

  const filteredTeams = useMemo(()=>teams.filter(t=>t.name.toLowerCase().includes(search.toLowerCase())),[teams,search])
  const filteredPlayers = useMemo(()=>players.filter(p=>`${p.full_name} ${(p as Player & {nickname?:string|null}).nickname??''} ${p.position??''}`.toLowerCase().includes(search.toLowerCase())),[players,search])
  const upcoming = useMemo(()=>[...sessions].filter(s=>new Date(s.session_date)>=new Date(new Date().toDateString())).sort((a,b)=>a.session_date.localeCompare(b.session_date)).slice(0,4),[sessions])
  const avgPerformance = assessments.length ? Math.round(assessments.reduce((s,a)=>s+averageAssessment(a),0)/assessments.length*10) : 0
  const playerRatings = useMemo(()=>players.map(p=>{
    const list=assessments.filter(a=>a.player_id===p.id)
    const avg=list.length?Math.round(list.reduce((s,a)=>s+averageAssessment(a),0)/list.length*10):0
    return {player:p,avg,count:list.length}
  }).sort((a,b)=>b.avg-a.avg),[players,assessments])

  if (loading) return <div className="loading-screen">Loading CoachPortal…</div>
  if (!session || !profile) return <Login />

  async function saveTeam(e:React.FormEvent){e.preventDefault();setError('');try{await createTeam(teamForm);setModal(null);setTeamForm({name:'',age_group:'',season:''});await loadAll()}catch(err){setError(err instanceof Error?err.message:'Could not save team')}}
  async function savePlayer(e:React.FormEvent){e.preventDefault();setError('');try{await createPlayer({team_id:playerForm.team_id,full_name:playerForm.full_name,jersey_number:playerForm.jersey_number?Number(playerForm.jersey_number):null,position:playerForm.position||null,date_of_birth:playerForm.date_of_birth||null,preferred_foot:playerForm.preferred_foot||null,notes:playerForm.notes||null});setModal(null);await loadAll()}catch(err){setError(err instanceof Error?err.message:'Could not save player')}}
  async function saveSession(e:React.FormEvent){e.preventDefault();setError('');try{await createSession({team_id:sessionForm.team_id,session_date:sessionForm.session_date,title:sessionForm.title,focus:sessionForm.focus||null,duration_minutes:sessionForm.duration_minutes?Number(sessionForm.duration_minutes):null,notes:sessionForm.notes||null});setModal(null);await loadAll()}catch(err){setError(err instanceof Error?err.message:'Could not save session')}}
  async function saveAssessment(e:React.FormEvent){e.preventDefault();setError('');try{await createAssessment({...assessmentForm,session_id:assessmentForm.session_id||null,comments:assessmentForm.comments||null});setModal(null);await loadAll()}catch(err){setError(err instanceof Error?err.message:'Could not save assessment')}}

  const teamName=(id:string)=>teams.find(t=>t.id===id)?.name??'Team'
  const playerDisplayName=(player:Player)=>{
    const nickname=(player as Player & {nickname?:string|null}).nickname?.trim()
    return nickname?`${player.full_name} (${nickname})`:player.full_name
  }
  const dateLabel=(d:string)=>new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})

  const Dashboard = () => <>
    <div className="welcome-row"><div><h1>Welcome back, {profile.full_name.split(' ')[0]}!</h1><p>Manage your teams, plan training sessions, and track player development all in one place.</p></div><div className="today">{new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div></div>
    <div className="stats-grid">
      <StatCard icon={Users} value={teams.length} label="Teams" note="Manage your squads" />
      <StatCard icon={CalendarDays} value={sessions.length} label="Training Sessions" note="Recorded sessions" />
      <StatCard icon={Activity} value={players.length} label="Players" note="Across all teams" />
      <StatCard icon={TrendingUp} value={`${avgPerformance}%`} label="Avg. Performance" note={assessments.length?'Based on assessments':'No assessments yet'} />
    </div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><h2>Your Teams</h2><button className="small-primary" onClick={()=>setModal('team')}><Plus size={16}/> Add Team</button></div><div className="team-list">
        {teams.length===0?<div className="empty">No teams yet. Add your first team.</div>:teams.slice(0,4).map((t,i)=><div className="team-row" key={t.id}><div className={`team-badge badge-${i%4}`}>{t.name.slice(0,2).toUpperCase()}</div><div className="grow"><strong>{t.name}</strong><span>{players.filter(p=>p.team_id===t.id).length} players · {t.season||'Current season'}</span></div><span className="age-pill">{t.age_group||'Team'}</span><span className="chev">›</span></div>)}
      </div></section>
      <section className="panel"><div className="panel-head"><h2>Upcoming Training Sessions</h2><button className="link-btn" onClick={()=>setView('sessions')}>View All</button></div><div className="session-list">
        {upcoming.length===0?<div className="empty">No upcoming sessions.</div>:upcoming.map(s=><div className="session-row" key={s.id}><div className="date-box"><span>{new Date(`${s.session_date}T00:00:00`).toLocaleDateString(undefined,{month:'short'}).toUpperCase()}</span><strong>{new Date(`${s.session_date}T00:00:00`).getDate()}</strong></div><div><strong>{teamName(s.team_id)}</strong><div>{s.title}</div><span>{s.duration_minutes??90} min · {s.focus||'Training session'}</span></div></div>)}
      </div></section>
      <section className="panel"><div className="panel-head"><h2>Player Performance</h2><button className="link-btn" onClick={()=>setView('performance')}>View All Players</button></div><div className="performance-table"><div className="perf-head"><span>Player</span><span>Team</span><span>Assessments</span><span>Overall Rating</span></div>
        {playerRatings.slice(0,5).map(({player,avg,count})=><div className="perf-row" key={player.id}><span className="player-name"><i>{player.full_name.charAt(0)}</i>{player.full_name}</span><span>{teamName(player.team_id)}</span><span>{count}</span><span><b className={`rating ${avg>=80?'good':avg>=65?'mid':'low'}`}>{avg||'—'}</b></span></div>)}
        {players.length===0&&<div className="empty">No players added yet.</div>}
      </div></section>
      <section className="panel"><div className="panel-head"><h2>Performance Trends</h2><select className="mini-select"><option>All Teams</option>{teams.map(t=><option key={t.id}>{t.name}</option>)}</select></div><TrendChart assessments={assessments}/></section>
    </div>
  </>

  const TeamsView = () => <section><div className="section-head"><div><h1>Teams</h1><p>Create and manage your squads.</p></div><button className="primary-btn inline" onClick={()=>setModal('team')}><Plus size={16}/> Add Team</button></div><div className="cards-grid">{filteredTeams.map((t,i)=><div className="entity-card" key={t.id}><div className={`entity-icon badge-${i%4}`}>{t.name.slice(0,2).toUpperCase()}</div><h3>{t.name}</h3><p>{t.age_group||'Open'} · {t.season||'No season'}</p><div className="entity-stat">{players.filter(p=>p.team_id===t.id).length} players</div></div>)}</div></section>

  const SessionsView = () => <section><div className="section-head"><div><h1>Training Sessions</h1><p>Plan, record and review training activity.</p></div><button className="primary-btn inline" onClick={()=>setModal('session')}><Plus size={16}/> New Session</button></div><div className="panel table-panel"><table><thead><tr><th>Date</th><th>Team</th><th>Session</th><th>Focus</th><th>Duration</th></tr></thead><tbody>{sessions.map(s=><tr key={s.id}><td>{dateLabel(s.session_date)}</td><td>{teamName(s.team_id)}</td><td><strong>{s.title}</strong></td><td>{s.focus||'—'}</td><td>{s.duration_minutes??'—'} min</td></tr>)}</tbody></table></div></section>

  const PerformanceView = () => <section><div className="section-head"><div><h1>Player Performance</h1><p>Track player development across training assessments.</p></div><div className="button-pair"><button className="secondary-btn" onClick={()=>setModal('player')}><Plus size={16}/> Add Player</button><button className="primary-btn inline" onClick={()=>setModal('assessment')}><Plus size={16}/> New Assessment</button></div></div><div className="panel table-panel"><table><thead><tr><th>Player</th><th>Team</th><th>Position</th><th>Assessments</th><th>Overall</th></tr></thead><tbody>{filteredPlayers.map(p=>{const r=playerRatings.find(x=>x.player.id===p.id);return <tr key={p.id}><td><strong>{playerDisplayName(p)}</strong></td><td>{teamName(p.team_id)}</td><td>{p.position||'—'}</td><td>{r?.count??0}</td><td><b className={`rating ${(r?.avg??0)>=80?'good':(r?.avg??0)>=65?'mid':'low'}`}>{r?.avg||'—'}</b></td></tr>})}</tbody></table></div></section>

  const SimpleView = ({title,copy}:{title:string;copy:string}) => <section><div className="section-head"><div><h1>{title}</h1><p>{copy}</p></div></div><div className="panel placeholder"><BarChart3 size={42}/><h2>{title}</h2><p>This section is ready for the next workflow you want to add.</p></div></section>

  return <div className="app-shell"><Sidebar view={view} onChange={setView} profile={profile}/><div className="workspace"><Header profile={profile} search={search} setSearch={setSearch}/><main className="content">
    {view==='dashboard'&&<Dashboard/>}{view==='teams'&&<TeamsView/>}{view==='sessions'&&<SessionsView/>}{view==='performance'&&<PerformanceView/>}{view==='reports'&&<SimpleView title="Reports" copy="Build team, player and assessment reports."/>}{view==='messages'&&<SimpleView title="Messages" copy="Team communication can be added here."/>}{view==='settings'&&<SimpleView title="Settings" copy="Manage account, roles and portal preferences."/>}
  </main></div>

  {modal==='team'&&<Modal title="Add Team" onClose={()=>setModal(null)}><form className="form-grid" onSubmit={saveTeam}><label>Team name<input required value={teamForm.name} onChange={e=>setTeamForm({...teamForm,name:e.target.value})}/></label><label>Age group<input placeholder="U14" value={teamForm.age_group} onChange={e=>setTeamForm({...teamForm,age_group:e.target.value})}/></label><label>Season<input placeholder="2026" value={teamForm.season} onChange={e=>setTeamForm({...teamForm,season:e.target.value})}/></label>{error&&<div className="form-error span-2">{error}</div>}<div className="form-actions span-2"><button className="primary-btn">Create Team</button></div></form></Modal>}
  {modal==='player'&&<Modal title="Add Player" onClose={()=>setModal(null)}><form className="form-grid" onSubmit={savePlayer}><label>Team<select required value={playerForm.team_id} onChange={e=>setPlayerForm({...playerForm,team_id:e.target.value})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Full name<input required value={playerForm.full_name} onChange={e=>setPlayerForm({...playerForm,full_name:e.target.value})}/></label><label>Jersey no.<input type="number" value={playerForm.jersey_number} onChange={e=>setPlayerForm({...playerForm,jersey_number:e.target.value})}/></label><label>Position<input value={playerForm.position} onChange={e=>setPlayerForm({...playerForm,position:e.target.value})}/></label><label>Date of birth<input type="date" value={playerForm.date_of_birth} onChange={e=>setPlayerForm({...playerForm,date_of_birth:e.target.value})}/></label><label>Preferred foot<select value={playerForm.preferred_foot} onChange={e=>setPlayerForm({...playerForm,preferred_foot:e.target.value})}><option value="">Not set</option><option>Right</option><option>Left</option><option>Both</option></select></label>{error&&<div className="form-error span-2">{error}</div>}<div className="form-actions span-2"><button className="primary-btn">Add Player</button></div></form></Modal>}
  {modal==='session'&&<Modal title="New Training Session" onClose={()=>setModal(null)}><form className="form-grid" onSubmit={saveSession}><label>Team<select required value={sessionForm.team_id} onChange={e=>setSessionForm({...sessionForm,team_id:e.target.value})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Date<input type="date" required value={sessionForm.session_date} onChange={e=>setSessionForm({...sessionForm,session_date:e.target.value})}/></label><label>Title<input required value={sessionForm.title} onChange={e=>setSessionForm({...sessionForm,title:e.target.value})}/></label><label>Focus<input value={sessionForm.focus} onChange={e=>setSessionForm({...sessionForm,focus:e.target.value})}/></label><label>Duration (minutes)<input type="number" value={sessionForm.duration_minutes} onChange={e=>setSessionForm({...sessionForm,duration_minutes:e.target.value})}/></label><label className="span-2">Notes<textarea value={sessionForm.notes} onChange={e=>setSessionForm({...sessionForm,notes:e.target.value})}/></label>{error&&<div className="form-error span-2">{error}</div>}<div className="form-actions span-2"><button className="primary-btn">Save Session</button></div></form></Modal>}
  {modal==='assessment'&&<Modal title="New Assessment" onClose={()=>setModal(null)}><form className="form-grid" onSubmit={saveAssessment}><label>Team<select required value={assessmentForm.team_id} onChange={e=>setAssessmentForm({...assessmentForm,team_id:e.target.value,player_id:'',session_id:''})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Player<select required value={assessmentForm.player_id} onChange={e=>setAssessmentForm({...assessmentForm,player_id:e.target.value})}><option value="">Select player</option>{players.filter(p=>p.team_id===assessmentForm.team_id).map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label>Session<select value={assessmentForm.session_id} onChange={e=>setAssessmentForm({...assessmentForm,session_id:e.target.value})}><option value="">No linked session</option>{sessions.filter(s=>s.team_id===assessmentForm.team_id).map(s=><option key={s.id} value={s.id}>{s.session_date} — {s.title}</option>)}</select></label><label>Date<input type="date" value={assessmentForm.assessment_date} onChange={e=>setAssessmentForm({...assessmentForm,assessment_date:e.target.value})}/></label>{(['technical','tactical','physical','mental','attitude'] as const).map(k=><label key={k}>{k[0].toUpperCase()+k.slice(1)}<input type="number" min="0" max="10" step="0.5" value={assessmentForm[k]} onChange={e=>setAssessmentForm({...assessmentForm,[k]:Number(e.target.value)})}/></label>)}<label className="span-2">Comments<textarea value={assessmentForm.comments} onChange={e=>setAssessmentForm({...assessmentForm,comments:e.target.value})}/></label>{error&&<div className="form-error span-2">{error}</div>}<div className="form-actions span-2"><button className="primary-btn">Save Assessment</button></div></form></Modal>}
  </div>
}
