import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { createTeam, getTeams } from "../services/data";
import type { Team } from "../types";

export function Teams() {
  const [teams,setTeams]=useState<Team[]>([]);
  const [form,setForm]=useState({name:"",age_group:"",season:""});
  async function load(){setTeams(await getTeams())}
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){e.preventDefault();await createTeam({name:form.name,age_group:form.age_group||null,season:form.season||null});setForm({name:"",age_group:"",season:""});load()}
  return <section><div className="page-head"><div><h1>Teams</h1><p>Create and organize squads.</p></div></div><div className="two-col"><Card><h2>Create team</h2><form className="stack" onSubmit={save}><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Age group<input value={form.age_group} onChange={e=>setForm({...form,age_group:e.target.value})}/></label><label>Season<input value={form.season} onChange={e=>setForm({...form,season:e.target.value})}/></label><Button><Plus size={16}/> Create Team</Button></form></Card><div className="cards-list">{teams.map(t=><Card key={t.id}><h3>{t.name}</h3><p>{t.age_group||"Open"} · {t.season||"No season"}</p></Card>)}</div></div></section>
}
