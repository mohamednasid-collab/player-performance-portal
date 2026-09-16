-- Apply after 20260916052019_team_access_five_point_ratings.sql.
-- Fixes INSERT ... RETURNING visibility and adds optional player details.
begin;
alter table public.players
  add column if not exists nickname text,
  add column if not exists mobile_number text,
  add column if not exists height_cm numeric(5,2),
  add column if not exists weight_kg numeric(5,2);
alter table public.players drop constraint if exists players_height_cm_range;
alter table public.players add constraint players_height_cm_range check(height_cm is null or (height_cm > 0 and height_cm <= 300));
alter table public.players drop constraint if exists players_weight_kg_range;
alter table public.players add constraint players_weight_kg_range check(weight_kg is null or (weight_kg > 0 and weight_kg <= 650));
-- Evaluate the row being returned directly. A STABLE lookup of the players table
-- cannot see a just-inserted row in the same statement and rejects RETURNING.
drop policy if exists players_select on public.players;
create policy players_select on public.players for select to authenticated using (
  auth.uid() is not null
  and private.has_team_access(team_id)
  and (private.current_role() <> 'player' or linked_user_id = auth.uid())
);
-- Keep existing Admin/Coach-only writes and membership restrictions intact.
notify pgrst, 'reload schema';
commit;
