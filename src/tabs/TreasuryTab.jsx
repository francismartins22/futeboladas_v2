import { AlertCircle, Wallet, CheckCircle } from "lucide-react";
import { Avatar } from "../components/ui";

/* ----------------------------- Tesouraria -------------------------------- */
export const TreasuryTab = ({ players, matches, collectsFixed, fixedIds, payments, fixedFee, fee, fixedLabel, totalRevenue, totalDebt, currentMonth, setCurrentMonth, paymentModel, onPayFixed, onPayMatch }) => {
  const debtsOf = (pid) => {
    const arr = [];
    if (collectsFixed && fixedIds.includes(pid) && !payments[pid]) arr.push({ id: "fixed", desc: fixedLabel, amount: fixedFee, pay: () => onPayFixed(pid) });
    matches.forEach((m) => { if (m.payments?.[pid] === false) arr.push({ id: m.id, desc: `Jogo ${new Date(m.date).toLocaleDateString("pt-PT", { day: "numeric", month: "numeric" })}`, amount: fee, pay: () => onPayMatch(m.id, pid) }); });
    return arr;
  };
  const withDebt = players.map((p) => ({ ...p, debts: debtsOf(p.id) })).filter((p) => p.debts.length).sort((a, b) => b.debts.reduce((s, d) => s + d.amount, 0) - a.debts.reduce((s, d) => s + d.amount, 0));
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><Wallet size={18} style={{ color: "var(--grass-bright)" }} /> Tesouraria</h2>
        {paymentModel === "monthly" && <input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="ft-input" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }} />}
        {paymentModel === "season" && <span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Época atual</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="ft-card" style={{ padding: 16, background: "linear-gradient(135deg,rgba(34,197,94,.12),var(--card))", borderColor: "rgba(34,197,94,.25)" }}><div className="eyebrow" style={{ color: "var(--grass-bright)" }}>Recebido</div><div className="num" style={{ fontSize: 28, marginTop: 4 }}>{totalRevenue.toFixed(2)}EUR</div></div>
        <div className="ft-card" style={{ padding: 16, background: "linear-gradient(135deg,rgba(240,86,58,.12),var(--card))", borderColor: "rgba(240,86,58,.25)" }}><div className="eyebrow" style={{ color: "#ff9684" }}>Dívida total</div><div className="num" style={{ fontSize: 28, marginTop: 4 }}>{totalDebt.toFixed(2)}EUR</div></div>
      </div>
      <div className="ft-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 14px", alignItems: "center" }}><AlertCircle size={17} style={{ color: "#ff9684" }} /> Dívidas pendentes</h3>
        {withDebt.length === 0 ? <div style={{ textAlign: "center", color: "var(--faint)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><CheckCircle size={30} /><span>Tudo regularizado!</span></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {withDebt.map((p) => (
              <div key={p.id} className="ft-raised" style={{ borderRadius: 14, overflow: "hidden", borderColor: "rgba(240,86,58,.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "rgba(0,0,0,.2)", borderBottom: "1px solid var(--line)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p.name} photo={p.photoUrl} size={32} /><div><div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>{p.type === "guest" && <div style={{ fontSize: 9, color: "var(--faint)" }}>Convidado</div>}</div></div><div className="num" style={{ fontSize: 18, color: "#ff9684" }}>{p.debts.reduce((s, d) => s + d.amount, 0).toFixed(2)}EUR</div></div>
                <div style={{ padding: 6 }}>{p.debts.map((d) => (<div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px" }}><span style={{ fontSize: 12, color: "var(--dim)" }}>{d.desc}</span><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 12, color: "var(--dim)" }}>{d.amount.toFixed(2)}EUR</span><button onClick={d.pay} className="ft-btn" style={{ background: "rgba(34,197,94,.15)", color: "var(--grass-bright)", padding: 7, borderRadius: 9 }}><CheckCircle size={15} /></button></div></div>))}</div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
};
