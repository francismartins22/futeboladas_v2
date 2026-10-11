import { ClipboardList } from "lucide-react";
import { Avatar } from "../components/ui";

/* --------------------------- Inscricoes ---------------------------------- */
export const MembersTab = ({ fixedIds, players, myProfile, paymentModel, onSignUp, onSignOut }) => {
  const season = paymentModel === "season";
  const inscrito = fixedIds.includes(myProfile?.id);
  return (
    <div className="ft-in ft-card" style={{ padding: 22, maxWidth: 480, margin: "0 auto" }}>
      <h3 style={{ textAlign: "center", fontSize: 14, fontWeight: 800, display: "flex", justifyContent: "center", gap: 8, margin: "0 0 4px" }}><ClipboardList size={18} style={{ color: "var(--grass-bright)" }} /> {season ? "Inscrições da época" : "Inscrições mensais"}</h3>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--dim)", margin: "0 0 18px" }}>{season ? "Inscreve-te como fixo desta época." : "Inscreve-te como fixo deste mês."}</p>
      {!myProfile ? <p style={{ textAlign: "center", fontSize: 12, color: "var(--faint)" }}>Entra primeiro no plantel.</p> : inscrito
        ? <button onClick={onSignOut} className="ft-btn ft-danger" style={{ width: "100%", padding: 12, marginBottom: 18 }}>Cancelar inscrição</button>
        : <button onClick={onSignUp} className="ft-btn ft-grass" style={{ width: "100%", padding: 12, marginBottom: 18 }}>Inscrever-me</button>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fixedIds.map((id) => { const p = players.find((pl) => pl.id === id); return p ? (<div key={id} className="ft-raised" style={{ borderRadius: 12, padding: 10, display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p.name} photo={p.photoUrl} size={32} /><span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>{id === myProfile?.id && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--grass-bright)", background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)", padding: "3px 8px", borderRadius: 8 }}>Eu</span>}</div>) : null; })}
      </div>
    </div>
  );
};
