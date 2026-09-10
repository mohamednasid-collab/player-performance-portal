import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { createPlayer, getPlayers, getTeams } from "../services/data";
import type { Player, Team } from "../types";

export function Players() {
  const [players,setPlayers]=useState<Player[]>([]), [teams,setTeams]=useState<Team[]>([]);
  const [query,setQuery]=useState(""), [open,setOpen]=useState(false);
  const [form,setForm]=useState({team_id:"",full_name:"",jersey_number:"",position:"",date_of_birth:"",preferred_foot:"",notes:""});
  async function load(){ setPlayers(await getPlayers()); setTeams(await getTeams()); }
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){e.preventDefault(); await createPlayer({...form, jersey_number: form.jersey_number?Number(form.jersey_number):null, date_of_birth:form.date_of_birth||null, position:form.position||null, preferred_foot:form.preferred_foot||null, notes:form.notes||null}); setOpen(false); setForm({team_id:"",full_name:"",jersey_number:"",position:"",date_of_birth:"",preferred_foot:"",notes:""}); load();}
  const filtered=players.filter(p=>p.full_name.toLowerCase().includes(query.toLowerCase()) || (p.position??"").toLowerCase().includes(query.toLowerCase()));
  return <section><div className="page-head"><div><h1>Players</h1><p>Manage player profiles and squad information.</p></div><Button onClick={()=>setOpen(true)}><Plus size={16}/> Add Player</Button></div>
    <div className="toolbar"><Search size={18}/><input placeholder="Search players..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="table-card"><table><thead><tr><th>Player</th><th>#</th><th>Position</th><th>Team</th><th>Preferred foot</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><strong>{p.full_name}</strong></td><td>{p.jersey_number??"—"}</td><td>{p.position??"—"}</td><td>{teams.find(t=>t.id===p.team_id)?.name??"—"}</td><td>{p.preferred_foot??"—"}</td></tr>)}</tbody></table></div>
    {open&&<Modal title="Add player" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={save}><label>Team<select required value={form.team_id} onChange={e=>setForm({...form,team_id:e.target.value})}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Full name<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label><label>Jersey number<input type="number" value={form.jersey_number} onChange={e=>setForm({...form,jersey_number:e.target.value})}/></label><label>Position<input value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/></label><label>Date of birth<input type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}/></label><label>Preferred foot<select value={form.preferred_foot} onChange={e=>setForm({...form,preferred_foot:e.target.value})}><option value="">Not set</option><option>Right</option><option>Left</option><option>Both</option></select></label><label className="span-2">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions span-2"><Button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancel</Button><Button>Add Player</Button></div></form></Modal>}
  </section>
}
