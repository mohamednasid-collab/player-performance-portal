import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { getAssessments, getPlayers, getSessions, getTeams } from "../services/data";

export function Dashboard() {
  const [stats, setStats] = useState({ teams:0, players:0, sessions:0, assessments:0 });
  useEffect(() => { Promise.all([getTeams(), getPlayers(), getSessions(), getAssessments()]).then(([t,p,s,a]) => setStats({teams:t.length, players:p.length, sessions:s.length, assessments:a.length})); }, []);
  return <section><div className="page-head"><div><h1>Dashboard</h1><p>Team and player performance at a glance.</p></div></div>
    <div className="stats-grid">
      <Card><span>Teams</span><strong>{stats.teams}</strong></Card>
      <Card><span>Players</span><strong>{stats.players}</strong></Card>
      <Card><span>Sessions</span><strong>{stats.sessions}</strong></Card>
      <Card><span>Assessments</span><strong>{stats.assessments}</strong></Card>
    </div>
    <Card><h2>Performance workflow</h2><p>Create a team, add players, log training sessions, complete assessments, then build development plans from the assessment results.</p></Card>
  </section>;
}
