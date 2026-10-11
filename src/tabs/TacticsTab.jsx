import { useState, useEffect, useRef } from "react";
import { Plus, Check, RotateCcw, Pencil, X } from "lucide-react";
import { firstName, initials, rnd } from "../utils";
import { Avatar } from "../components/ui";
import { SoccerBall, TacticIcon } from "../components/icons";

/* ------------------------------ Tatica ----------------------------------- */
const FORMATIONS = {
  5: [[50, 90], [30, 72], [70, 72], [35, 50], [65, 50]],
  7: [[50, 92], [24, 75], [50, 77], [76, 75], [30, 53], [70, 53], [50, 37]],
  11: [[50, 93], [18, 79], [40, 81], [60, 81], [82, 79], [26, 59], [50, 61], [74, 59], [32, 39], [68, 39], [50, 30]],
};
const fLabel = (i) => (i === 0 ? "GR" : String(i));
const makeField = (n) => FORMATIONS[n].map((p, i) => ({ id: "f" + i + rnd(), label: fLabel(i), x: p[0], y: p[1] }));
const makeOpp = (n) => FORMATIONS[n].map((p, i) => ({ id: "o" + i + rnd(), label: fLabel(i), x: p[0], y: 100 - p[1] }));

/* Quadro tatico. Com leagueGames (modo liga) carrega a convocatoria de um jogo oficial;
   sem leagueGames (casual/semanal) permite carregar o plantel inteiro. */
export const TacticsTab = ({ members, showToast, leagueGames }) => {
  const isLeague = !!leagueGames;
  const upcoming = isLeague ? leagueGames.filter((g) => g.scoreA == null).sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
  const [selectedGame, setSelectedGame] = useState(null);
  const [size, setSize] = useState(5);
  const [field, setField] = useState(() => makeField(5));
  const [bench, setBench] = useState([]);
  const [showOpp, setShowOpp] = useState(false);
  const [opp, setOpp] = useState([]);
  const [hasBall, setHasBall] = useState(true);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [drawMode, setDrawMode] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (!selectedGame?.lineup) return;
    const { size: s, lineup: l } = selectedGame.lineup;
    if (s) setSize(s);
    if (l) {
      const titIds = Object.entries(l).filter(([, v]) => v.role === "titular").map(([id]) => id);
      const titPlayers = members.filter((m) => titIds.includes(m.id));
      const positions = FORMATIONS[s || 5] || FORMATIONS[5];
      setField(titPlayers.map((m, i) => { const pos = positions[i] || [50, 50]; return { id: "f" + rnd(), label: initials(m.name), name: m.name, x: pos[0], y: pos[1] }; }));
      const benchIds = Object.entries(l).filter(([, v]) => v.role === "suplente").map(([id]) => id);
      setBench(members.filter((m) => benchIds.includes(m.id)).map((m) => ({ id: "b" + rnd(), label: initials(m.name), name: m.name })));
    }
  }, [selectedGame?.id]);

  const pct = (e) => { const r = boardRef.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };

  const applySize = (n) => { setSize(n); setField(makeField(n)); setBench([]); if (showOpp) setOpp(makeOpp(n)); };
  const toggleOpp = () => { setShowOpp((v) => { const n = !v; setOpp(n ? makeOpp(size) : []); return n; }); };
  const loadRoster = () => {
    if (members.length === 0) return showToast("Sem jogadores no plantel", "error");
    setField((f) => f.map((t, i) => (members[i] ? { ...t, label: initials(members[i].name), name: members[i].name } : t)));
    setBench(members.slice(field.length).map((m) => ({ id: "b" + rnd(), label: initials(m.name), name: m.name })));
    showToast("Plantel carregado no campo");
  };
  const addFromBench = (item) => { setBench((b) => b.filter((x) => x.id !== item.id)); setField((f) => [...f, { id: "f" + rnd(), label: item.label, name: item.name, x: 50, y: 50 }]); };
  const addBlank = () => setField((f) => [...f, { id: "f" + rnd(), label: String(f.length), x: 50, y: 50 }]);
  const removeToBench = (t) => { setField((f) => f.filter((x) => x.id !== t.id)); setBench((b) => [...b, { id: "b" + rnd(), label: t.label, name: t.name || t.label }]); };
  const reset = () => { setField(makeField(size)); setOpp(showOpp ? makeOpp(size) : []); setBench([]); setStrokes([]); setBall({ x: 50, y: 50 }); showToast("Quadro reposto"); };

  const onTokenDown = (e, id) => { if (drawMode) return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = id; };
  const onTokenMove = (e, id) => {
    if (dragRef.current !== id) return;
    const p = pct(e); const x = Math.max(4, Math.min(96, p.x)), y = Math.max(3, Math.min(97, p.y));
    if (id === "ball") setBall({ x, y });
    else if (id[0] === "o") setOpp((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
    else setField((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
  };
  const onTokenUp = (e) => { dragRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  const onBoardDown = (e) => { if (!drawMode) return; e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; setStrokes((s) => [...s, [pct(e)]]); };
  const onBoardMove = (e) => { if (!drawMode || !drawingRef.current) return; const p = pct(e); setStrokes((s) => { const c = s.slice(); c[c.length - 1] = [...c[c.length - 1], p]; return c; }); };
  const onBoardUp = () => { drawingRef.current = false; };

  const Token = (t, black) => (
    <div key={t.id} onPointerDown={(e) => onTokenDown(e, t.id)} onPointerMove={(e) => onTokenMove(e, t.id)} onPointerUp={onTokenUp}
      style={{ position: "absolute", left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)", touchAction: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, cursor: drawMode ? "crosshair" : "grab", userSelect: "none", zIndex: 5, background: black ? "#0c0f0e" : "var(--chalk)", color: black ? "#cfe8da" : "#0b0b0b", border: black ? "2px solid #3a4a43" : "2px solid #0b0b0b", boxShadow: "0 3px 8px rgba(0,0,0,.4)" }}>
      {t.label}
      {!black && !drawMode && (
        <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeToBench(t); }}
          style={{ position: "absolute", top: -7, right: -7, width: 16, height: 16, borderRadius: "50%", background: "var(--danger)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,.4)" }}><X size={10} /></span>
      )}
    </div>
  );

  return (
    <div className="ft-in" style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: "flex", gap: 8, alignItems: "center" }}><TacticIcon size={18} /> Quadro tatico</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setDrawMode((d) => !d)} className="ft-btn" title="Desenhar" style={{ padding: 9, borderRadius: 10, background: drawMode ? "var(--lime)" : "var(--raised)", color: drawMode ? "#1a2200" : "var(--text)", border: "1px solid var(--line)" }}><Pencil size={16} /></button>
          <button onClick={reset} className="ft-btn ft-ghost" title="Repor" style={{ padding: 9, borderRadius: 10 }}><RotateCcw size={16} /></button>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="ft-card" style={{ padding: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Jogo oficial (carrega convocatória)</div>
          <select className="ft-input" value={selectedGame?.id || ""} onChange={(e) => setSelectedGame(upcoming.find((g) => g.id === e.target.value) || null)} style={{ padding: "8px 10px", fontSize: 12 }}>
            <option value="">Selecionar jogo...</option>
            {upcoming.map((g) => <option key={g.id} value={g.id}>{new Date(g.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · vs {g.opponent}</option>)}
          </select>
          {selectedGame?.lineup && <p style={{ fontSize: 10, color: "var(--grass-bright)", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}><Check size={10} /> Convocatoria carregada automaticamente</p>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
        {[5, 7, 11].map((n) => <button key={n} onClick={() => applySize(n)} className="ft-btn" style={{ padding: "8px 4px", fontSize: 12, background: size === n ? "var(--grass)" : "none", color: size === n ? "#04130a" : "var(--faint)" }}>{n}x{n}</button>)}
      </div>

      <div ref={boardRef} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp}
        style={{ position: "relative", width: "100%", aspectRatio: "2 / 3", borderRadius: 18, overflow: "hidden", touchAction: "none", border: "1px solid var(--line)", background: "linear-gradient(180deg,#13301f,#0c2016)" }}>
        <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <g fill="none" stroke="rgba(245,248,246,.45)" strokeWidth="0.5">
            <rect x="3" y="3" width="94" height="144" /><line x1="3" y1="75" x2="97" y2="75" />
            <circle cx="50" cy="75" r="11" /><circle cx="50" cy="75" r="0.9" fill="rgba(245,248,246,.7)" stroke="none" />
            <rect x="30" y="3" width="40" height="16" /><rect x="40" y="3" width="20" height="7" />
            <rect x="30" y="131" width="40" height="16" /><rect x="40" y="140" width="20" height="7" />
            <rect x="42" y="0.5" width="16" height="2.5" stroke="rgba(245,248,246,.7)" /><rect x="42" y="147" width="16" height="2.5" stroke="rgba(245,248,246,.7)" />
          </g>
        </svg>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
          {strokes.map((s, i) => <polyline key={i} points={s.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
        </svg>
        {opp.map((t) => Token(t, true))}
        {field.map((t) => Token(t, false))}
        {hasBall && (
          <div onPointerDown={(e) => onTokenDown(e, "ball")} onPointerMove={(e) => onTokenMove(e, "ball")} onPointerUp={onTokenUp}
            style={{ position: "absolute", left: `${ball.x}%`, top: `${ball.y}%`, transform: "translate(-50%,-50%)", touchAction: "none", cursor: drawMode ? "crosshair" : "grab", zIndex: 6 }}>
            <div style={{ background: "#fff", borderRadius: "50%", padding: 2, boxShadow: "0 2px 6px rgba(0,0,0,.5)" }}><SoccerBall size={18} color="#111" /></div>
          </div>
        )}
        {drawMode && <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(198,242,74,.9)", color: "#1a2200", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 8, zIndex: 7 }}>MODO DESENHO</div>}
      </div>

      <div className="ft-card" style={{ padding: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>{isLeague ? "Banco" : "Banco de suplentes"} - {bench.length}</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, minHeight: 40 }}>
          {bench.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>{isLeague ? "Sem suplentes na convocatória." : "Remove jogadores do campo (×) ou carrega o plantel."}</span>}
          {bench.map((b) => (
            <button key={b.id} onClick={() => addFromBench(b)} className="ft-btn" style={{ flexDirection: "column", gap: 4, background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 6px", minWidth: 56 }}>
              <Avatar name={b.name || b.label} size={28} /><span style={{ fontSize: 10, fontWeight: 700 }}>{firstName(b.name || b.label)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ft-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={addBlank} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Plus size={14} /> Adicionar peça</button>
          {!isLeague && <button onClick={loadRoster} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>Carregar plantel</button>}
          <button onClick={toggleOpp} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>{showOpp ? "Tirar adversario" : isLeague ? "Adversario" : "Adversario (preto)"}</button>
          <button onClick={() => setHasBall((b) => !b)} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>{hasBall ? "Tirar bola" : "Por bola"}</button>
          {isLeague && <button onClick={() => setStrokes([])} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Pencil size={14} /> Limpar</button>}
        </div>
        {!isLeague && <button onClick={() => setStrokes([])} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Pencil size={14} /> Limpar desenho</button>}
        {!isLeague && <p style={{ fontSize: 11, color: "var(--faint)", margin: 0 }}>Arrasta as pecas e a bola. O "x" envia o jogador para o banco; toca no banco para o repor.</p>}
      </div>
    </div>
  );
};
