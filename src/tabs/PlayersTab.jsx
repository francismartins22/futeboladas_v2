import { useState } from "react";
import { UserPlus, Plus, Trash2, ArrowRight, Star } from "lucide-react";
import { Avatar, StarRating } from "../components/ui";

/* ----------------------------- Plantel ----------------------------------- */
export const PlayersTab = ({ members, guests, players, me, amIAdmin, isOwner, ownerId, avg, onAdd, onJoin, onRate, onRemove, onToggleAdmin }) => {
  const [name, setName] = useState(""); const [type, setType] = useState("guest"); const [host, setHost] = useState("");
  const [expanded, setExpanded] = useState(null); const [stars, setStars] = useState(3);
  const inRoster = players.some((p) => p.uid === me.uid);
  const submitAdd = () => { if (!name.trim()) return; if (type === "guest" && !host) return; onAdd({ name: name.trim(), type, hostId: type === "guest" ? host : null }); setName(""); };
  const Card = (p) => {
    const open = expanded === p.id; const myVote = p.votes?.[me.uid] || 0;
    return (
      <div key={p.id} onClick={() => { if (open) setExpanded(null); else { setExpanded(p.id); setStars(myVote || 3); } }} className="ft-card" style={{ padding: 12, cursor: "pointer", borderColor: open ? "rgba(34,197,94,.4)" : "var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={p.name} photo={p.photoUrl} size={36} ring={p.isAdmin} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>{p.name}{p.isAdmin && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", background: "rgba(245,197,66,.15)", padding: "1px 6px", borderRadius: 6 }}>Admin</span>}</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{amIAdmin ? <span style={{ color: "var(--gold)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}><Star size={11} style={{ fill: "var(--gold)" }} /> {avg(p)}</span> : myVote ? <span style={{ color: "var(--grass-bright)" }}>Avaliado</span> : <span>Toca para avaliar</span>}</div>
          </div>
          <ArrowRight size={16} style={{ color: "var(--faint)", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
        </div>
        {open && (
          <div className="ft-in" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            {p.uid !== me.uid && (
              <div className="ft-raised" style={{ borderRadius: 14, padding: 14, textAlign: "center", marginBottom: 10 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Classificar</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><StarRating value={stars} onChange={setStars} size={26} /></div>
                <button onClick={(e) => { e.stopPropagation(); onRate(p, stars); setExpanded(null); }} className="ft-btn ft-grass" style={{ width: "100%", padding: 9, fontSize: 13 }}>Confirmar</button>
              </div>
            )}
            {amIAdmin && (
              <div style={{ display: "flex", gap: 8 }}>
                {isOwner && p.uid !== ownerId && <button onClick={(e) => { e.stopPropagation(); onToggleAdmin(p); }} className="ft-btn" style={{ flex: 1, padding: 10, fontSize: 12, border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", color: "var(--gold)" }}>{p.isAdmin ? "Remover admin" : "Promover admin"}</button>}
                <button onClick={(e) => { e.stopPropagation(); onRemove(p); }} className="ft-btn ft-danger" style={{ flex: 1, padding: 10, fontSize: 12 }}><Trash2 size={14} /> Eliminar</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!inRoster && <button onClick={onJoin} className="ft-btn" style={{ background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.4)", color: "var(--grass-bright)", padding: 14, justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><UserPlus size={18} /> Entrar no plantel</span><Plus size={16} /></button>}
      <div className="ft-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><UserPlus size={16} style={{ color: "var(--grass-bright)" }} /> Novo jogador</h3>
          <div style={{ display: "flex", background: "#0a120f", borderRadius: 10, padding: 3, border: "1px solid var(--line)" }}>{["guest", "member"].map((t) => <button key={t} onClick={() => setType(t)} className="ft-btn" style={{ fontSize: 12, fontWeight: 700, padding: "5px 10px", background: type === t ? "var(--raised)" : "none", color: type === t ? "var(--text)" : "var(--faint)" }}>{t === "guest" ? "Convidado" : "Membro"}</button>)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome..." />
          {type === "guest" && <select className="ft-input" value={host} onChange={(e) => setHost(e.target.value)}><option value="">Quem convidou?</option>{members.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          <button onClick={submitAdd} className="ft-btn ft-grass" style={{ padding: 11 }}><Plus size={16} /> Adicionar</button>
        </div>
      </div>
      {members.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8, marginLeft: 4 }}>Membros - {members.length}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{members.map(Card)}</div></div>}
      {guests.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8, marginLeft: 4 }}>Convidados - {guests.length}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{guests.map(Card)}</div></div>}
    </div>
  );
};
