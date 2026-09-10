import { useState } from "react";
import { Activity } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";

export function Login() {
  const [role, setRole] = useState("Coach");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const email = `${username.trim().toLowerCase()}@coachbase.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Incorrect username or password.");
    setBusy(false);
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo"><Activity size={30}/></div>
        <h1>CoachLab</h1><p>Player Performance Portal</p>
        <label>Access type<select value={role} onChange={e=>setRole(e.target.value)}><option>Coach</option><option>Manager</option><option>Player</option></select></label>
        <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <div className="error">{error}</div>}
        <Button disabled={busy}>{busy ? "Signing in..." : `Sign in as ${role}`}</Button>
      </form>
    </div>
  );
}
