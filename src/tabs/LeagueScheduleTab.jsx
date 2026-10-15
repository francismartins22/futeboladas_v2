import { useMemo } from "react";
import { Trophy, Clock, Share2, ListOrdered } from "lucide-react";
import { firstName } from "../utils";
import { Avatar } from "../components/ui";
import { SoccerBall } from "../components/icons";

/* ========================= AGENDA MODO LIGA ============================== */
export const LeagueScheduleTab = ({ leagueGames, me, players }) => {
  const now = new Date();
  // Jogos sem resultado: os que ja passaram (3h de margem para o jogo acabar) ficam a pedir resultado, nao sao "proximo jogo"
  const unplayed = [...leagueGames].filter((g) => g.scoreA == null).sort((a, b) => new Date(a.date) - new Date(b.date));
  const isOver = (g) => new Date(g.date).getTime() < now.getTime() - 3 * 36e5;
  const next = unplayed.find((g) => !isOver(g));
  const pending = unplayed.filter(isOver);
  const last = [...leagueGames].filter((g) => g.scoreA != null).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const played = leagueGames.filter((g) => g.scoreA != null);
  const wins = played.filter((g) => g.scoreA > g.scoreB).length;
  const draws = played.filter((g) => g.scoreA === g.scoreB).length;
  const losses = played.filter((g) => g.scoreA < g.scoreB).length;
  const pts = wins * 3 + draws;

  const stats = useMemo(() => {
    const map = {};
    played.forEach((g) => {
      Object.entries(g.goals || {}).forEach(([pid, v]) => { if (!map[pid]) map[pid] = { g: 0, a: 0, mvp: 0 }; map[pid].g += v.g || 0; map[pid].a += v.a || 0; });
      if (g.mvp) { if (!map[g.mvp]) map[g.mvp] = { g: 0, a: 0, mvp: 0 }; map[g.mvp].mvp += 1; }
    });
    return Object.entries(map).map(([pid, v]) => ({ pid, ...v, name: players.find((p) => p.id === pid)?.name, photoUrl: players.find((p) => p.id === pid)?.photoUrl })).filter((x) => x.name);
  }, [played, players]);
  const topGoals = [...stats].sort((a, b) => b.g - a.g).filter((p) => p.g > 0).slice(0, 3);
  const topAssists = [...stats].sort((a, b) => b.a - a.a).filter((p) => p.a > 0).slice(0, 3);
  const topMvp = [...stats].sort((a, b) => b.mvp - a.mvp).filter((p) => p.mvp > 0).slice(0, 3);
  const hasRanking = topGoals.length > 0 || topAssists.length > 0 || topMvp.length > 0;

  if (!next && !last && pending.length === 0) return (
    <div className="ft-in" style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed var(--line)", borderRadius: 18, color: "var(--faint)", fontSize: 13 }}>
      <ListOrdered size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p>Ainda sem jogos no calendário.<br />Adiciona jogos no separador Liga.</p>
    </div>
  );
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {pending.length > 0 && (
        <div role="status" style={{ background: "rgba(245,197,66,.08)", border: "1px solid rgba(245,197,66,.3)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: "var(--gold)" }}>Falta registar o resultado</div>
            <div style={{ color: "var(--dim)" }}>{pending.map((g) => `vs ${g.opponent} · ${new Date(g.date).toLocaleDateString("pt-PT", { day: "numeric", month: "numeric" })}`).join(", ")}</div>
          </div>
        </div>
      )}
      {next && (
        <section className="ft-card" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h2 className="num" style={{ fontSize: 34, lineHeight: 1.05, margin: 0, color: "var(--chalk)", textTransform: "uppercase", overflowWrap: "anywhere" }}><span className="sr-only">Próximo jogo oficial: </span>vs {next.opponent}</h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: next.home ? "var(--grass-bright)" : "var(--blue)", background: next.home ? "rgba(34,197,94,.15)" : "rgba(106,169,224,.15)", padding: "3px 10px", borderRadius: 999 }}>{next.home ? "Casa" : "Fora"}</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--dim)", display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} aria-hidden="true" /> {new Date(next.date).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })} · {new Date(next.date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
        </section>
      )}
      {played.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
          {[["Pts", pts, "var(--gold)"], ["V", wins, "var(--grass-bright)"], ["E", draws, "var(--blue)"], ["D", losses, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} className="ft-raised" style={{ borderRadius: 14, padding: "10px 8px", textAlign: "center" }}><div className="eyebrow" style={{ color: c }}>{l}</div><div className="num" style={{ fontSize: 26, color: c }}>{v}</div></div>
          ))}
        </div>
      )}
      {last && (
        <div className="ft-card" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Último resultado</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="num" style={{ fontSize: 22, color: last.scoreA > last.scoreB ? "var(--grass-bright)" : last.scoreA === last.scoreB ? "var(--gold)" : "var(--danger)", minWidth: 28 }}>{last.scoreA > last.scoreB ? "V" : last.scoreA === last.scoreB ? "E" : "D"}</div>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>vs {last.opponent}</div><div className="num" style={{ fontSize: 20, color: "var(--chalk)" }}>{last.scoreA} - {last.scoreB}</div></div>
          </div>
        </div>
      )}
      {hasRanking && (
        <div className="ft-card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}><Trophy size={16} style={{ color: "var(--gold)" }} /> Top da equipa</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {topGoals.length > 0 && (
              <div>
                <div className="eyebrow" style={{ color: "var(--grass-bright)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><SoccerBall size={11} /> Melhores marcadores</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topGoals.map((p, i) => (
                    <div key={p.pid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="num" style={{ width: 18, textAlign: "center", fontSize: 14, color: i === 0 ? "var(--gold)" : "var(--faint)" }}>{i + 1}</span>
                      <Avatar name={p.name} photo={p.photoUrl} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--grass-bright)" }}>{p.g}G</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topAssists.length > 0 && (
              <div>
                <div className="eyebrow" style={{ color: "var(--blue)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Share2 size={11} /> Melhores assistentes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topAssists.map((p, i) => (
                    <div key={p.pid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="num" style={{ width: 18, textAlign: "center", fontSize: 14, color: i === 0 ? "var(--gold)" : "var(--faint)" }}>{i + 1}</span>
                      <Avatar name={p.name} photo={p.photoUrl} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>{p.a}A</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topMvp.length > 0 && (
              <div>
                <div className="eyebrow" style={{ color: "var(--gold)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Trophy size={11} style={{ fill: "var(--gold)" }} /> Mais MVPs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topMvp.map((p, i) => (
                    <div key={p.pid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="num" style={{ width: 18, textAlign: "center", fontSize: 14, color: i === 0 ? "var(--gold)" : "var(--faint)" }}>{i + 1}</span>
                      <Avatar name={p.name} photo={p.photoUrl} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>{p.mvp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
