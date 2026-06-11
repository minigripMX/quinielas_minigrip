-- Ejecuta este script una vez para habilitar multiples quinielas.
-- Conserva usuarios, partidos, picks y resultados existentes.

create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.pools (name, description, is_active)
select 'Mundial 2026', 'Quiniela principal del Mundial 2026', true
where not exists (select 1 from public.pools);

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

drop policy if exists "pools are readable by authenticated users" on public.pools;
drop policy if exists "admins manage pools" on public.pools;

create policy "pools are readable by authenticated users"
on public.pools for select
to authenticated
using (true);

create policy "admins manage pools"
on public.pools for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
