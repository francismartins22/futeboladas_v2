import { useState } from "react";
import { Trash2, Check, Star, Trophy, Pencil, X } from "lucide-react";
import { firstName } from "../utils";
import { Avatar, Stepper } from "../components/ui";

/* ------------------------------ Jogos ------------------------------------ */
export const HistoryTab = ({ matches, matchMVP, amIAdmin, me, onVote, onEdit, onDelete }) => {
  const [voting, setVoting] = useState(null); const [pick, setPick] = useState("");
  const [edit, setEdit] = useState(null); // { id, sa, sb, goals } enquanto um admin corrige um resultado
  const bump = (pid, key, d) => setEdit((e) => ({ ...e, goals: { ...e.goals, [pid]: { g: 0, a: 0, ...e.goals[pid], [key]: Math.max(0, (e.goals[pid]?.[key] || 0) + d) } } }));
  const saveEdit = async () => {
    if (edit.sa === "" || edit.sb === "") return;
    if (await onEdit(edit.id, { scoreA: parseInt(edit.sa, 10), scoreB: parseInt(edit.sb, 10), goals: edit.goals })) setEdit(null);
  };
  if (matches.length === 0) return <div style={{ textAlign: "center", color: "var(--faint)", fontStyle: "italic", padding: 40 }}>Sem jogos registados ainda.</div>;
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {matches.map((m) => {
        const d = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000) : new Date(m.date);
        const hrs = (Date.now() - d.getTime()) / 36e5; const open = hrs < 48; const left = Math.max(0, Math.round(48 - hrs));
        const mvp = matchMVP(m); const myVote = m.mvpVotes?.[me.uid];
        const allp = [...(m.teamA || []), ...(m.teamB || [])];
        const scorers = m.goals ? Object.entries(m.goals).filter(([, v]) => v.g || v.a) : [];
        return (
          <div key={m.id} className="ft-card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ background: "rgba(0,0,0,.25)", padding: "7px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">{d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</span>
              {amIAdmin && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setEdit({ id: m.id, sa: String(m.scoreA), sb: String(m.scoreB), goals: m.goals || {} })} className="ft-btn" title="Corrigir resultado" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Pencil size={13} /></button>
                  <button onClick={() => onDelete(m.id)} className="ft-btn" title="Apagar jogo" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "18px 14px 12px" }}>
              <div style={{ textAlign: "center" }}><span className="bib bib-white" style={{ marginBottom: 6 }}>B</span><div className="num" style={{ fontSize: 44, color: m.scoreA > m.scoreB ? "var(--grass-bright)" : "var(--text)" }}>{m.scoreA}</div></div>
              <span style={{ color: "var(--faint)", fontWeight: 300, fontSize: 18 }}>x</span>
              <div style={{ textAlign: "center" }}><span className="bib bib-black" style={{ marginBottom: 6 }}>P</span><div className="num" style={{ fontSize: 44, color: m.scoreB > m.scoreA ? "var(--grass-bright)" : "var(--text)" }}>{m.scoreB}</div></div>
            </div>
            {edit?.id === m.id && (
              <div className="ft-in" style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <input type="number" min="0" value={edit.sa} onChange={(e) => setEdit({ ...edit, sa: e.target.value })} className="num ft-input" aria-label="Golos Branco" style={{ width: 60, textAlign: "center", fontSize: 22, padding: "8px 4px" }} />
                  <span style={{ color: "var(--faint)" }}>x</span>
                  <input type="number" min="0" value={edit.sb} onChange={(e) => setEdit({ ...edit, sb: e.target.value })} className="num ft-input" aria-label="Golos Preto" style={{ width: 60, textAlign: "center", fontSize: 22, padding: "8px 4px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 28, paddingRight: 4 }}><span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Golos</span><span className="eyebrow" style={{ color: "var(--blue)" }}>Assist</span></div>
                {allp.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px", borderTop: "1px solid var(--line-soft)" }}>
                    <Avatar name={p.name} size={24} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                    <Stepper val={edit.goals[p.id]?.g || 0} onDec={() => bump(p.id, "g", -1)} onInc={() => bump(p.id, "g", 1)} color="var(--grass-bright)" />
                    <Stepper val={edit.goals[p.id]?.a || 0} onDec={() => bump(p.id, "a", -1)} onInc={() => bump(p.id, "a", 1)} color="var(--blue)" />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} className="ft-btn ft-grass" style={{ flex: 1, padding: 11, fontSize: 13 }}>Guardar correção</button>
                  <button onClick={() => setEdit(null)} className="ft-btn ft-ghost" aria-label="Cancelar" style={{ padding: 11 }}><X size={14} /></button>
                </div>
              </div>
            )}
            {scorers.length > 0 && (
              <div style={{ padding: "0 12px 12px", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {scorers.map(([pid, v]) => { const nm = firstName(allp.find((p) => p.id === pid)?.name || "?"); return (<span key={pid} style={{ fontSize: 11, color: "var(--dim)", background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 10px" }}>{nm}{v.g ? <b style={{ color: "var(--grass-bright)" }}> {v.g}G</b> : ""}{v.a ? <b style={{ color: "var(--blue)" }}> {v.a}A</b> : ""}</span>); })}
              </div>
            )}
            <div style={{ background: "rgba(0,0,0,.2)", borderTop: "1px solid var(--line)", padding: 12, minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!open ? (mvp ? <div className="ft-pop" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gold)" }}><Trophy size={15} style={{ fill: "var(--gold)" }} /><span style={{ fontSize: 13, fontWeight: 700 }}>MVP: {firstName(mvp.name)} - {mvp.votes} votos</span></div> : <span style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>Votação encerrada</span>)
                : myVote ? <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "var(--grass-bright)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Check size={11} /> Voto registado</div><div style={{ fontSize: 10, color: "var(--faint)" }}>Resultado em {left}h</div></div>
                  : voting === m.id ? <div style={{ display: "flex", gap: 8, width: "100%" }}><select value={pick} onChange={(e) => setPick(e.target.value)} className="ft-input" style={{ padding: 8, fontSize: 12 }}><option value="">Quem foi o craque?</option>{allp.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={() => { if (pick) { onVote(m.id, pick); setVoting(null); setPick(""); } }} className="ft-btn" style={{ background: "var(--gold)", color: "#1a1300", padding: "0 16px", fontSize: 12 }}>Votar</button></div>
                    : <button onClick={() => setVoting(m.id)} className="ft-btn" style={{ background: "none", color: "var(--gold)", fontSize: 12, fontWeight: 700 }}><Star size={13} /> Votar MVP · faltam {left}h</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
