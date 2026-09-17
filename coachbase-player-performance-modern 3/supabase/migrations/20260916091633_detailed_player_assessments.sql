-- Apply after the two earlier CoachPortal migrations. Existing ratings are preserved.
begin;
alter table public.assessments add column if not exists area_ratings jsonb;
comment on column public.assessments.area_ratings is 'Rubric v1: 47 integer area ratings grouped by five category keys. NULL means an earlier category-only assessment.';
alter table public.assessments alter column technical type numeric using technical::numeric;
alter table public.assessments drop constraint if exists coachportal_technical_five_point;
alter table public.assessments add constraint coachportal_technical_five_point check (technical is null or (technical between 1 and 5 and (area_ratings is not null or technical=trunc(technical))));
alter table public.assessments alter column tactical type numeric using tactical::numeric;
alter table public.assessments drop constraint if exists coachportal_tactical_five_point;
alter table public.assessments add constraint coachportal_tactical_five_point check (tactical is null or (tactical between 1 and 5 and (area_ratings is not null or tactical=trunc(tactical))));
alter table public.assessments alter column physical type numeric using physical::numeric;
alter table public.assessments drop constraint if exists coachportal_physical_five_point;
alter table public.assessments add constraint coachportal_physical_five_point check (physical is null or (physical between 1 and 5 and (area_ratings is not null or physical=trunc(physical))));
alter table public.assessments alter column mental type numeric using mental::numeric;
alter table public.assessments drop constraint if exists coachportal_mental_five_point;
alter table public.assessments add constraint coachportal_mental_five_point check (mental is null or (mental between 1 and 5 and (area_ratings is not null or mental=trunc(mental))));
alter table public.assessments alter column attitude type numeric using attitude::numeric;
alter table public.assessments drop constraint if exists coachportal_attitude_five_point;
alter table public.assessments add constraint coachportal_attitude_five_point check (attitude is null or (attitude between 1 and 5 and (area_ratings is not null or attitude=trunc(attitude))));

-- Validate the complete rubric and derive categories inside the database, too.
-- This trigger does not bypass RLS and never modifies authorization.
create or replace function private.compute_assessment_categories()
returns trigger language plpgsql security invoker set search_path='' as $function$
declare
 expected constant jsonb := '{"technical":["ball_control","passing","dribbling","shooting","finishing","weak_foot","one_v_one_attacking","one_v_one_defending","ball_protection","futsal_techniques"],"tactical":["positioning","game_awareness","decision_making","off_the_ball_movement","defensive_positioning","pressing","transition_to_attack","transition_to_defence","rotation_understanding","space_management","team_shape"],"physical":["speed","agility","explosiveness","endurance","strength","balance","coordination","recovery"],"mental":["concentration","composure","confidence","resilience","decision_speed","adaptability","communication","competitive_mentality"],"attitude":["effort","discipline","coachability","teamwork","respect","training_commitment","responsibility","positive_behaviour","leadership","professionalism"]}'::jsonb;
 category text;
 area text;
 scores jsonb;
 score jsonb;
 number_value numeric;
 total numeric;
 count_areas integer;
 averages jsonb := '{}'::jsonb;
begin
 if new.area_ratings is null then
   if TG_OP='UPDATE' and old.area_ratings is not null then
     raise exception 'Detailed assessment area ratings cannot be removed';
   end if;
   -- Older clients/history remain category-only; never fabricate area scores.
   return new;
 end if;
 if jsonb_typeof(new.area_ratings) is distinct from 'object' then
   raise exception 'Assessment ratings must contain the five category objects';
 end if;
 if (select count(*) from jsonb_object_keys(new.area_ratings)) <> 5 then
   raise exception 'Exactly five assessment categories are required';
 end if;
 for category in select jsonb_object_keys(expected) loop
   scores := new.area_ratings -> category;
   if jsonb_typeof(scores) is distinct from 'object' then
     raise exception 'Missing assessment category: %', category;
   end if;
   count_areas := jsonb_array_length(expected -> category);
   if (select count(*) from jsonb_object_keys(scores)) <> count_areas then
     raise exception 'All % areas in % must be rated, with no extra areas', count_areas, category;
   end if;
   total := 0;
   for area in select jsonb_array_elements_text(expected -> category) loop
     score := scores -> area;
     if jsonb_typeof(score) is distinct from 'number' then
       raise exception 'Area %.% requires a numeric rating', category, area;
     end if;
     number_value := (score #>> '{}')::numeric;
     if number_value < 1 or number_value > 5 or number_value <> trunc(number_value) then
       raise exception 'Area %.% must be a whole number from 1 to 5', category, area;
     end if;
     total := total + number_value;
   end loop;
   averages := averages || jsonb_build_object(category, total / count_areas);
 end loop;
 new := jsonb_populate_record(new, averages);
 return new;
end;
$function$;
revoke all on function private.compute_assessment_categories() from public,anon,authenticated;
drop trigger if exists coachportal_assessment_category_averages on public.assessments;
create trigger coachportal_assessment_category_averages before insert or update on public.assessments
for each row execute function private.compute_assessment_categories();
notify pgrst, 'reload schema';
commit;
