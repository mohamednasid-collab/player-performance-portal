import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { createManagedUser, getTeams } from "../services/data";
import type { Team } from "../types";

export function UserManagement() {
  const [teams,setTeams]=useState<Team[]>([]);
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({username:"",fullName:"",role:"manager" as "administrator"|"coach"|"manager"|"player",teamId:"",temporaryPassword:"ChangeMe123!"});
  useEffect(()=>{getTeams().then(setTeams)},[]);
  async function save(e:React.FormEvent){e.preventDefault();setMessage("");try{await createManagedUser({...form,teamId:form.teamId||undefined});setMessage(`Created ${form.role} account for ${form.fullName}.`);setForm({...form,username:"",fullName:"",temporaryPassword:"ChangeMe123!"})}catch(err){setMessage(err instanceof Error?err.message:"Could not create user")}}
  return <section><div className="page-head"><div><h1>User Management</h1><p>Create Coach, Manager and Player access. Managers receive a temporary password from the administrator.</p></div></div>
    <Card><form className="form-grid" onSubmit={save}><label>Username<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value.replace(/\s+/g,"").toLowerCase()})}/></label><label>Full name<input required value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label><label>Access role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value as any})}><option value="manager">Manager</option><option value="coach">Coach</option><option value="player">Player</option><option value="administrator">Administrator</option></select></label><label>Team<select value={form.teamId} onChange={e=>setForm({...form,teamId:e.target.value})}><option value="">No team yet</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label className="span-2">Temporary password<input required minLength={8} value={form.temporaryPassword} onChange={e=>setForm({...form,temporaryPassword:e.target.value})}/></label><div className="span-2 form-actions"><Button><UserPlus size={16}/> Create User</Button></div>{message&&<div className="span-2 notice">{message}</div>}</form></Card>
  </section>
}
