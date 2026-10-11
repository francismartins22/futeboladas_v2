// node --test (corre com "npm test" dentro de functions/)
const test = require("node:test");
const assert = require("node:assert");
const { parseGameDate, formatTime, formatDate } = require("./dates");

test("hora local sem fuso e interpretada em Lisboa (verao = UTC+1)", () => {
  assert.strictEqual(parseGameDate("2026-07-15T21:00:00").toISOString(), "2026-07-15T20:00:00.000Z");
  assert.strictEqual(formatTime("2026-07-15T21:00:00"), "21:00");
});

test("hora local no inverno (UTC+0)", () => {
  assert.strictEqual(parseGameDate("2026-12-15T21:00:00").toISOString(), "2026-12-15T21:00:00.000Z");
  assert.strictEqual(formatTime("2026-12-15T21:00:00"), "21:00");
});

test("data em UTC (toISOString) mostra a hora de Lisboa", () => {
  // o bug original: este jogo das 21:00 aparecia como 20:00 na notificacao
  assert.strictEqual(formatTime("2026-07-15T20:00:00.000Z"), "21:00");
  assert.strictEqual(formatTime("2026-12-15T21:00:00.000Z"), "21:00");
});

test("os dois formatos do mesmo jogo dao o mesmo instante", () => {
  assert.strictEqual(parseGameDate("2026-07-15T21:00:00").getTime(), parseGameDate("2026-07-15T20:00:00.000Z").getTime());
});

test("formatDate inclui dia e hora local", () => {
  assert.match(formatDate("2026-07-15T20:00:00.000Z"), /15 de julho às 21:00$/);
});
