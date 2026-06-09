import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildStats } from '../lib/scoring';

const initialState = {
  matches: [],
  picks: [],
  results: [],
  profiles: [],
};

export function useQuinielaData() {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');

    const [matchesRes, picksRes, resultsRes, profilesRes] = await Promise.all([
      supabase.from('matches').select('*').order('match_date').order('group_name'),
      supabase.from('picks').select('*'),
      supabase.from('results').select('*'),
      supabase.from('profiles').select('*').order('name'),
    ]);

    const firstError = [matchesRes, picksRes, resultsRes, profilesRes].find((response) => response.error)?.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setState({
        matches: matchesRes.data ?? [],
        picks: picksRes.data ?? [],
        results: resultsRes.data ?? [],
        profiles: profilesRes.data ?? [],
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel('quiniela-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'picks' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const resultByMatch = useMemo(
    () => new Map(state.results.map((result) => [result.match_id, result])),
    [state.results],
  );
  const picksByMatch = useMemo(() => {
    const grouped = new Map();
    state.picks.forEach((pick) => {
      if (!grouped.has(pick.match_id)) {
        grouped.set(pick.match_id, []);
      }
      grouped.get(pick.match_id).push(pick);
    });
    return grouped;
  }, [state.picks]);
  const stats = useMemo(
    () => buildStats(state.profiles, state.picks, state.results),
    [state.profiles, state.picks, state.results],
  );

  return {
    ...state,
    resultByMatch,
    picksByMatch,
    stats,
    loading,
    error,
    refresh,
  };
}
