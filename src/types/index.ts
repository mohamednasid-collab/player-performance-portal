export type AppRole = "super_admin" | "administrator" | "coach" | "manager" | "player";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  role: AppRole;
  must_change_password: boolean;
  active: boolean;
};

export type Team = {
  id: string;
  name: string;
  age_group: string | null;
  season: string | null;
  created_by: string;
};

export type Player = {
  id: string;
  team_id: string;
  linked_user_id: string | null;
  full_name: string;
  jersey_number: number | null;
  position: string | null;
  date_of_birth: string | null;
  preferred_foot: string | null;
  notes: string | null;
  active: boolean;
};

export type TrainingSession = {
  id: string;
  team_id: string;
  session_date: string;
  title: string;
  focus: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_by: string;
};

export type Assessment = {
  id: string;
  team_id: string;
  player_id: string;
  session_id: string | null;
  assessment_date: string;
  technical: number | null;
  tactical: number | null;
  physical: number | null;
  mental: number | null;
  attitude: number | null;
  comments: string | null;
  assessed_by: string;
};

export type DevelopmentPlan = {
  id: string;
  team_id: string;
  player_id: string;
  title: string;
  objective: string;
  action_items: string | null;
  target_date: string | null;
  status: "active" | "completed" | "paused";
  created_by: string;
};
