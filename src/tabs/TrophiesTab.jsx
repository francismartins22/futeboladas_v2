import { useMemo } from "react";
import { Star, Trophy, CheckCircle, Award, Flame, Medal, ShieldCheck } from "lucide-react";
import { firstName } from "../utils";
import { Avatar } from "../components/ui";
import { SoccerBall } from "../components/icons";
import { playerStats } from "../stats";

/* ----------------------------- Carreira ---------------------------------- */
export const TrophiesTab = ({ myProfile, amIAdmin, avg, fixedIds, players, matches, leagueGames }) => {
  const memberIds = players.filter((p) => p.type !== "guest").map((p) => p.id);
  const s = playerStats(myProfile?.id, matches, leagueGames, memberIds);
  const winRate = s.games ? s.wins / s.games : 0;
  const scorerMap = useMemo(() => {
    const map = {};
    matches.forEach((m) => Object.entries(m.goals || {}).forEach(([pid, v]) => { if (!map[pid]) map[pid] = { g: 0, a: 0 }; map[pid].g += v.g || 0; map[pid].a += v.a || 0; }));
    (leagueGames || []).forEach((g) => Object.entries(g.goals || {}).forEach(([pid, v]) => { if (!map[pid]) map[pid] = { g: 0, a: 0 }; map[pid].g += v.g || 0; map[pid].a += v.a || 0; }));
    return map;
  }, [matches, leagueGames]);
  const top = Object.entries(scorerMap).map(([pid, v]) => ({ pid, ...v, name: players.find((p) => p.id === pid)?.name })).filter((x) => x.name).sort((a, b) => b.g - a.g || b.a - a.a).slice(0, 5);
  const ach = [
    { ok: s.games >= 50, Icon: Trophy, c: "var(--gold)", t: "Lenda do clube", d: "+50 jogos realizados" },
    { ok: s.games >= 10, Icon: Medal, c: "var(--blue)", t: "Veterano", d: "+10 jogos realizados" },
    { ok: winRate > 0.6 && s.games >= 5, Icon: Flame, c: "#ff8a4c", t: "Imparável", d: "+60% vitórias (mín. 5 jogos)" },
    { ok: s.goals >= 10, Icon: SoccerBall, c: "var(--grass-bright)", t: "Goleador", d: "+10 golos marcados" },
    { ok: fixedIds.includes(myProfile?.id), Icon: ShieldCheck, c: "var(--grass-bright)", t: "Membro fixo", d: "Inscrito na época/mês atual" },
  ];
  const Stat = ({ label, value, color }) => (<div className="ft-raised" style={{ borderRadius: 12, padding: 10, textAlign: "center" }}><div className="eyebrow" style={{ color: color || "var(--faint)" }}>{label}</div><div className="num" style={{ fontSize: 22, color: color || "var(--text)" }}>{value}</div></div>);
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ft-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
        <Trophy size={120} style={{ position: "absolute", top: -10, right: -10, color: "var(--gold)", opacity: .06 }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ margin: "0 auto 10px", width: 84, height: 84 }}><Avatar name={myProfile?.name || "Eu"} photo={myProfile?.photoUrl} size={84} /></div>
          <h2 className="num" style={{ fontSize: 24, color: "var(--chalk)", margin: 0 }}>{(myProfile?.name || "EU").toUpperCase()}</h2>
          <p className="eyebrow" style={{ marginTop: 4, marginBottom: 18 }}>Estatísticas de carreira</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            <Stat label="Jogos" value={s.games} /><Stat label="Vitórias" value={s.wins} color="var(--grass-bright)" /><Stat label="Win %" value={`${Math.round(winRate * 100)}%`} color="var(--blue)" />
            <Stat label="Golos" value={s.goals} color="var(--grass-bright)" /><Stat label="Assist." value={s.assists} color="var(--blue)" /><Stat label="MVPs" value={s.mvps} color="var(--gold)" />
          </div>
          {amIAdmin && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(106,169,224,.1)", border: "1px solid rgba(106,169,224,.3)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "var(--blue)" }}><Star size={12} style={{ fill: "var(--blue)" }} /> Rating médio: {avg(myProfile || { votes: {} })}</div>}
        </div>
      </div>
      <div className="ft-card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}><SoccerBall size={16} color="var(--grass-bright)" /> Melhores marcadores</h3>
        {top.length === 0 ? <p style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic", margin: 0 }}>Ainda sem golos registados.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top.map((p, i) => (
              <div key={p.pid} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="num" style={{ width: 22, textAlign: "center", fontSize: 16, color: i === 0 ? "var(--gold)" : "var(--faint)" }}>{i + 1}</span>
                <Avatar name={p.name} size={30} /><span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{firstName(p.name)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--grass-bright)" }}>{p.g}G</span><span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>{p.a}A</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="ft-card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Award size={16} style={{ color: "var(--gold)" }} /> Conquistas</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ach.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, border: "1px solid", borderColor: a.ok ? "rgba(245,197,66,.25)" : "var(--line)", background: a.ok ? "linear-gradient(90deg,rgba(245,197,66,.08),transparent)" : "rgba(0,0,0,.15)", opacity: a.ok ? 1 : .45, filter: a.ok ? "none" : "grayscale(1)" }}>
              <div style={{ padding: 9, borderRadius: "50%", background: "#0a120f", border: "1px solid var(--line)" }}><a.Icon size={17} color={a.c} style={{ color: a.c }} /></div>
              <div style={{ textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{a.t}</div><div style={{ fontSize: 12, color: "var(--dim)" }}>{a.d}</div></div>
              {a.ok && <CheckCircle size={16} style={{ marginLeft: "auto", color: "var(--grass-bright)" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
