import { useState, useEffect, useMemo } from "react";
import { Shuffle, Check, ArrowRight, Share2 } from "lucide-react";
import { firstName } from "../utils";
import { Avatar, Stepper } from "../components/ui";
import { SoccerBall } from "../components/icons";
import { rsvpLists } from "../rsvp";

/* ------------------------------ Equipa ----------------------------------- */
export const TeamTab = ({ players, next, maxPlayers, avg, amIAdmin, onSaveMatch, showToast }) => {
  const goingIds = useMemo(() => {
    const uids = rsvpLists(next, maxPlayers).confirmed; // so os convocados; a lista de espera fica de fora
    return players.filter((p) => p.uid && uids.includes(p.uid)).map((p) => p.id);
  }, [next, players, maxPlayers]);
  const [selected, setSelected] = useState([]);
  const [seeded, setSeeded] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState(null);
  const [sa, setSa] = useState(""); const [sb, setSb] = useState("");
  const [gstats, setGstats] = useState({}); const [showStats, setShowStats] = useState(false);
  useEffect(() => { if (!seeded && goingIds.length > 0 && selected.length === 0) { setSelected(goingIds); setSeeded(true); } }, [goingIds, seeded, selected.length]);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const filt = (list) => list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const members = players.filter((p) => p.type !== "guest");
  const guests = players.filter((p) => p.type === "guest");
  const generate = () => {
    if (selected.length < 2) return showToast("Mínimo 2 jogadores", "error");
    const chosen = players.filter((p) => selected.includes(p.id));
    const blocks = {};
    chosen.forEach((p) => { let b = p.id; if (p.type === "guest" && p.hostId && selected.includes(p.hostId)) b = p.hostId; (blocks[b] ||= []).push(p); });
    const list = Object.values(blocks).map((mem) => ({ mem, r: mem.reduce((s, p) => s + avg(p), 0) })).sort((a, b) => b.r - a.r);
    let A = [], B = [], rA = 0, rB = 0;
    list.forEach((blk) => { const pick = rA < rB || (rA === rB && A.length <= B.length) ? "A" : "B"; if (pick === "A") { A = [...A, ...blk.mem]; rA += blk.r; } else { B = [...B, ...blk.mem]; rB += blk.r; } });
    const gs = {}; [...A, ...B].forEach((p) => (gs[p.id] = { g: 0, a: 0 }));
    setGstats(gs); setTeams({ A, B }); showToast("Equipas equilibradas!");
  };
  const bump = (pid, key, d) => setGstats((g) => ({ ...g, [pid]: { ...g[pid], [key]: Math.max(0, (g[pid]?.[key] || 0) + d) } }));
  const share = () => {
    const txt = `*Equipas definidas*\n\nBranco (${teams.A.length})\n${teams.A.map((p) => p.name).join("\n")}\n\nPreto (${teams.B.length})\n${teams.B.map((p) => p.name).join("\n")}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => showToast("Copiado! Cola no WhatsApp.")).catch(() => showToast("Erro ao copiar", "error"));
    else showToast("Erro ao copiar", "error");
  };
  const finish = () => {
    if (sa === "" || sb === "") return showToast("Insere o resultado", "error");
    onSaveMatch({ teamA: teams.A, teamB: teams.B, scoreA: parseInt(sa, 10), scoreB: parseInt(sb, 10), goals: gstats });
  };
  const Grid = (list) => list.length === 0 ? null : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {list.map((p) => { const on = selected.includes(p.id); return (
        <button key={p.id} onClick={() => toggle(p.id)} className="ft-btn" style={{ justifyContent: "flex-start", gap: 8, padding: 10, border: "1px solid", borderColor: on ? "var(--grass-bright)" : "var(--line)", background: on ? "rgba(34,197,94,.14)" : "var(--card)", color: on ? "var(--text)" : "var(--dim)" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid", borderColor: on ? "var(--grass-bright)" : "#4a5a52", background: on ? "var(--grass-bright)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={10} color="#04130a" />}</div>
          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName(p.name)}</span>
        </button>); })}
    </div>
  );
  if (teams) {
    return (
      <div className="ft-pop" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><SoccerBall size={18} color="var(--gold)" /> Jogo a decorrer</h3>
          <button onClick={() => setTeams(null)} style={{ background: "none", border: "none", color: "#ff9684", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        </div>
        <button onClick={share} className="ft-btn" style={{ background: "rgba(106,169,224,.14)", border: "1px solid rgba(106,169,224,.3)", color: "var(--blue)", padding: 11 }}><Share2 size={16} /> Partilhar equipas</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["A", "Branco", "bib-white", teams.A], ["B", "Preto", "bib-black", teams.B]].map(([k, label, bib, listv]) => (
            <div key={k} className="ft-card" style={{ padding: 12, borderTop: `3px solid ${k === "A" ? "var(--chalk)" : "#1a2620"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 8 }}><span className={`bib ${bib}`}>{listv.length}</span><span style={{ fontSize: 13, fontWeight: 800 }}>{label}</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{listv.map((p) => <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}><Avatar name={p.name} photo={p.photoUrl} size={20} /> {firstName(p.name)}</div>)}</div>
            </div>
          ))}
        </div>
        <div className="ft-card" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ textAlign: "center", marginBottom: 12 }}>Resultado final</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <input type="number" min="0" value={sa} onChange={(e) => setSa(e.target.value)} placeholder="0" className="num" style={{ width: 64, height: 64, textAlign: "center", fontSize: 30, background: "#0a120f", border: "1px solid var(--line)", borderRadius: 14, color: "var(--chalk)", outline: "none" }} />
            <span style={{ color: "var(--faint)", fontWeight: 300, fontSize: 22 }}>x</span>
            <input type="number" min="0" value={sb} onChange={(e) => setSb(e.target.value)} placeholder="0" className="num" style={{ width: 64, height: 64, textAlign: "center", fontSize: 30, background: "#0a120f", border: "1px solid var(--line)", borderRadius: 14, color: "var(--chalk)", outline: "none" }} />
          </div>
        </div>
        <button onClick={() => setShowStats((s) => !s)} className="ft-btn ft-ghost" style={{ padding: 12, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><SoccerBall size={15} color="var(--grass-bright)" /> Golos & assistências (opcional)</span>
          <span style={{ transform: showStats ? "rotate(90deg)" : "none", transition: "transform .2s" }}><ArrowRight size={16} /></span>
        </button>
        {showStats && (
          <div className="ft-card ft-in" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 28, paddingRight: 4, marginBottom: 4 }}><span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Golos</span><span className="eyebrow" style={{ color: "var(--blue)" }}>Assist</span></div>
            {[...teams.A, ...teams.B].map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderTop: "1px solid var(--line-soft)" }}>
                <Avatar name={p.name} photo={p.photoUrl} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                <Stepper val={gstats[p.id]?.g || 0} onDec={() => bump(p.id, "g", -1)} onInc={() => bump(p.id, "g", 1)} color="var(--grass-bright)" />
                <Stepper val={gstats[p.id]?.a || 0} onDec={() => bump(p.id, "a", -1)} onInc={() => bump(p.id, "a", 1)} color="var(--blue)" />
              </div>
            ))}
          </div>
        )}
        {amIAdmin
          ? <button onClick={finish} className="ft-btn ft-grass" style={{ width: "100%", padding: 14 }}>Terminar jogo</button>
          : <p style={{ textAlign: "center", fontSize: 12, color: "var(--faint)", margin: 0 }}>Só os admins podem guardar o resultado.</p>}
      </div>
    );
  }
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ft-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Selecionar - {selected.length}</h3>
          <button onClick={generate} className="ft-btn ft-grass" style={{ fontSize: 12, padding: "8px 14px" }}><Shuffle size={14} /> Criar equipas</button>
        </div>
        <input className="ft-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar jogador..." />
      </div>
      {filt(members).length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8 }}>Membros</div>{Grid(filt(members))}</div>}
      {filt(guests).length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8 }}>Convidados</div>{Grid(filt(guests))}</div>}
    </div>
  );
};
