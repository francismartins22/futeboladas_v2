/* Estatisticas calculadas a partir dos jogos (fonte unica de verdade).
   Antes eram somadas no documento do jogador e ficavam erradas ao apagar ou corrigir um jogo. */

// Jogador mais votado para MVP numa pelada (empate: o primeiro a chegar a esse numero de votos)
export const mvpWinnerId = (m) => {
  const c = {}; let max = 0, win = null;
  Object.values(m.mvpVotes || {}).forEach((pid) => { c[pid] = (c[pid] || 0) + 1; if (c[pid] > max) { max = c[pid]; win = pid; } });
  return win ? { id: win, votes: max } : null;
};

// Quem jogou um jogo da liga: lista gravada no resultado; jogos antigos usam a convocatoria ou, sem ela, o plantel atual
export const leagueParticipants = (g, memberIds) =>
  g.playerIds || (g.lineup?.lineup ? Object.keys(g.lineup.lineup) : memberIds);

const result = (mine, other) => (mine > other ? "wins" : mine < other ? "losses" : "draws");

export const playerStats = (pid, matches = [], leagueGames = [], memberIds = []) => {
  const s = { games: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, mvps: 0 };
  const addGoals = (goals) => { s.goals += goals?.[pid]?.g || 0; s.assists += goals?.[pid]?.a || 0; };
  for (const m of matches) {
    const inA = (m.teamA || []).some((p) => p.id === pid), inB = (m.teamB || []).some((p) => p.id === pid);
    if (inA || inB) { s.games++; s[inA ? result(m.scoreA, m.scoreB) : result(m.scoreB, m.scoreA)]++; }
    addGoals(m.goals);
    if (mvpWinnerId(m)?.id === pid) s.mvps++;
  }
  for (const g of leagueGames) {
    if (g.scoreA == null) continue; // ainda nao jogado
    if (leagueParticipants(g, memberIds).includes(pid)) { s.games++; s[result(g.scoreA, g.scoreB)]++; }
    addGoals(g.goals);
    if (g.mvp === pid) s.mvps++;
  }
  return s;
};
