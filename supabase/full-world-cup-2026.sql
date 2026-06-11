-- Ejecuta este script una vez si ya corriste schema.sql y quieres cambiar la quiniela a TODO el Mundial 2026.
-- Advertencia: borra matches actuales y, por cascada, borra picks/results ligados a esos partidos.
-- Conserva auth.users y public.profiles.

alter table public.matches
add column if not exists match_number int,
add column if not exists stage text not null default 'group',
add column if not exists round_label text,
add column if not exists display_order int;

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

delete from public.matches
where pool_id = (select id from public.pools order by is_active desc, created_at asc limit 1);

do $$
declare
  target_pool_id uuid := (select id from public.pools order by is_active desc, created_at asc limit 1);
  groups text[] := array['A','B','C','D','E','F','G','H','I','J','K','L'];
  group_teams jsonb := '{
    "A": ["Mexico", "South Africa", "South Korea", "Czechia"],
    "B": ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    "C": ["Brazil", "Morocco", "Haiti", "Scotland"],
    "D": ["United States", "Paraguay", "Australia", "Turkey"],
    "E": ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
    "F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
    "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
    "H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    "I": ["France", "Senegal", "Iraq", "Norway"],
    "J": ["Argentina", "Algeria", "Austria", "Jordan"],
    "K": ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
    "L": ["England", "Croatia", "Ghana", "Panama"]
  }'::jsonb;
  group_code text;
  group_index int;
  match_no int := 1;
  base_date date;
  p1 text;
  p2 text;
  pairings int[][] := array[
    array[1,2],
    array[3,4],
    array[1,3],
    array[4,2],
    array[4,1],
    array[2,3]
  ];
  pairing int[];
begin
  for group_index in 1..array_length(groups, 1) loop
    group_code := groups[group_index];
    base_date := date '2026-06-11' + ((group_index - 1) / 2);

    foreach pairing slice 1 in array pairings loop
      p1 := group_teams -> group_code ->> (pairing[1] - 1);
      p2 := group_teams -> group_code ->> (pairing[2] - 1);

      insert into public.matches (
        pool_id,
        match_number,
        group_name,
        home_team,
        away_team,
        match_date,
        stage,
        round_label,
        display_order
      ) values (
        target_pool_id,
        match_no,
        group_code,
        p1,
        p2,
        (
          case
            when match_no % 6 in (1, 2) then base_date
            when match_no % 6 in (3, 4) then base_date + 7
            else base_date + 13
          end
        )::timestamptz + time '18:00',
        'group',
        'Fase de grupos',
        match_no
      );

      match_no := match_no + 1;
    end loop;
  end loop;
end $$;

insert into public.matches (pool_id, match_number, group_name, home_team, away_team, match_date, stage, round_label, display_order)
select pool.id, data.*
from (select id from public.pools order by is_active desc, created_at asc limit 1) pool
cross join (values
(73, 'R32', '2do lugar Grupo A', '2do lugar Grupo B', '2026-06-28 18:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 73),
(74, 'R32', '1er lugar Grupo E', 'Mejor 3er lugar A/B/C/D/F', '2026-06-28 21:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 74),
(75, 'R32', '1er lugar Grupo F', '2do lugar Grupo C', '2026-06-29 18:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 75),
(76, 'R32', '1er lugar Grupo C', 'Mejor 3er lugar D/E/F/I/J', '2026-06-29 21:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 76),
(77, 'R32', '1er lugar Grupo I', 'Mejor 3er lugar C/D/F/G/H', '2026-06-30 18:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 77),
(78, 'R32', '2do lugar Grupo E', '2do lugar Grupo I', '2026-06-30 21:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 78),
(79, 'R32', '1er lugar Grupo A', 'Mejor 3er lugar C/E/F/H/I', '2026-07-01 18:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 79),
(80, 'R32', '1er lugar Grupo L', 'Mejor 3er lugar E/H/I/J/K', '2026-07-01 21:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 80),
(81, 'R32', '1er lugar Grupo D', 'Mejor 3er lugar E/F/I/J/K', '2026-07-02 18:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 81),
(82, 'R32', '1er lugar Grupo G', 'Mejor 3er lugar A/E/H/I/J', '2026-07-02 21:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 82),
(83, 'R32', '2do lugar Grupo K', '2do lugar Grupo L', '2026-07-03 18:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 83),
(84, 'R32', '1er lugar Grupo H', '2do lugar Grupo J', '2026-07-03 21:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 84),
(85, 'R32', '1er lugar Grupo B', 'Mejor 3er lugar E/F/G/J/K', '2026-07-03 23:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 85),
(86, 'R32', '1er lugar Grupo J', '2do lugar Grupo H', '2026-07-02 23:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 86),
(87, 'R32', '1er lugar Grupo K', 'Mejor 3er lugar D/E/J/K/L', '2026-07-01 23:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 87),
(88, 'R32', '2do lugar Grupo D', '2do lugar Grupo G', '2026-06-30 23:00:00+00'::timestamptz, 'knockout', 'Ronda de 32', 88),
(89, 'R16', 'Ganador M074', 'Ganador M077', '2026-07-04 18:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 89),
(90, 'R16', 'Ganador M073', 'Ganador M075', '2026-07-04 21:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 90),
(91, 'R16', 'Ganador M076', 'Ganador M078', '2026-07-05 18:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 91),
(92, 'R16', 'Ganador M079', 'Ganador M080', '2026-07-05 21:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 92),
(93, 'R16', 'Ganador M083', 'Ganador M084', '2026-07-06 18:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 93),
(94, 'R16', 'Ganador M081', 'Ganador M082', '2026-07-06 21:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 94),
(95, 'R16', 'Ganador M086', 'Ganador M088', '2026-07-07 18:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 95),
(96, 'R16', 'Ganador M085', 'Ganador M087', '2026-07-07 21:00:00+00'::timestamptz, 'knockout', 'Octavos de final', 96),
(97, 'QF', 'Ganador M089', 'Ganador M090', '2026-07-09 20:00:00+00'::timestamptz, 'knockout', 'Cuartos de final', 97),
(98, 'QF', 'Ganador M093', 'Ganador M094', '2026-07-10 20:00:00+00'::timestamptz, 'knockout', 'Cuartos de final', 98),
(99, 'QF', 'Ganador M091', 'Ganador M092', '2026-07-11 18:00:00+00'::timestamptz, 'knockout', 'Cuartos de final', 99),
(100, 'QF', 'Ganador M095', 'Ganador M096', '2026-07-11 21:00:00+00'::timestamptz, 'knockout', 'Cuartos de final', 100),
(101, 'SF', 'Ganador M097', 'Ganador M098', '2026-07-14 20:00:00+00'::timestamptz, 'knockout', 'Semifinal', 101),
(102, 'SF', 'Ganador M099', 'Ganador M100', '2026-07-15 20:00:00+00'::timestamptz, 'knockout', 'Semifinal', 102),
(103, '3P', 'Perdedor M101', 'Perdedor M102', '2026-07-18 20:00:00+00'::timestamptz, 'knockout', 'Tercer lugar', 103),
(104, 'F', 'Ganador M101', 'Ganador M102', '2026-07-19 20:00:00+00'::timestamptz, 'knockout', 'Final', 104)
) as data(match_number, group_name, home_team, away_team, match_date, stage, round_label, display_order);
