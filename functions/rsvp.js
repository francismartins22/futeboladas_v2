/* Convocados e lista de espera. E a mesma regra de src/rsvp.js (a app); se mudares uma, muda a outra.
   Ordem de chegada pelo goingAt; respostas antigas sem goingAt contam como as primeiras. */
const millis = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds != null ? t.seconds * 1000 : 0);

function rsvpLists(next, maxPlayers) {
  const going = Object.entries((next && next.responses) || {}).filter(([, s]) => s === "going").map(([uid]) => uid);
  const at = (next && next.goingAt) || {};
  going.sort((a, b) => millis(at[a]) - millis(at[b]) || a.localeCompare(b));
  const limit = Number(maxPlayers) > 0 ? Number(maxPlayers) : Infinity;
  return { confirmed: going.slice(0, limit), waiting: going.slice(limit) };
}

// Quem estava em espera e passou a convocado (no mesmo jogo)
function promoted(before, after, maxPlayers) {
  const wasWaiting = new Set(rsvpLists(before, maxPlayers).waiting);
  return rsvpLists(after, maxPlayers).confirmed.filter((uid) => wasWaiting.has(uid));
}

module.exports = { rsvpLists, promoted };
