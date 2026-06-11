-- Ejecuta este script para bloquear votos desde el inicio del partido.
-- Mantiene tambien el bloqueo cuando el partido ya tiene resultado.

create or replace function public.prevent_pick_after_result()
returns trigger
language plpgsql
as $$
declare
  kickoff timestamptz;
begin
  select match_date into kickoff
  from public.matches
  where id = new.match_id;

  if kickoff is null then
    raise exception 'Match not found';
  end if;

  if kickoff <= now() then
    raise exception 'This match has already started';
  end if;

  if exists (select 1 from public.results where match_id = new.match_id) then
    raise exception 'This match already has a result';
  end if;

  new.updated_at = now();
  return new;
end;
$$;
