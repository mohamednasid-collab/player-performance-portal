import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { createDevelopmentPlan, getDevelopmentPlans, getPlayers, getTeams } from "../services/data";
import type { DevelopmentPlan, Player, Team } from "../types";

export function Development() {
  const [plans,setPlans]=useState<DevelopmentPlan[]>([]),[players,setPlayers]=useState<Player[]>([]),[teams,setTeams]=useState<Team[]>([]),[open,setOpen]=useState(false);
  const [form,setForm]=useState({team_id:"",player_id:"",title:"",objective:"",action_items:"",target_date:"",status:"active" as "active"|"completed"|"paused"});
  async function load(){const [d,p,t]=await Promise.all([getDevelopmentPlans(),getPlayers(),getTeams()]);setPlans(d);setPlayers(p);setTeams(t)}
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){e.preventDefault();await createDevelopmentPlan({...form,action_items:form.action_items||null,target_date:form.target_date||null});setOpen(false);load()}
  return <section><div className="page-head"><div><h1>Development</h1><p>Turn assessment findings into clear player actions.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> New Plan</Button></div>
  <div className="cards-list">{plans.map(p=><div className="card plan-card" key={p.id}><div><span className={`pill ${p.status}`}>{p.status}</span><h3>{p.title}</h3><p>{p.objective}</p></div><div className="muted">{players.find(x=>x.id===p.player_id)?.full_name} · Target {p.target_date??"Open"}</div></div>)}</div>
  {open&&<Modal title="New development plan" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={save}><label>Team<select required value={form.team_id} onChange={e=>setForm({...form,team_id:e.target.value,player_id:""})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Player<select required value={form.player_id} onChange={e=>setForm({...form,player_id:e.target.value})}><option value="">Select player</option>{players.filter(p=>p.team_id===form.team_id).map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label><label className="span-2">Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="span-2">Objective<textarea required value={form.objective} onChange={e=>setForm({...form,objective:e.target.value})}/></label><label className="span-2">Action items<textarea value={form.action_items} onChange={e=>setForm({...form,action_items:e.target.value})}/></label><label>Target date<input type="date" value={form.target_date} onChange={e=>setForm({...form,target_date:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as any})}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label><div className="form-actions span-2"><Button>Save Plan</Button></div></form></Modal>}
  </section>
}
