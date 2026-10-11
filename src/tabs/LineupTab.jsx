import { useState } from "react";
import { Check, Save, X, Swords } from "lucide-react";
import { firstName } from "../utils";
import { Avatar } from "../components/ui";

/* ========================= LIGA: CALENDARIO ============================== */
const POSITIONS_5 = ["GR","DEF","DEF","MEI","AV"];

const POSITIONS_7 = ["GR","DEF","DEF","DEF","MEI","MEI","AV"];

const POSITIONS_11 = ["GR","DEF","DEF","DEF","DEF","MEI","MEI","MEI","AV","AV","AV"];

const POSITION_OPTS = ["GR","DEF","MEI","AV","SUP"];

/* ========================= LIGA: CONVOCATORIA ============================ */
export const LineupTab = ({ members, amIAdmin, leagueGames, onSaveLineup }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [size, setSize] = useState(5);
  const [lineup, setLineup] = useState({}); // { playerId: { pos, role: "titular"|"suplente" } }
  const [saved, setSaved] = useState(false);

  const upcoming = leagueGames.filter((g) => g.scoreA == null).sort((a, b) => new Date(a.date) - new Date(b.date));
  const defaultPositions = size === 5 ? POSITIONS_5 : size === 7 ? POSITIONS_7 : POSITIONS_11;
  const titulares = members.filter((p) => lineup[p.id]?.role === "titular");
  const suplentes = members.filter((p) => lineup[p.id]?.role === "suplente");
  const notCalled = members.filter((p) => !lineup[p.id]?.role);

  const setRole = (pid, role) => setLineup((l) => ({ ...l, [pid]: { ...l[pid], role } }));
  const setPos = (pid, pos) => setLineup((l) => ({ ...l, [pid]: { ...l[pid], pos } }));
  const clearPlayer = (pid) => setLineup((l) => { const n = { ...l }; delete n[pid]; return n; });

  const save = async () => {
    if (!selectedGame) return;
    if (!(await onSaveLineup(selectedGame.id, { size, lineup }))) return;
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const PlayerRow = ({ p, role }) => (
    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderTop: "1px solid var(--line-soft)" }}>
      <Avatar name={p.name} photo={p.photoUrl} size={30} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
      {role === "titular" && (
        <select value={lineup[p.id]?.pos || ""} onChange={(e) => setPos(p.id, e.target.value)}
          className="ft-input" style={{ width: 72, padding: "4px 6px", fontSize: 12 }}>
          <option value="">Pos.</option>
          {POSITION_OPTS.map((po) => <option key={po} value={po}>{po}</option>)}
        </select>
      )}
      {amIAdmin && (
        <div style={{ display: "flex", gap: 4 }}>
          {role !== "titular" && <button onClick={() => setRole(p.id, "titular")} className="ft-btn" style={{ fontSize: 12, padding: "4px 8px", background: "rgba(34,197,94,.15)", color: "var(--grass-bright)", border: "1px solid rgba(34,197,94,.3)" }}>Titular</button>}
          {role !== "suplente" && <button onClick={() => setRole(p.id, "suplente")} className="ft-btn" style={{ fontSize: 12, padding: "4px 8px", background: "rgba(106,169,224,.15)", color: "var(--blue)", border: "1px solid rgba(106,169,224,.3)" }}>SUP</button>}
          {role && <button onClick={() => clearPlayer(p.id)} aria-label={`Tirar ${firstName(p.name)} da convocatória`} className="ft-btn" style={{ padding: 10, margin: "-6px -4px", background: "none", color: "var(--faint)" }}><X size={14} /></button>}
        </div>
      )}
    </div>
  );

  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ft-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Swords size={16} style={{ color: "var(--gold)" }} /> Jogo oficial</h3>
        {upcoming.length === 0
          ? <p style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic", margin: 0 }}>Adiciona um jogo no Calendário para poder fazer a convocatória.</p>
          : <select className="ft-input" value={selectedGame?.id || ""} onChange={(e) => setSelectedGame(upcoming.find((g) => g.id === e.target.value) || null)}>
              <option value="">Seleciona o jogo...</option>
              {upcoming.map((g) => <option key={g.id} value={g.id}>{new Date(g.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · vs {g.opponent} {g.home ? "(Casa)" : "(Fora)"}</option>)}
            </select>}
      </div>
      {selectedGame && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
            {[5, 7, 11].map((n) => <button key={n} onClick={() => setSize(n)} className="ft-btn" style={{ padding: "8px 4px", fontSize: 12, background: size === n ? "var(--grass)" : "none", color: size === n ? "#04130a" : "var(--faint)" }}>{n}x{n}</button>)}
          </div>
          <div className="ft-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="eyebrow">Titulares <span style={{ color: titulares.length === size ? "var(--grass-bright)" : "var(--faint)" }}>({titulares.length}/{size})</span></span>
              <span style={{ fontSize: 12, color: "var(--faint)" }}>Posição recomendada: {defaultPositions.join("-").replace("GR-", "GR · ")}</span>
            </div>
            {titulares.length === 0 ? <p style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Nenhum titular selecionado.</p> : titulares.map((p) => <PlayerRow key={p.id} p={p} role="titular" />)}
          </div>
          <div className="ft-card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Suplentes ({suplentes.length})</div>
            {suplentes.length === 0 ? <p style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Nenhum suplente selecionado.</p> : suplentes.map((p) => <PlayerRow key={p.id} p={p} role="suplente" />)}
          </div>
          <div className="ft-card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Não convocados ({notCalled.length})</div>
            {notCalled.length === 0 ? <p style={{ fontSize: 12, color: "var(--grass-bright)", fontSize: 12 }}>Toda a gente convocada!</p> : notCalled.map((p) => <PlayerRow key={p.id} p={p} role={null} />)}
          </div>
          {amIAdmin && (
            <button onClick={save} className="ft-btn ft-grass" style={{ width: "100%", padding: 14 }}>
              {saved ? <><Check size={16} /> Guardado!</> : <><Save size={16} /> Guardar convocatória</>}
            </button>
          )}
        </>
      )}
    </div>
  );
};
