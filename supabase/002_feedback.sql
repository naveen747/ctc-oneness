-- CTC Oneness — post-event feedback (run once, after schema.sql)
-- Supabase → SQL Editor → New query → paste this file → Run.
-- Feedback is anonymous: no names, phone numbers, emails or IP addresses are stored.

alter table public.settings
  add column if not exists feedback_open boolean not null default true;

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  food smallint not null check (food between 1 and 5),
  resort smallint not null check (resort between 1 and 5),
  fees smallint not null check (fees between 1 and 5),
  carpool smallint not null check (carpool between 0 and 5), -- 0 = didn't use carpool
  overall smallint not null check (overall between 1 and 10),
  more_events text not null check (more_events in ('yes', 'maybe', 'no')),
  top_games bigint[] not null default '{}' check (cardinality(top_games) <= 4),
  comment text check (comment is null or char_length(comment) <= 1000)
);

-- Website reads/writes only from the server with the service-role key.
alter table public.feedback enable row level security;
