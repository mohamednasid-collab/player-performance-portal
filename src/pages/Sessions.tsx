import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { createSession, getSessions, getTeams } from "../services/data";
import type { Team, TrainingSession } from "../types";

export function Sessions() {
  const [sessions,setSessions]=useState<TrainingSession[]>([]),[teams,setTeams]=useState<Team[]>([]),[open,setOpen]=useState(false);
  const [form,setForm]=useState({team_id:"",session_date:new Date().toISOString().slice(0,10),title:"",focus:"",duration_minutes:"",notes:""});
  async function load(){setSessions(await getSessions());setTeams(await getTeams())}
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){e.preventDefault();await createSession({...form,duration_minutes:form.duration_minutes?Number(form.duration_minutes):null,focus:form.focus||null,notes:form.notes||null});setOpen(false);load()}
  return <section><div className="page-head"><div><h1>Sessions</h1><p>Record training activity for each team.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New Session</Button></div>
  <div className="cards-list">{sessions.map(s=><div className="card row-card" key={s.id}><div><strong>{s.title}</strong><span>{teams.find(t=>t.id===s.team_id)?.name} · {s.session_date}</span></div><div>{s.focus||"General"} · {s.duration_minutes??"—"} min</div></div>)}</div>
  {open&&<Modal title="New training session" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={save}><label>Team<select required value={form.team_id} onChange={e=>setForm({...form,team_id:e.target.value})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Date<input type="date" required value={form.session_date} onChange={e=>setForm({...form,session_date:e.target.value})}/></label><label>Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Focus<input value={form.focus} onChange={e=>setForm({...form,focus:e.target.value})}/></label><label>Duration (minutes)<input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})}/></label><label className="span-2">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions span-2"><Button>Save Session</Button></div></form></Modal>}
  </section>
}
