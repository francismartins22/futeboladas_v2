const test = require("node:test");
const assert = require("node:assert");
const { rsvpLists, promoted } = require("./rsvp");

const ts = (s) => ({ seconds: s });
const before = {
  responses: { a: "going", b: "going", c: "going", d: "going" },
  goingAt: { a: ts(1), b: ts(2), c: ts(3), d: ts(4) },
};

test("limite de 2: c e d em espera", () => {
  assert.deepStrictEqual(rsvpLists(before, 2), { confirmed: ["a", "b"], waiting: ["c", "d"] });
});

test("b desiste: c sobe e e notificado, d continua em espera", () => {
  const after = { ...before, responses: { ...before.responses, b: "not_going" } };
  assert.deepStrictEqual(promoted(before, after, 2), ["c"]);
});

test("aumentar o limite promove varios; sem limite ninguem fica em espera", () => {
  assert.deepStrictEqual(promoted(before, before, 2), []);
  assert.deepStrictEqual(rsvpLists(before, 0).waiting, []);
});
