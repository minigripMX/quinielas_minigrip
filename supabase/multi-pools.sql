-- Ejecuta este script una vez para habilitar multiples quinielas.
-- Conserva usuarios, partidos, picks y resultados existentes.

create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pool_members (
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pool_id, user_id)
);

insert into public.pools (name, description, is_active)
select 'Mundial 2026', 'Quiniela principal del Mundial 2026', true
where not exists (select 1 from public.pools);

insert into public.pool_members (pool_id, user_id)
select
  (select id from public.pools order by is_active desc, created_at asc limit 1),
  profiles.id
from public.profiles
where profiles.role <> 'admin'
on conflict do nothing;

alter table public.matches
add column if not exists pool_id uuid references public.pools(id) on delete cascade;

update public.matches
set pool_id = (select id from public.pools order by is_active desc, created_at asc limit 1)
where pool_id is null;

alter table public.matches
alter column pool_id set not null;

drop index if exists matches_match_number_key;

create unique index if not exists matches_pool_match_number_key
on public.matches (pool_id, match_number)
where match_number is not null;

alter table public.pools enable row level security;
alter table public.pool_members enable row level security;

drop policy if exists "pools are readable by authenticated users" on public.pools;
drop policy if exists "admins manage pools" on public.pools;
drop policy if exists "pool members are readable by authenticated users" on public.pool_members;
drop policy if exists "admins manage pool members" on public.pool_members;

create policy "pools are readable by authenticated users"
on public.pools for select
to authenticated
using (true);

create policy "admins manage pools"
on public.pools for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "pool members are readable by authenticated users"
on public.pool_members for select
to authenticated
using (true);

create policy "admins manage pool members"
on public.pool_members for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.is_pool_member_for_match(target_match_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches
    join public.pool_members on pool_members.pool_id = matches.pool_id
    where matches.id = target_match_id
      and pool_members.user_id = target_user_id
  );
$$;

drop policy if exists "users create their own picks" on public.picks;
drop policy if exists "users update own unresolved picks" on public.picks;

create policy "users create their own picks"
on public.picks for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_pool_member_for_match(match_id, user_id)
);

create policy "users update own unresolved picks"
on public.picks for update
to authenticated
using (
  auth.uid() = user_id
  and public.is_pool_member_for_match(match_id, user_id)
  and not exists (select 1 from public.results where results.match_id = picks.match_id)
)
with check (
  auth.uid() = user_id
  and public.is_pool_member_for_match(match_id, user_id)
);
