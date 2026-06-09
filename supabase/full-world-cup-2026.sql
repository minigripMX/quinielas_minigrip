-- Ejecuta este script una vez si ya corriste schema.sql y quieres cambiar la quiniela a TODO el Mundial 2026.
-- Advertencia: borra matches actuales y, por cascada, borra picks/results ligados a esos partidos.
-- Conserva auth.users y public.profiles.

alter table public.matches
add column if not exists match_number int,
add column if not exists stage text not null default 'group',
add column if not exists round_label text,
add column if not exists display_order int;

create unique index if not exists matches_match_number_key
on public.matches (match_number)
where match_number is not null;

delete from public.matches;

do $$
declare
  groups text[] := array['A','B','C','D','E','F','G','H','I','J','K','L'];
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
      p1 := group_code || pairing[1]::text;
      p2 := group_code || pairing[2]::text;

      insert into public.matches (
        match_number,
        group_name,
        home_team,
        away_team,
        match_date,
        stage,
        round_label,
        display_order
      ) values (
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

insert into public.matches (match_number, group_name, home_team, away_team, match_date, stage, round_label, display_order) values
(73, 'R32', '1A', '3C/D/E/F/H', '2026-06-28 18:00:00+00', 'knockout', 'Ronda de 32', 73),
(74, 'R32', '1E', '3A/B/C/D/F', '2026-06-28 21:00:00+00', 'knockout', 'Ronda de 32', 74),
(75, 'R32', '1F', '2C', '2026-06-29 18:00:00+00', 'knockout', 'Ronda de 32', 75),
(76, 'R32', '1C', '3D/E/F/I/J', '2026-06-29 21:00:00+00', 'knockout', 'Ronda de 32', 76),
(77, 'R32', '1I', '3C/D/F/G/H', '2026-06-30 18:00:00+00', 'knockout', 'Ronda de 32', 77),
(78, 'R32', '2E', '2I', '2026-06-30 21:00:00+00', 'knockout', 'Ronda de 32', 78),
(79, 'R32', '1A', '3C/E/F/H/I', '2026-07-01 18:00:00+00', 'knockout', 'Ronda de 32', 79),
(80, 'R32', '1L', '3E/H/I/J/K', '2026-07-01 21:00:00+00', 'knockout', 'Ronda de 32', 80),
(81, 'R32', '1D', '3E/F/I/J/K', '2026-07-02 18:00:00+00', 'knockout', 'Ronda de 32', 81),
(82, 'R32', '1G', '3A/E/H/I/J', '2026-07-02 21:00:00+00', 'knockout', 'Ronda de 32', 82),
(83, 'R32', '2K', '2L', '2026-07-03 18:00:00+00', 'knockout', 'Ronda de 32', 83),
(84, 'R32', '1H', '2J', '2026-07-03 21:00:00+00', 'knockout', 'Ronda de 32', 84),
(85, 'R32', '1B', '3E/F/G/J/K', '2026-07-03 23:00:00+00', 'knockout', 'Ronda de 32', 85),
(86, 'R32', '1J', '2H', '2026-07-02 23:00:00+00', 'knockout', 'Ronda de 32', 86),
(87, 'R32', '1K', '3D/E/J/K/L', '2026-07-01 23:00:00+00', 'knockout', 'Ronda de 32', 87),
(88, 'R32', '2D', '2G', '2026-06-30 23:00:00+00', 'knockout', 'Ronda de 32', 88),
(89, 'R16', 'W74', 'W77', '2026-07-04 18:00:00+00', 'knockout', 'Octavos de final', 89),
(90, 'R16', 'W73', 'W75', '2026-07-04 21:00:00+00', 'knockout', 'Octavos de final', 90),
(91, 'R16', 'W76', 'W78', '2026-07-05 18:00:00+00', 'knockout', 'Octavos de final', 91),
(92, 'R16', 'W79', 'W80', '2026-07-05 21:00:00+00', 'knockout', 'Octavos de final', 92),
(93, 'R16', 'W83', 'W84', '2026-07-06 18:00:00+00', 'knockout', 'Octavos de final', 93),
(94, 'R16', 'W81', 'W82', '2026-07-06 21:00:00+00', 'knockout', 'Octavos de final', 94),
(95, 'R16', 'W86', 'W88', '2026-07-07 18:00:00+00', 'knockout', 'Octavos de final', 95),
(96, 'R16', 'W85', 'W87', '2026-07-07 21:00:00+00', 'knockout', 'Octavos de final', 96),
(97, 'QF', 'W89', 'W90', '2026-07-09 20:00:00+00', 'knockout', 'Cuartos de final', 97),
(98, 'QF', 'W93', 'W94', '2026-07-10 20:00:00+00', 'knockout', 'Cuartos de final', 98),
(99, 'QF', 'W91', 'W92', '2026-07-11 18:00:00+00', 'knockout', 'Cuartos de final', 99),
(100, 'QF', 'W95', 'W96', '2026-07-11 21:00:00+00', 'knockout', 'Cuartos de final', 100),
(101, 'SF', 'W97', 'W98', '2026-07-14 20:00:00+00', 'knockout', 'Semifinal', 101),
(102, 'SF', 'W99', 'W100', '2026-07-15 20:00:00+00', 'knockout', 'Semifinal', 102),
(103, '3P', 'L101', 'L102', '2026-07-18 20:00:00+00', 'knockout', 'Tercer lugar', 103),
(104, 'F', 'W101', 'W102', '2026-07-19 20:00:00+00', 'knockout', 'Final', 104);
