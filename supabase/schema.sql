create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text not null unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  home_team text not null,
  away_team text not null,
  match_date timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  pick text not null check (pick in ('1', 'x', '2')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  score_home int not null check (score_home >= 0),
  score_away int not null check (score_away >= 0),
  outcome text not null check (outcome in ('1', 'x', '2')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.prevent_pick_after_result()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.matches where id = new.match_id and match_date <= now()) then
    raise exception 'This match has already started';
  end if;

  if exists (select 1 from public.results where match_id = new.match_id) then
    raise exception 'This match already has a result';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger picks_block_resolved_matches
before insert or update on public.picks
for each row execute function public.prevent_pick_after_result();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger results_touch_updated_at
before update on public.results
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.picks enable row level security;
alter table public.results enable row level security;

create policy "profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "admins manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "matches are readable by authenticated users"
on public.matches for select
to authenticated
using (true);

create policy "admins manage matches"
on public.matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "picks are readable by authenticated users"
on public.picks for select
to authenticated
using (true);

create policy "users create their own picks"
on public.picks for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update own unresolved picks"
on public.picks for update
to authenticated
using (auth.uid() = user_id and not exists (select 1 from public.results where results.match_id = picks.match_id))
with check (auth.uid() = user_id);

create policy "admins delete picks"
on public.picks for delete
to authenticated
using (public.is_admin());

create policy "results are readable by authenticated users"
on public.results for select
to authenticated
using (true);

create policy "admins manage results"
on public.results for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.matches (group_name, home_team, away_team, match_date) values
('A', 'México', 'Canadá', '2026-06-11 19:00:00+00'),
('A', 'Italia', 'Marruecos', '2026-06-12 19:00:00+00'),
('A', 'México', 'Italia', '2026-06-16 19:00:00+00'),
('A', 'Canadá', 'Marruecos', '2026-06-16 22:00:00+00'),
('A', 'México', 'Marruecos', '2026-06-21 19:00:00+00'),
('A', 'Canadá', 'Italia', '2026-06-21 19:00:00+00'),
('B', 'Argentina', 'Japón', '2026-06-13 19:00:00+00'),
('B', 'Alemania', 'Egipto', '2026-06-13 22:00:00+00'),
('B', 'Argentina', 'Alemania', '2026-06-18 19:00:00+00'),
('B', 'Japón', 'Egipto', '2026-06-18 22:00:00+00'),
('B', 'Argentina', 'Egipto', '2026-06-23 19:00:00+00'),
('B', 'Japón', 'Alemania', '2026-06-23 19:00:00+00'),
('C', 'España', 'Estados Unidos', '2026-06-14 19:00:00+00'),
('C', 'Brasil', 'Corea del Sur', '2026-06-14 22:00:00+00'),
('C', 'España', 'Brasil', '2026-06-19 19:00:00+00'),
('C', 'Estados Unidos', 'Corea del Sur', '2026-06-19 22:00:00+00'),
('C', 'España', 'Corea del Sur', '2026-06-24 19:00:00+00'),
('C', 'Estados Unidos', 'Brasil', '2026-06-24 19:00:00+00'),
('D', 'Francia', 'Australia', '2026-06-15 19:00:00+00'),
('D', 'Inglaterra', 'Chile', '2026-06-15 22:00:00+00'),
('D', 'Francia', 'Inglaterra', '2026-06-20 19:00:00+00'),
('D', 'Australia', 'Chile', '2026-06-20 22:00:00+00'),
('D', 'Francia', 'Chile', '2026-06-25 19:00:00+00'),
('D', 'Australia', 'Inglaterra', '2026-06-25 19:00:00+00');
