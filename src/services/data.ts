import { supabase } from "../lib/supabase";
import type { Assessment, DevelopmentPlan, Player, Profile, Team, TrainingSession } from "../types";

export async function getMyProfile(): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
  if (error) throw error;
  return data as Profile;
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Team[];
}

export async function createTeam(input: Pick<Team, "name" | "age_group" | "season">): Promise<Team> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("teams").insert({ ...input, created_by: userData.user.id }).select().single();
  if (error) throw error;
  await supabase.from("team_members").insert({ team_id: data.id, user_id: userData.user.id, role: "coach" });
  return data as Team;
}

export async function getPlayers(teamId?: string): Promise<Player[]> {
  let q = supabase.from("players").select("*").order("full_name");
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function createPlayer(input: Omit<Player, "id" | "active" | "linked_user_id">): Promise<Player> {
  const { data, error } = await supabase.from("players").insert({ ...input, active: true }).select().single();
  if (error) throw error;
  return data as Player;
}

export async function getSessions(teamId?: string): Promise<TrainingSession[]> {
  let q = supabase.from("training_sessions").select("*").order("session_date", { ascending: false });
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TrainingSession[];
}

export async function createSession(input: Omit<TrainingSession, "id" | "created_by">): Promise<TrainingSession> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("training_sessions").insert({ ...input, created_by: userData.user.id }).select().single();
  if (error) throw error;
  return data as TrainingSession;
}

export async function getAssessments(teamId?: string): Promise<Assessment[]> {
  let q = supabase.from("assessments").select("*").order("assessment_date", { ascending: false });
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Assessment[];
}

export async function createAssessment(input: Omit<Assessment, "id" | "assessed_by">): Promise<Assessment> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("assessments").insert({ ...input, assessed_by: userData.user.id }).select().single();
  if (error) throw error;
  return data as Assessment;
}

export async function getDevelopmentPlans(teamId?: string): Promise<DevelopmentPlan[]> {
  let q = supabase.from("development_plans").select("*").order("created_at", { ascending: false });
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DevelopmentPlan[];
}

export async function createDevelopmentPlan(input: Omit<DevelopmentPlan, "id" | "created_by">): Promise<DevelopmentPlan> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { data, error } = await supabase.from("development_plans").insert({ ...input, created_by: userData.user.id }).select().single();
  if (error) throw error;
  return data as DevelopmentPlan;
}

export async function createManagedUser(input: {
  username: string;
  fullName: string;
  role: "administrator" | "coach" | "manager" | "player";
  teamId?: string;
  temporaryPassword: string;
}) {
  const { data, error } = await supabase.functions.invoke("admin-create-user", { body: input });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
