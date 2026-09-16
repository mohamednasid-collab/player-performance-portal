import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { errorMessage, getPortalData, getProfile } from './lib/data'
import { canCreateTeam, canEditTeam } from './lib/access'
import type { PortalData, Profile } from './types'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EntityForm, type FormRequest } from './components/Forms'
import { Dashboard, PlayersPage, PlayerPage, TeamsPage, TeamPage, SessionsPage, SessionPage, ReportsPage, Unavailable } from './pages/PortalPages'

function Login() {
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{const {error}=await supabase.auth.signInWithPassword({email:username.includes('@')?username.trim():`${username.trim().toLowerCase()}@coachbase.local`,password});if(error)throw error}catch(err){setError(errorMessage(err))}finally{setBusy(false)}}
  return <div className="login-page"><form className="login-card" onSubmit={submit}><div className="login-brand">⚽</div><h1>CoachPortal</h1><p>Train. Track. Grow.</p><label>Username or email<input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)}/></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary-btn" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form></div>
}
const emptyData:PortalData={teams:[],players:[],sessions:[],assessments:[],memberships:[]}
function Portal(){
  const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile|null>(null),[data,setData]=useState<PortalData>(emptyData)
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState(''),[form,setForm]=useState<FormRequest|null>(null)
  const generation=useRef(0),currentUser=useRef<string|null>(null)
  async function load(next:Session|null){
    const ticket=++generation.current;currentUser.current=next?.user.id??null;setSession(next);setData(emptyData);setProfile(null);setForm(null);setSearch('');setError('')
    if(!next){setLoading(false);return}
    setLoading(true)
    try{const p=await getProfile();const loaded=await getPortalData(p);if(ticket!==generation.current)return;setProfile(p);setData(loaded)}catch(err){if(ticket===generation.current)setError(errorMessage(err))}finally{if(ticket===generation.current)setLoading(false)}
  }
  useEffect(()=>{
    let alive=true
    const {data:listener}=supabase.auth.onAuthStateChange((event,next)=>{
      if(event==='INITIAL_SESSION'||next?.user.id!==currentUser.current||event==='USER_UPDATED')setTimeout(()=>{if(alive)void load(next)},0)
    })
    return()=>{alive=false;++generation.current;listener.subscription.unsubscribe()}
  },[])
  async function reload(){
    const ticket=generation.current
    try{const p=await getProfile();const loaded=await getPortalData(p);if(ticket!==generation.current)return;setProfile(p);setData(loaded);setError('')}
    catch(err){if(ticket===generation.current){setData(emptyData);setError(errorMessage(err))}throw err}
  }
  if(loading)return <div className="loading-screen">Loading CoachPortal…</div>
  if(!session)return <Login/>
  if(!profile||error)return <div className="login-page"><div className="login-card"><h1>Unable to load portal</h1><p role="alert">{error||'No active profile was found.'}</p><button className="primary-btn" onClick={()=>void load(session)}>Retry</button><button className="secondary-btn" onClick={()=>void supabase.auth.signOut()}>Sign out</button></div></div>
  const editTeams=data.teams.filter(t=>canEditTeam(profile,t,data.memberships))
  function openForm(request:FormRequest){
    if(!profile)return
    if(request.kind==='team'&&!canCreateTeam(profile))return
    const teamId=request.player?.team_id??request.session?.team_id??request.teamId
    if(request.kind!=='team'&&(!editTeams.length||(teamId&&!editTeams.some(t=>t.id===teamId))))return
    setForm(request)
  }
  const props={data,profile,search,openForm,reload}
  return <div className="app-shell"><Sidebar profile={profile}/><div className="workspace"><Header profile={profile} search={search} setSearch={setSearch}/><main className="content"><Routes>
    <Route path="/" element={<Dashboard {...props}/>}/><Route path="/teams" element={<TeamsPage {...props}/>}/><Route path="/teams/:id" element={<TeamPage {...props}/>}/><Route path="/players" element={<PlayersPage {...props}/>}/><Route path="/players/:id" element={<PlayerPage {...props}/>}/><Route path="/sessions" element={<SessionsPage {...props}/>}/><Route path="/sessions/:id" element={<SessionPage {...props}/>}/><Route path="/performance" element={<PlayersPage {...props}/>}/><Route path="/reports" element={<ReportsPage {...props}/>}/><Route path="/messages" element={<section className="panel placeholder"><h1>Messages</h1><p>Team messaging is not configured.</p></section>}/><Route path="/settings" element={<section className="panel placeholder"><h1>Account</h1><p>{profile.full_name} · {profile.role.replace('_',' ')}</p><p>Contact your administrator to change your account or team assignments.</p><button className="secondary-btn" onClick={()=>void supabase.auth.signOut()}>Sign out</button></section>}/><Route path="*" element={<Unavailable/>}/>
  </Routes></main></div>{form&&<EntityForm request={form} teams={editTeams} players={data.players} sessions={data.sessions} onClose={()=>setForm(null)} onSaved={reload}/>}</div>
}
export default function App(){return <BrowserRouter><Portal/></BrowserRouter>}
