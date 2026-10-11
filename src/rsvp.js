/* Convocados e lista de espera da proxima pelada.
   Ordem de chegada pelo goingAt (hora do servidor em que cada um carregou "Vou jogar").
   Respostas antigas sem goingAt contam como as primeiras. A mesma regra existe em functions/rsvp.js
   (para notificar quem sai da lista de espera); se mudares uma, muda a outra. */

const millis = (t) => (t?.toMillis ? t.toMillis() : t?.seconds != null ? t.seconds * 1000 : 0);

export const rsvpLists = (next, maxPlayers) => {
  const going = Object.entries(next?.responses || {}).filter(([, s]) => s === "going").map(([uid]) => uid);
  const at = next?.goingAt || {};
  going.sort((a, b) => millis(at[a]) - millis(at[b]) || a.localeCompare(b));
  const limit = Number(maxPlayers) > 0 ? Number(maxPlayers) : Infinity;
  return { confirmed: going.slice(0, limit), waiting: going.slice(limit) };
};
