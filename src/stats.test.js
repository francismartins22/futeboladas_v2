// node --test (npm test na raiz)
import test from "node:test";
import assert from "node:assert";
import { playerStats, mvpWinnerId } from "./stats.js";

const matches = [
  { teamA: [{ id: "a" }, { id: "b" }], teamB: [{ id: "c" }], scoreA: 3, scoreB: 1, goals: { a: { g: 2, a: 0 }, b: { g: 1, a: 2 } }, mvpVotes: { u1: "a", u2: "a", u3: "b" } },
  { teamA: [{ id: "a" }], teamB: [{ id: "b" }, { id: "c" }], scoreA: 2, scoreB: 2, goals: {}, mvpVotes: {} },
];
const league = [
  { scoreA: 0, scoreB: 1, playerIds: ["a", "c"], goals: {}, mvp: "c" },
  { scoreA: null, scoreB: null, playerIds: ["a"] }, // por jogar: nao conta
  { scoreA: 4, scoreB: 0, lineup: { lineup: { b: { role: "titular" } } }, goals: { b: { g: 3, a: 0 } } }, // antigo, sem playerIds
];

test("peladas: jogos, vitorias, empates, golos e MVP", () => {
  assert.deepStrictEqual(playerStats("a", matches), { games: 2, wins: 1, draws: 1, losses: 0, goals: 2, assists: 0, mvps: 1 });
  assert.deepStrictEqual(playerStats("c", matches), { games: 2, wins: 0, draws: 1, losses: 1, goals: 0, assists: 0, mvps: 0 });
});

test("liga: so jogos com resultado; participantes por playerIds, convocatoria ou plantel", () => {
  assert.deepStrictEqual(playerStats("a", [], league, ["a", "b", "c"]), { games: 1, wins: 0, draws: 0, losses: 1, goals: 0, assists: 0, mvps: 0 });
  assert.deepStrictEqual(playerStats("b", [], league, ["a", "b", "c"]), { games: 1, wins: 1, draws: 0, losses: 0, goals: 3, assists: 0, mvps: 0 });
  assert.strictEqual(playerStats("c", [], league).mvps, 1);
});

test("apagar/corrigir um jogo muda as estatisticas (sao calculadas, nao somadas)", () => {
  assert.strictEqual(playerStats("a", matches.slice(1)).wins, 0);
  assert.strictEqual(playerStats("a", [{ ...matches[0], scoreA: 0 }]).losses, 1);
});

test("MVP com mais votos; sem votos = nenhum", () => {
  assert.deepStrictEqual(mvpWinnerId(matches[0]), { id: "a", votes: 2 });
  assert.strictEqual(mvpWinnerId(matches[1]), null);
});
