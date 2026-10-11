import { Plus, Check, Star, AlertCircle, Minus } from "lucide-react";
import { avatarHue, initials } from "../utils";

export const Avatar = ({ name, photo, size = 36, ring }) => {
  const hue = avatarHue(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.36, color: "#04130a",
      background: photo ? "none" : `linear-gradient(135deg,hsl(${hue} 55% 55%),hsl(${(hue + 40) % 360} 55% 42%))`,
      border: ring ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,.12)",
    }}>
      {photo ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
    </div>
  );
};

export const StarRating = ({ value, onChange, readOnly, size = 16 }) => (
  <div style={{ display: "inline-flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} onClick={(e) => { e.stopPropagation(); if (!readOnly) onChange(s); }} disabled={readOnly} className="ft-btn" style={{ background: "none", padding: 0, borderRadius: 4 }}>
        <Star size={size} style={{ fill: s <= value ? "var(--gold)" : "none", color: s <= value ? "var(--gold)" : "#3a4a43" }} />
      </button>
    ))}
  </div>
);

export const Stepper = ({ val, onDec, onInc, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <button onClick={onDec} className="ft-btn ft-ghost" style={{ width: 26, height: 26, borderRadius: 8, padding: 0 }}><Minus size={12} /></button>
    <span className="num" style={{ minWidth: 18, textAlign: "center", fontSize: 16, color: color || "var(--text)" }}>{val}</span>
    <button onClick={onInc} className="ft-btn ft-ghost" style={{ width: 26, height: 26, borderRadius: 8, padding: 0 }}><Plus size={12} /></button>
  </div>
);

/* ------------------------------ Toast / Nav ------------------------------ */
export const Toast = ({ toast }) => !toast.show ? null : (
  <div className="ft-pop" style={{
    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 80, padding: "12px 18px", borderRadius: 14,
    fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px -8px rgba(0,0,0,.6)",
    background: toast.type === "error" ? "var(--danger)" : "linear-gradient(135deg,var(--grass-bright),var(--grass-2))",
    color: toast.type === "error" ? "#fff" : "#04130a",
  }}>{toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}{toast.msg}</div>
);

// Sub-separadores dentro de uma secao da barra de baixo (ex: Jogo -> Equipas / Tatica / Resultados)
export const SubTabs = ({ items, active, onChange }) => (
  <div role="tablist" style={{ display: "flex", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
    {items.map((t) => (
      <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)} className="ft-btn"
        style={{ flex: 1, padding: "8px 4px", fontSize: 12, background: active === t.id ? "var(--grass)" : "none", color: active === t.id ? "#04130a" : "var(--faint)" }}>{t.label}</button>
    ))}
  </div>
);
