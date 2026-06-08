export function getOutcome(scoreHome, scoreAway) {
  const home = Number(scoreHome);
  const away = Number(scoreAway);

  if (home > away) return '1';
  if (home < away) return '2';
  return 'x';
}

export function formatPick(value) {
  if (value === '1') return '1';
  if (value === '2') return '2';
  return 'X';
}

export function buildStats(profiles, picks, results) {
  const resultByMatch = new Map(results.map((result) => [result.match_id, result]));

  return profiles
    .map((profile) => {
      const userPicks = picks.filter((pick) => pick.user_id === profile.id);
      const hits = userPicks.filter((pick) => {
        const result = resultByMatch.get(pick.match_id);
        return result?.outcome === pick.pick;
      }).length;
      const resolvedPicks = userPicks.filter((pick) => resultByMatch.has(pick.match_id)).length;
      const precision = resolvedPicks ? Math.round((hits / resolvedPicks) * 100) : 0;

      return {
        ...profile,
        picksCount: userPicks.length,
        hits,
        precision,
      };
    })
    .sort((a, b) => b.hits - a.hits || b.precision - a.precision || a.name.localeCompare(b.name));
}
