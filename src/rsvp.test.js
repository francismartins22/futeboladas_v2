import test from "node:test";
import assert from "node:assert";
import { rsvpLists } from "./rsvp.js";

const ts = (s) => ({ seconds: s });
const next = {
  responses: { a: "going", b: "going", c: "not_going", d: "going", e: "going" },
  goingAt: { a: ts(30), b: ts(10), d: ts(20) }, // "e" e antigo (sem goingAt) => conta como primeiro
};

test("ordena por ordem de chegada e corta no limite", () => {
  assert.deepStrictEqual(rsvpLists(next, 2), { confirmed: ["e", "b"], waiting: ["d", "a"] });
});

test("sem limite (0 ou vazio) todos sao convocados", () => {
  assert.deepStrictEqual(rsvpLists(next, 0).waiting, []);
  assert.deepStrictEqual(rsvpLists(next, "").confirmed, ["e", "b", "d", "a"]);
});

test("quando um convocado desiste, o primeiro da lista de espera sobe", () => {
  const after = { ...next, responses: { ...next.responses, b: "not_going" } };
  assert.deepStrictEqual(rsvpLists(after, 2), { confirmed: ["e", "d"], waiting: ["a"] });
});

test("sem jogo marcado nao rebenta", () => {
  assert.deepStrictEqual(rsvpLists(null, 10), { confirmed: [], waiting: [] });
});
