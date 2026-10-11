import { useState } from "react";
import { Plus, Trash2, ArrowRight, Trophy, X, ChevronDown, ChevronUp } from "lucide-react";
import { firstName } from "../utils";
import { Avatar, Stepper } from "../components/ui";
import { SoccerBall } from "../components/icons";

export const LeagueCalendarTab = ({ leagueGames, members, amIAdmin, onAdd, onDelete, onResult }) => {
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [home, setHome] = useState(true);
  const [editResult, setEditResult] = useState(null);
  const [sa, setSa] = useState(""); const [sb, setSb] = useState("");
  const [gstats, setGstats] = useState({});
  const [mvp, setMvp] = useState("");
  const [showStats, setShowStats] = useState(false);

  const sorted = [...leagueGames].sort((a, b) => new Date(a.date) - new Date(b.date));
  const played = sorted.filter((g) => g.scoreA != null);
  const upcoming = sorted.filter((g) => g.scoreA == null);

  // FIX: scoreA e scoreB representam sempre "Nos" e "Adversario" (nao casa/fora).
  // O calculo de pontos/resultado tem de usar scoreA/scoreB diretamente, sem depender de g.home.
  const pts = (g) => { if (g.scoreA == null) return null; const w = g.scoreA > g.scoreB; const d = g.scoreA === g.scoreB; return w ? 3 : d ? 1 : 0; };
  const totalPts = played.reduce((s, g) => s + (pts(g) || 0), 0);
  const wins = played.filter((g) => pts(g) === 3).length;
  const draws = played.filter((g) => pts(g) === 1).length;
  const losses = played.filter((g) => pts(g) === 0).length;

  const submit = () => {
    if (!opponent.trim() || !date) return;
    onAdd({ opponent: opponent.trim(), date: `${date}T${time}:00`, home });
    setOpponent(""); setDate(""); setOpen(false);
  };
  const startResult = (g) => {
    setEditResult(g); setSa(""); setSb(""); setMvp(""); setShowStats(false);
    const lineupIds = g.lineup?.lineup ? Object.entries(g.lineup.lineup).filter(([, v]) => v.role === "titular" || v.role === "suplente").map(([id]) => id) : members.map((m) => m.id);
    const gs = {}; lineupIds.forEach((id) => (gs[id] = { g: 0, a: 0 })); setGstats(gs);
  };
  const bump = (pid, key, d) => setGstats((g) => ({ ...g, [pid]: { ...g[pid], [key]: Math.max(0, (g[pid]?.[key] || 0) + d) } }));
  const saveResult = (g) => {
    if (sa === "" || sb === "") return;
    onResult(g.id, parseInt(sa, 10), parseInt(sb, 10), gstats, mvp || null);
    setEditResult(null); setSa(""); setSb(""); setGstats({}); setMvp("");
  };

  const calledPlayers = (g) => {
    if (!g.lineup?.lineup) return members;
    const ids = Object.keys(g.lineup.lineup);
    return members.filter((m) => ids.includes(m.id));
  };

  const GameCard = (g) => {
    const d = new Date(g.date); const past = g.scoreA != null;
    // FIX: "Nos" e "Adversario" sao sempre scoreA/scoreB, independente de casa ou fora
    const result = past ? (g.scoreA > g.scoreB ? "V" : g.scoreA === g.scoreB ? "E" : "D") : null;
    const resultColor = { V: "var(--grass-bright)", E: "var(--gold)", D: "var(--danger)" }[result];
    const scorers = g.goals ? Object.entries(g.goals).filter(([, v]) => v.g || v.a) : [];
    return (
      <div key={g.id} className="ft-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "rgba(0,0,0,.25)", padding: "6px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: g.home ? "rgba(34,197,94,.15)" : "rgba(106,169,224,.15)", color: g.home ? "var(--grass-bright)" : "var(--blue)" }}>{g.home ? "Casa" : "Fora"}</span>
            {amIAdmin && <button onClick={() => onDelete(g.id)} className="ft-btn" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Trash2 size={12} /></button>}
          </div>
        </div>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {result && <div className="num" style={{ fontSize: 22, color: resultColor, minWidth: 28 }}>{result}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>vs {g.opponent}</div>
            {past && <div className="num" style={{ fontSize: 26, color: "var(--chalk)", marginTop: 2 }}>{g.scoreA} <span style={{ color: "var(--faint)", fontWeight: 300 }}>-</span> {g.scoreB}</div>}
          </div>
          {!past && amIAdmin && editResult?.id !== g.id && (
            <button onClick={() => startResult(g)} className="ft-btn ft-ghost" style={{ fontSize: 12, padding: "8px 12px" }}>Resultado</button>
          )}
        </div>
        {past && (scorers.length > 0 || g.mvp) && (
          <div style={{ padding: "0 16px 14px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {g.mvp && <span style={{ fontSize: 11, color: "var(--gold)", background: "rgba(245,197,66,.12)", border: "1px solid rgba(245,197,66,.3)", borderRadius: 999, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}><Trophy size={11} style={{ fill: "var(--gold)" }} /> MVP: {firstName(members.find((m) => m.id === g.mvp)?.name || "?")}</span>}
            {scorers.map(([pid, v]) => { const nm = firstName(members.find((m) => m.id === pid)?.name || "?"); return (<span key={pid} style={{ fontSize: 11, color: "var(--dim)", background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 10px" }}>{nm}{v.g ? <b style={{ color: "var(--grass-bright)" }}> {v.g}G</b> : ""}{v.a ? <b style={{ color: "var(--blue)" }}> {v.a}A</b> : ""}</span>); })}
          </div>
        )}
        {editResult?.id === g.id && (
          <div className="ft-in" style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" min="0" value={sa} onChange={(e) => setSa(e.target.value)} placeholder="Nos" className="num ft-input" style={{ width: 60, textAlign: "center", fontSize: 22, padding: "8px 4px" }} />
              <span style={{ color: "var(--faint)" }}>-</span>
              <input type="number" min="0" value={sb} onChange={(e) => setSb(e.target.value)} placeholder="Adv" className="num ft-input" style={{ width: 60, textAlign: "center", fontSize: 22, padding: "8px 4px" }} />
            </div>
            <select className="ft-input" value={mvp} onChange={(e) => setMvp(e.target.value)} style={{ fontSize: 13 }}>
              <option value="">MVP do jogo (opcional)</option>
              {calledPlayers(g).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => setShowStats((s) => !s)} className="ft-btn ft-ghost" style={{ padding: 10, justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}><SoccerBall size={14} color="var(--grass-bright)" /> Golos & assistências (opcional)</span>
              <span style={{ transform: showStats ? "rotate(90deg)" : "none", transition: "transform .2s" }}><ArrowRight size={14} /></span>
            </button>
            {showStats && (
              <div className="ft-raised ft-in" style={{ borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 28, paddingRight: 4, marginBottom: 4 }}><span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Golos</span><span className="eyebrow" style={{ color: "var(--blue)" }}>Assist</span></div>
                {calledPlayers(g).map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderTop: "1px solid var(--line-soft)" }}>
                    <Avatar name={p.name} photo={p.photoUrl} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                    <Stepper val={gstats[p.id]?.g || 0} onDec={() => bump(p.id, "g", -1)} onInc={() => bump(p.id, "g", 1)} color="var(--grass-bright)" />
                    <Stepper val={gstats[p.id]?.a || 0} onDec={() => bump(p.id, "a", -1)} onInc={() => bump(p.id, "a", 1)} color="var(--blue)" />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => saveResult(g)} className="ft-btn ft-grass" style={{ flex: 1, padding: 11, fontSize: 13 }}>Guardar resultado</button>
              <button onClick={() => setEditResult(null)} className="ft-btn ft-ghost" style={{ padding: 11 }}><X size={14} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {played.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[["Pontos", totalPts, "var(--gold)"], ["Vitorias", wins, "var(--grass-bright)"], ["Empates", draws, "var(--blue)"], ["Derrotas", losses, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} className="ft-raised" style={{ borderRadius: 14, padding: "10px 8px", textAlign: "center" }}>
              <div className="eyebrow" style={{ color: c }}>{l}</div>
              <div className="num" style={{ fontSize: 26, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {amIAdmin && (
        <button onClick={() => setOpen((o) => !o)} className="ft-btn ft-grass" style={{ padding: 13, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Plus size={16} /> Adicionar jogo oficial</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
      {open && (
        <div className="ft-card ft-in" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Adversario</label><input className="ft-input" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Nome da equipa adversaria..." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Data</label><input type="date" className="ft-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Hora</label><input type="time" className="ft-input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
            {[[true, "Casa"], [false, "Fora"]].map(([v, l]) => <button key={l} onClick={() => setHome(v)} className="ft-btn" style={{ padding: "9px 4px", fontSize: 13, background: home === v ? "var(--grass)" : "none", color: home === v ? "#04130a" : "var(--faint)" }}>{l}</button>)}
          </div>
          <button onClick={submit} disabled={!opponent.trim() || !date} className="ft-btn ft-grass" style={{ padding: 12 }}>Adicionar ao calendário</button>
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Próximos jogos - {upcoming.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{upcoming.map(GameCard)}</div>
        </div>
      )}
      {played.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Jogados - {played.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{played.map(GameCard)}</div>
        </div>
      )}
      {leagueGames.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed var(--line)", borderRadius: 18, color: "var(--faint)", fontSize: 13 }}>Ainda sem jogos na liga.<br />Adiciona o primeiro jogo oficial acima.</div>}
    </div>
  );
};
