import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { createAssessment, getAssessments, getPlayers, getSessions, getTeams } from "../services/data";
import type { Assessment, Player, Team, TrainingSession } from "../types";

const fields = ["technical","tactical","physical","mental","attitude"] as const;

export function Assessments() {
  const [items,setItems]=useState<Assessment[]>([]),[players,setPlayers]=useState<Player[]>([]),[teams,setTeams]=useState<Team[]>([]),[sessions,setSessions]=useState<TrainingSession[]>([]),[open,setOpen]=useState(false);
  const [form,setForm]=useState<any>({team_id:"",player_id:"",session_id:"",assessment_date:new Date().toISOString().slice(0,10),technical:5,tactical:5,physical:5,mental:5,attitude:5,comments:""});
  async function load(){const [a,p,t,s]=await Promise.all([getAssessments(),getPlayers(),getTeams(),getSessions()]);setItems(a);setPlayers(p);setTeams(t);setSessions(s)}
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){e.preventDefault();await createAssessment({...form,session_id:form.session_id||null,comments:form.comments||null});setOpen(false);load()}
  const avg=(a:Assessment)=>{const vals=fields.map(k=>a[k]).filter((v):v is number=>v!==null);return vals.length?(vals.reduce((x,y)=>x+y,0)/vals.length).toFixed(1):"—"};
  return <section><div className="page-head"><div><h1>Assessments</h1><p>Rate technical, tactical, physical, mental and attitude performance.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New Assessment</Button></div>
  <div className="table-card"><table><thead><tr><th>Player</th><th>Date</th><th>Team</th><th>Average</th><th>Comment</th></tr></thead><tbody>{items.map(a=><tr key={a.id}><td>{players.find(p=>p.id===a.player_id)?.full_name??"—"}</td><td>{a.assessment_date}</td><td>{teams.find(t=>t.id===a.team_id)?.name??"—"}</td><td><span className="score">{avg(a)}</span></td><td>{a.comments??"—"}</td></tr>)}</tbody></table></div>
  {open&&<Modal title="New assessment" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={save}><label>Team<select required value={form.team_id} onChange={e=>setForm({...form,team_id:e.target.value,player_id:"",session_id:""})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Player<select required value={form.player_id} onChange={e=>setForm({...form,player_id:e.target.value})}><option value="">Select player</option>{players.filter(p=>p.team_id===form.team_id).map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label>Session<select value={form.session_id} onChange={e=>setForm({...form,session_id:e.target.value})}><option value="">No linked session</option>{sessions.filter(s=>s.team_id===form.team_id).map(s=><option key={s.id} value={s.id}>{s.session_date} — {s.title}</option>)}</select></label><label>Date<input type="date" value={form.assessment_date} onChange={e=>setForm({...form,assessment_date:e.target.value})}/></label>{fields.map(k=><label key={k}>{k[0].toUpperCase()+k.slice(1)}<input type="number" min="0" max="10" step="0.5" value={form[k]} onChange={e=>setForm({...form,[k]:Number(e.target.value)})}/></label>)}<label className="span-2">Comments<textarea value={form.comments} onChange={e=>setForm({...form,comments:e.target.value})}/></label><div className="form-actions span-2"><Button>Save Assessment</Button></div></form></Modal>}
  </section>
}
