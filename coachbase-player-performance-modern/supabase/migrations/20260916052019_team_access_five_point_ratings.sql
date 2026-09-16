-- CoachPortal: run BEFORE deploying the accompanying application.
-- Existing schema required. This transaction does not reset the database.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- A private audit copy and marker make the 0–10 -> 1–5 conversion repeat-safe.
create table if not exists private.coachportal_migrations(key text primary key, applied_at timestamptz not null default now());
create table if not exists private.assessment_ratings_before_five_point(
  id uuid primary key, technical numeric, tactical numeric, physical numeric, mental numeric, attitude numeric,
  saved_at timestamptz not null default now()
);
revoke all on private.coachportal_migrations,private.assessment_ratings_before_five_point from public,anon,authenticated;
lock table public.assessments in access exclusive mode;
do $$
begin
  if not exists(select 1 from private.coachportal_migrations where key='five_point_ratings_v1') then
    insert into private.assessment_ratings_before_five_point(id,technical,tactical,physical,mental,attitude)
    select id,technical,tactical,physical,mental,attitude from public.assessments on conflict(id) do nothing;
    -- Half the old rating, rounded to nearest integer (halves up), clamped to 1–5.
    -- Null remains unassessed. Old values 0..2 -> 1; 7 -> 4; 10 -> 5.
    update public.assessments set
      technical=case when technical is null then null else greatest(1,least(5,round(technical/2))) end,
      tactical=case when tactical is null then null else greatest(1,least(5,round(tactical/2))) end,
      physical=case when physical is null then null else greatest(1,least(5,round(physical/2))) end,
      mental=case when mental is null then null else greatest(1,least(5,round(mental/2))) end,
      attitude=case when attitude is null then null else greatest(1,least(5,round(attitude/2))) end;
    insert into private.coachportal_migrations(key) values('five_point_ratings_v1');
  end if;
end $$;
do $$ declare metric text; begin
  foreach metric in array array['technical','tactical','physical','mental','attitude'] loop
    execute format('alter table public.assessments drop constraint if exists %I','assessments_'||metric||'_check');
    execute format('alter table public.assessments drop constraint if exists %I','coachportal_'||metric||'_five_point');
    execute format('alter table public.assessments add constraint %I check (%I is null or (%I between 1 and 5 and %I=trunc(%I)))','coachportal_'||metric||'_five_point',metric,metric,metric,metric);
  end loop;
end $$;

-- These internal lookup functions intentionally bypass RLS to avoid policy recursion.
-- Identity always comes from auth.uid(), and inactive accounts fail closed.
create or replace function private.current_role() returns public.app_role language sql stable security definer set search_path='' as $$
  select role from public.profiles where auth.uid() is not null and id=auth.uid() and active=true;
$$;
create or replace function private.has_team_access(p_team_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and coalesce(
    private.current_role() in ('super_admin','administrator')
    or (private.current_role()='coach' and exists(select 1 from public.teams t where t.id=p_team_id and t.created_by=auth.uid()))
    or (private.current_role()='player' and exists(select 1 from public.players p where p.team_id=p_team_id and p.linked_user_id=auth.uid()))
    or (private.current_role() in ('coach','manager','player') and exists(select 1 from public.team_members m where m.team_id=p_team_id and m.user_id=auth.uid())), false);
$$;
create or replace function private.can_manage_team(p_team_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and coalesce(
    private.current_role() in ('super_admin','administrator')
    or (private.current_role()='coach' and (
      exists(select 1 from public.teams t where t.id=p_team_id and t.created_by=auth.uid())
      or exists(select 1 from public.team_members m where m.team_id=p_team_id and m.user_id=auth.uid() and m.role='coach')
    )),false);
$$;
create or replace function private.can_read_player(p_player_id uuid,p_team_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and private.has_team_access(p_team_id) and exists(
    select 1 from public.players p where p.id=p_player_id and p.team_id=p_team_id
    and (private.current_role()<>'player' or p.linked_user_id=auth.uid())
  );
$$;
revoke all on function private.current_role(),private.has_team_access(uuid),private.can_manage_team(uuid),private.can_read_player(uuid,uuid) from public,anon;
grant execute on function private.current_role(),private.has_team_access(uuid),private.can_manage_team(uuid),private.can_read_player(uuid,uuid) to authenticated;

-- Replace every existing policy on these known portal tables: permissive policies combine with OR.
do $$ declare p record; t text; begin
  for p in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in ('profiles','teams','team_members','players','training_sessions','assessments','development_plans') loop
    execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  end loop;
  foreach t in array array['profiles','teams','team_members','players','training_sessions','assessments','development_plans'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;
-- Prevent users elevating their role or reactivating themselves via self-profile updates.
revoke insert,update,delete on public.profiles from authenticated;
revoke update(id,username,full_name,role,active,must_change_password) on public.profiles from authenticated;
grant update(full_name,must_change_password) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated using(id=auth.uid() or private.current_role() in ('super_admin','administrator'));
create policy profiles_update_self on public.profiles for update to authenticated using(id=auth.uid() and private.current_role() is not null) with check(id=auth.uid() and private.current_role() is not null);

create policy teams_select on public.teams for select to authenticated using(private.has_team_access(id));
create policy teams_insert on public.teams for insert to authenticated with check(created_by=auth.uid() and private.current_role() in ('super_admin','administrator','coach'));
create policy teams_update on public.teams for update to authenticated using(private.can_manage_team(id)) with check(private.can_manage_team(id));
create policy teams_delete on public.teams for delete to authenticated using(private.current_role() in ('super_admin','administrator'));

create policy team_members_select on public.team_members for select to authenticated using(private.has_team_access(team_id));
create policy team_members_insert on public.team_members for insert to authenticated with check(private.can_manage_team(team_id));
create policy team_members_update on public.team_members for update to authenticated using(private.can_manage_team(team_id)) with check(private.can_manage_team(team_id));
create policy team_members_delete on public.team_members for delete to authenticated using(private.can_manage_team(team_id));

create policy players_select on public.players for select to authenticated using(private.can_read_player(id,team_id));
create policy players_insert on public.players for insert to authenticated with check(private.can_manage_team(team_id));
create policy players_update on public.players for update to authenticated using(private.can_manage_team(team_id)) with check(private.can_manage_team(team_id));
create policy players_delete on public.players for delete to authenticated using(private.can_manage_team(team_id));

create policy sessions_select on public.training_sessions for select to authenticated using(private.has_team_access(team_id));
create policy sessions_insert on public.training_sessions for insert to authenticated with check(private.can_manage_team(team_id) and created_by=auth.uid());
create policy sessions_update on public.training_sessions for update to authenticated using(private.can_manage_team(team_id)) with check(private.can_manage_team(team_id));
create policy sessions_delete on public.training_sessions for delete to authenticated using(private.can_manage_team(team_id));

create policy assessments_select on public.assessments for select to authenticated using(private.can_read_player(player_id,team_id));
create policy assessments_insert on public.assessments for insert to authenticated with check(private.can_manage_team(team_id) and assessed_by=auth.uid());
create policy assessments_update on public.assessments for update to authenticated using(private.can_manage_team(team_id)) with check(private.can_manage_team(team_id));
create policy assessments_delete on public.assessments for delete to authenticated using(private.can_manage_team(team_id));

create policy development_select on public.development_plans for select to authenticated using(private.can_read_player(player_id,team_id));
create policy development_insert on public.development_plans for insert to authenticated with check(private.can_manage_team(team_id) and created_by=auth.uid());
create policy development_update on public.development_plans for update to authenticated using(private.can_manage_team(team_id)) with check(private.can_manage_team(team_id));
create policy development_delete on public.development_plans for delete to authenticated using(private.can_manage_team(team_id));

-- Enforce that assessment/player/session links belong to the same team, including parent edits.
-- Existing inconsistent rows cause the whole transaction to roll back for manual review.
create unique index if not exists coachportal_players_id_team on public.players(id,team_id);
create unique index if not exists coachportal_sessions_id_team on public.training_sessions(id,team_id);
alter table public.assessments drop constraint if exists coachportal_assessment_player_team;
alter table public.assessments add constraint coachportal_assessment_player_team foreign key(player_id,team_id) references public.players(id,team_id) on delete cascade;
alter table public.assessments drop constraint if exists coachportal_assessment_session_team;
alter table public.assessments add constraint coachportal_assessment_session_team foreign key(session_id,team_id) references public.training_sessions(id,team_id);
-- Existing single-column FK uses ON DELETE SET NULL: session deletion keeps assessments.
alter table public.development_plans drop constraint if exists coachportal_development_player_team;
alter table public.development_plans add constraint coachportal_development_player_team foreign key(player_id,team_id) references public.players(id,team_id) on delete cascade;
create index if not exists coachportal_members_user_team on public.team_members(user_id,team_id);
create index if not exists coachportal_players_team on public.players(team_id);
create index if not exists coachportal_sessions_team_date on public.training_sessions(team_id,session_date);
create index if not exists coachportal_assessments_player_date on public.assessments(player_id,assessment_date);
create index if not exists coachportal_assessments_team on public.assessments(team_id);
commit;
