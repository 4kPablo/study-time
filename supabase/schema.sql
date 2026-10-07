-- Study Time Supabase Schema
-- Run this in Supabase SQL Editor or via migration CLI
-- WARNING: This drops all existing data! Use for fresh setup only.

-- Drop existing tables (cascades to dependent objects)
drop table if exists sessions cascade;
drop table if exists deadlines cascade;
drop table if exists general_resources cascade;
drop table if exists resources cascade;
drop table if exists activities cascade;
drop table if exists user_settings cascade;
drop table if exists categories cascade;

-- Drop existing types
drop type if exists session_outcome cascade;
drop type if exists session_mode cascade;
drop type if exists deadline_kind cascade;
drop type if exists resource_kind cascade;
drop type if exists category_id cascade;

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Custom types
create type category_id as enum ('estudio', 'desarrollo', 'entrenamiento', 'personal');
create type resource_kind as enum ('pdf', 'youtube', 'campus', 'github', 'drive', 'apuntes', 'link');
create type deadline_kind as enum ('tp', 'parcial', 'final', 'recuperatorio');
create type session_mode as enum ('autogestionada', 'grupo', 'rescate', 'repaso');
create type session_outcome as enum ('excelente', 'bien', 'regular', 'disperso');

-- Categories (fixed reference table)
create table categories (
  id category_id primary key,
  name text not null,
  token text not null
);

insert into categories (id, name, token) values
  ('estudio', 'Estudio', 'cat-estudio'),
  ('desarrollo', 'Desarrollo', 'cat-desarrollo'),
  ('entrenamiento', 'Entrenamiento', 'cat-entrenamiento'),
  ('personal', 'Personal', 'cat-personal');

-- User settings (one row per user)
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_goal_min integer not null default 600,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activities
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id category_id not null,
  name text not null,
  favorite boolean not null default false,
  counts_toward_goal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_user_id_idx on activities(user_id);
create index activities_category_id_idx on activities(category_id);

-- Resources (linked to activities)
create table resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  label text not null,
  url text not null,
  kind resource_kind not null,
  created_at timestamptz not null default now()
);

create index resources_user_id_idx on resources(user_id);
create index resources_activity_id_idx on resources(activity_id);

-- General resources (not tied to activities)
create table general_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  url text not null,
  kind resource_kind not null,
  created_at timestamptz not null default now()
);

create index general_resources_user_id_idx on general_resources(user_id);

-- Deadlines
create table deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  kind deadline_kind not null,
  title text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index deadlines_user_id_idx on deadlines(user_id);
create index deadlines_activity_id_idx on deadlines(activity_id);
create index deadlines_date_idx on deadlines(date);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  category_id category_id not null,
  date date not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_min integer not null,
  mode session_mode not null,
  energy smallint not null check (energy between 1 and 5),
  outcome session_outcome,
  distractions integer not null default 0,
  notes text,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_user_id_idx on sessions(user_id);
create index sessions_activity_id_idx on sessions(activity_id);
create index sessions_category_id_idx on sessions(category_id);
create index sessions_date_idx on sessions(date);
create index sessions_started_at_idx on sessions(started_at);

-- Updated_at trigger
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger update_activities_updated_at
  before update on activities for each row execute function update_updated_at_column();

create trigger update_sessions_updated_at
  before update on sessions for each row execute function update_updated_at_column();

create trigger update_user_settings_updated_at
  before update on user_settings for each row execute function update_updated_at_column();

-- Row Level Security (RLS)
alter table categories enable row level security;
alter table user_settings enable row level security;
alter table activities enable row level security;
alter table resources enable row level security;
alter table general_resources enable row level security;
alter table deadlines enable row level security;
alter table sessions enable row level security;

-- Categories: public read (fixed reference data)
create policy "categories_select_all" on categories for select using (true);

-- User settings: users can only access their own
create policy "user_settings_own" on user_settings
  for all using (auth.uid() = user_id);

-- Activities: users can only access their own
create policy "activities_own" on activities
  for all using (auth.uid() = user_id);

-- Resources: users can only access their own
create policy "resources_own" on resources
  for all using (auth.uid() = user_id);

-- General resources: users can only access their own
create policy "general_resources_own" on general_resources
  for all using (auth.uid() = user_id);

-- Deadlines: users can only access their own
create policy "deadlines_own" on deadlines
  for all using (auth.uid() = user_id);

-- Sessions: users can only access their own
create policy "sessions_own" on sessions
  for all using (auth.uid() = user_id);

-- Realtime publication (optional, for live sync)
alter publication supabase_realtime add table activities;
alter publication supabase_realtime add table resources;
alter publication supabase_realtime add table general_resources;
alter publication supabase_realtime add table deadlines;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table user_settings;