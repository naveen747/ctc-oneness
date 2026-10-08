-- CTC Oneness Family Retreat 2026 — database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run once on a fresh project.

-- 1. Settings (exactly one row)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  announcement text not null default '',
  leaderboard_mode text not null default 'auto'
    check (leaderboard_mode in ('auto', 'open', 'closed')),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- 2. Participants (added on event day after the lottery)
create table if not exists public.participants (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  team text not null check (team in ('green', 'red', 'blue', 'yellow')),
  category text check (category is null or char_length(category) <= 30),
  created_at timestamptz not null default now()
);
create index if not exists participants_team_idx on public.participants (team);

-- 3. Games (names stay hidden from the public until the leaderboard opens)
create table if not exists public.games (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 4. Score log — points are never edited, only added or voided
create table if not exists public.score_entries (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games (id) on delete restrict,
  team text not null check (team in ('green', 'red', 'blue', 'yellow')),
  points int not null check (points in (5, 10)),
  voided boolean not null default false,
  voided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists score_entries_game_idx on public.score_entries (game_id);
-- A team can only score once per game (blocks accidental double taps)
create unique index if not exists score_entries_one_active_per_team
  on public.score_entries (game_id, team) where not voided;

-- 5. Pre-event cheers
create table if not exists public.cheers (
  team text primary key check (team in ('green', 'red', 'blue', 'yellow')),
  count bigint not null default 0
);
insert into public.cheers (team) values ('green'), ('red'), ('blue'), ('yellow')
  on conflict (team) do nothing;

create or replace function public.cheer(p_new text, p_old text default null)
returns void
language sql
as $$
  update public.cheers set count = count + 1 where team = p_new;
  update public.cheers set count = greatest(count - 1, 0)
    where p_old is not null and p_old <> p_new and team = p_old;
$$;

-- 6. Lock everything down. The website talks to the database only from the
--    server with the service-role key, so the public anon key gets no access
--    at all (this is what keeps game names and scores tamper-proof).
alter table public.settings      enable row level security;
alter table public.participants  enable row level security;
alter table public.games         enable row level security;
alter table public.score_entries enable row level security;
alter table public.cheers        enable row level security;

revoke all on function public.cheer(text, text) from public, anon, authenticated;
grant execute on function public.cheer(text, text) to service_role;
