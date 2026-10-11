/**
 * Datas dos jogos. A app grava-as em dois formatos:
 *  - "2026-10-20T21:00:00"      (definicoes/treinos/liga: hora local, sem fuso)
 *  - "2026-10-20T20:00:00.000Z" (data avancada automaticamente: toISOString)
 * As functions correm em UTC, por isso a hora local tem de ser interpretada
 * e mostrada no fuso de Portugal.
 * shortcut: fuso fixo Europe/Lisbon, grupos noutros fusos precisam de um campo timeZone no grupo.
 */
const TZ = "Europe/Lisbon";

// Diferenca (ms) entre a hora de Lisboa e UTC num dado instante (0 no inverno, 1h no verao)
function lisbonOffsetMs(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date).map((x) => [x.type, x.value]));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(date.getTime() / 1000) * 1000;
}

function parseGameDate(s) {
  if (/(Z|[+-]\d\d:?\d\d)$/i.test(s)) return new Date(s);
  const asUtc = Date.parse(s + "Z");
  return new Date(asUtc - lisbonOffsetMs(new Date(asUtc)));
}

const formatTime = (s) => parseGameDate(s).toLocaleTimeString("pt-PT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

function formatDate(s) {
  const d = parseGameDate(s);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("pt-PT", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }) + " às " + formatTime(s);
}

module.exports = { parseGameDate, formatTime, formatDate };
