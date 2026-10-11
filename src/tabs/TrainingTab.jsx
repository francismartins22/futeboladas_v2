import { useState } from "react";
import { Users, Plus, Trash2, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";

/* ========================= TREINOS ======================================= */
export const TrainingTab = ({ trainings, me, amIAdmin, onAdd, onDelete, onToggle }) => {
  const [open, setOpen] = useState(false);
  const [tdate, setTdate] = useState(""); const [ttime, setTtime] = useState("19:00"); const [local, setLocal] = useState("");
  const submit = () => { if (!tdate || !local.trim()) return; onAdd({ date: `${tdate}T${ttime}:00`, local: local.trim() }); setTdate(""); setLocal(""); setOpen(false); };
  const now = new Date();
  const upcoming = [...trainings].filter((t) => new Date(t.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = [...trainings].filter((t) => new Date(t.date) <= now).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const Card = (t) => {
    const d = new Date(t.date); const myResp = t.responses?.[me.uid];
    const going = Object.values(t.responses || {}).filter((v) => v === "going").length;
    const isFuture = d > now;
    return (
      <div key={t.id} className="ft-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "rgba(0,0,0,.25)", padding: "6px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
          {amIAdmin && <button onClick={() => onDelete(t.id)} className="ft-btn" aria-label="Apagar treino" style={{ background: "none", color: "var(--faint)", padding: 10, margin: "-10px -10px -10px 0" }}><Trash2 size={15} /></button>}
        </div>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 12, background: "rgba(106,169,224,.12)", color: "var(--blue)" }}><Dumbbell size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t.local}</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><Users size={11} /> {going} confirmados</div>
          </div>
          {isFuture && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onToggle(t.id, "going")} className="ft-btn" style={{ fontSize: 12, padding: "6px 10px", background: myResp === "going" ? "var(--grass)" : "var(--raised)", color: myResp === "going" ? "#04130a" : "var(--dim)", border: "1px solid var(--line)" }}>Vou</button>
              <button onClick={() => onToggle(t.id, "not_going")} className="ft-btn" style={{ fontSize: 12, padding: "6px 10px", background: myResp === "not_going" ? "var(--danger)" : "var(--raised)", color: myResp === "not_going" ? "#fff" : "var(--dim)", border: "1px solid var(--line)" }}>Não vou</button>
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {amIAdmin && (
        <button onClick={() => setOpen((o) => !o)} className="ft-btn ft-grass" style={{ padding: 13, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Plus size={16} /> Marcar treino</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
      {open && (
        <div className="ft-card ft-in" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Local</label><input className="ft-input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Campo Municipal de Odivelas" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Data</label><input type="date" className="ft-input" value={tdate} onChange={(e) => setTdate(e.target.value)} /></div>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Hora</label><input type="time" className="ft-input" value={ttime} onChange={(e) => setTtime(e.target.value)} /></div>
          </div>
          <button onClick={submit} disabled={!tdate || !local.trim()} className="ft-btn ft-grass" style={{ padding: 12 }}>Adicionar treino</button>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed var(--line)", borderRadius: 18, color: "var(--faint)", fontSize: 13 }}>Ainda sem treinos marcados.</div>}
      {upcoming.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 10 }}>Próximos treinos</div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{upcoming.map(Card)}</div></div>}
      {past.length > 0 && <div style={{ opacity: 0.6 }}><div className="eyebrow" style={{ marginBottom: 10 }}>Últimos treinos</div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{past.map(Card)}</div></div>}
    </div>
  );
};
