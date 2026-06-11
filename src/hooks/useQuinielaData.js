import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildStats } from '../lib/scoring';

const initialState = {
  pools: [],
  activePool: null,
  poolMembers: [],
  activeMembers: [],
  matches: [],
  picks: [],
  results: [],
  profiles: [],
};

export function useQuinielaData() {
  const [state, setState] = useState(initialState);
  const [selectedPoolId, setSelectedPoolIdState] = useState(() => window.localStorage.getItem('selected_pool_id') ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const setSelectedPoolId = useCallback((poolId) => {
    setSelectedPoolIdState(poolId);
    if (poolId) {
      window.localStorage.setItem('selected_pool_id', poolId);
    } else {
      window.localStorage.removeItem('selected_pool_id');
    }
  }, []);

  const refresh = useCallback(async () => {
    setError('');

    const [poolsRes, profilesRes] = await Promise.all([
      supabase.from('pools').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('name'),
    ]);

    const firstBaseError = [poolsRes, profilesRes].find((response) => response.error)?.error;
    if (firstBaseError) {
      setError(firstBaseError.message);
      setLoading(false);
      return;
    }

    const pools = poolsRes.data ?? [];
    const activePool = pools.find((pool) => pool.id === selectedPoolId) ?? pools.find((pool) => pool.is_active) ?? pools[0] ?? null;

    if (activePool && activePool.id !== selectedPoolId) {
      setSelectedPoolId(activePool.id);
    }

    if (!activePool) {
      setState({
        pools,
        activePool: null,
        poolMembers: [],
        activeMembers: [],
        matches: [],
        picks: [],
        results: [],
        profiles: profilesRes.data ?? [],
      });
      setLoading(false);
      return;
    }

    const [matchesRes, picksRes, resultsRes, membersRes] = await Promise.all([
      supabase.from('matches').select('*').eq('pool_id', activePool.id).order('match_date').order('group_name'),
      supabase.from('picks').select('*, matches!inner(pool_id)').eq('matches.pool_id', activePool.id),
      supabase.from('results').select('*, matches!inner(pool_id)').eq('matches.pool_id', activePool.id),
      supabase.from('pool_members').select('*').eq('pool_id', activePool.id),
    ]);

    const firstError = [matchesRes, picksRes, resultsRes, membersRes].find((response) => response.error)?.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setState({
        pools,
        activePool,
        poolMembers: membersRes.data ?? [],
        activeMembers: (profilesRes.data ?? []).filter((profile) =>
          (membersRes.data ?? []).some((member) => member.user_id === profile.id),
        ),
        matches: matchesRes.data ?? [],
        picks: stripJoinedMatches(picksRes.data ?? []),
        results: stripJoinedMatches(resultsRes.data ?? []),
        profiles: profilesRes.data ?? [],
      });
    }

    setLoading(false);
  }, [selectedPoolId, setSelectedPoolId]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel('quiniela-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'picks' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pools' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pool_members' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, refresh)
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
    () => buildStats(state.activeMembers, state.picks, state.results),
    [state.activeMembers, state.picks, state.results],
  );
  const allStats = useMemo(
    () => buildStats(state.profiles, state.picks, state.results),
    [state.profiles, state.picks, state.results],
  );

  return {
    ...state,
    resultByMatch,
    picksByMatch,
    stats,
    allStats,
    loading,
    error,
    refresh,
    selectedPoolId,
    setSelectedPoolId,
  };
}

function stripJoinedMatches(rows) {
  return rows.map((row) => {
    const cleanRow = { ...row };
    delete cleanRow.matches;
    return cleanRow;
  });
}
