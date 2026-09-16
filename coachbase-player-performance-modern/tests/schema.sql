-- Minimal local replica of the existing live schema, inspected read-only on 2026-09-16.
-- Test fixture only. Do NOT run against a live Supabase project.
create role anon; create role authenticated;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated, anon;
create table auth.users(id uuid primary key);
create type public.app_role as enum ('super_admin','administrator','coach','manager','player');
create type public.member_role as enum ('coach','manager','player');
create table profiles(id uuid primary key references auth.users,username text unique not null,full_name text not null,role app_role not null default 'player',active boolean not null default true,must_change_password boolean not null default false);
create table teams(id uuid primary key default gen_random_uuid(),name text not null,age_group text,season text,created_by uuid not null references auth.users);
create table team_members(team_id uuid references teams on delete cascade,user_id uuid references auth.users on delete cascade,role member_role not null,primary key(team_id,user_id));
create table players(id uuid primary key default gen_random_uuid(),team_id uuid not null references teams on delete cascade,linked_user_id uuid references auth.users on delete set null,full_name text not null,jersey_number int,position text,date_of_birth date,preferred_foot text,notes text,active boolean not null default true,unique(team_id,jersey_number));
create table training_sessions(id uuid primary key default gen_random_uuid(),team_id uuid not null references teams on delete cascade,session_date date not null,title text not null,focus text,duration_minutes int,notes text,created_by uuid not null references auth.users);
create table assessments(id uuid primary key default gen_random_uuid(),team_id uuid not null references teams on delete cascade,player_id uuid not null references players on delete cascade,session_id uuid references training_sessions on delete set null,assessment_date date not null,technical numeric check(technical between 0 and 10),tactical numeric check(tactical between 0 and 10),physical numeric check(physical between 0 and 10),mental numeric check(mental between 0 and 10),attitude numeric check(attitude between 0 and 10),comments text,assessed_by uuid not null references auth.users);
create table development_plans(id uuid primary key default gen_random_uuid(),team_id uuid not null references teams on delete cascade,player_id uuid not null references players on delete cascade,title text not null,objective text,action_items text,target_date date,status text default 'active',created_by uuid not null references auth.users);
