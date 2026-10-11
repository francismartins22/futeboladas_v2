import { useState } from "react";
import { CalendarCheck, Trash2, LogOut, Save, ShieldAlert, Trophy, Clock, Map as MapIcon, Wallet, Zap } from "lucide-react";

/* ----------------------------- Definicoes -------------------------------- */
export const SettingsTab = ({ settings, next, isOwner, amIAdmin, onSave, onLeave, onDelete }) => {
  const isLeague = settings.groupMode === "league";
  const [model, setModel] = useState(isLeague && settings.paymentModel === "pergame" ? "monthly" : (settings.paymentModel || "monthly"));
  const [monthlyFee, setMonthlyFee] = useState(settings.monthlyFee ?? 0);
  const [seasonFee, setSeasonFee] = useState(settings.seasonFee ?? 0);
  const [guestFee, setGuestFee] = useState(settings.guestFee ?? 4.5);
  const [date, setDate] = useState(next?.date ? new Date(next.date).toISOString().slice(0, 10) : "");
  const [time, setTime] = useState(next?.date ? new Date(next.date).toTimeString().slice(0, 5) : "21:00");
  const [freq, setFreq] = useState(next?.frequency || "weekly");
  const [locationUrl, setLocationUrl] = useState(settings.locationUrl || "");
  const Label = ({ children }) => <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>{children}</label>;
  const MODELS = isLeague ? [["monthly", "Mensal"], ["season", "Epoca/Anual"]] : [["pergame", "Jogo-a-jogo"], ["monthly", "Mensal"], ["season", "Epoca"]];
  const save = () => onSave({ paymentModel: model, monthlyFee, seasonFee, guestFee, date, time, freq, locationUrl });
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 16px", alignItems: "center" }}><Wallet size={17} style={{ color: "var(--blue)" }} /> {isLeague ? "Quota da equipa" : "Modelo de pagamento"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${MODELS.length},1fr)`, gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)", marginBottom: 14 }}>
            {MODELS.map(([v, l]) => <button key={v} onClick={() => setModel(v)} className="ft-btn" style={{ padding: "9px 4px", fontSize: 12, background: model === v ? "var(--grass)" : "none", color: model === v ? "#04130a" : "var(--faint)" }}>{l}</button>)}
          </div>
          <p style={{ fontSize: 11, color: "var(--dim)", margin: "0 0 14px" }}>
            {!isLeague && model === "pergame" && "Todos pagam um valor por cada jogo."}
            {!isLeague && model === "monthly" && "Os fixos pagam uma mensalidade; convidados pagam por jogo."}
            {!isLeague && model === "season" && "Os fixos pagam uma vez por toda a época; convidados pagam por jogo."}
            {isLeague && model === "monthly" && "Todos os membros pagam uma quota mensal fixa da equipa."}
            {isLeague && model === "season" && "Todos os membros pagam uma quota unica para toda a epoca/temporada."}
          </p>
          {model === "monthly" && <div style={{ marginBottom: isLeague ? 0 : 14 }}><Label>{isLeague ? "Valor da quota mensal (EUR)" : "Valor da mensalidade (EUR)"}</Label><input type="number" step="0.50" className="ft-input" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} /></div>}
          {model === "season" && <div style={{ marginBottom: isLeague ? 0 : 14 }}><Label>{isLeague ? "Valor da quota da epoca (EUR)" : "Valor da época (EUR)"}</Label><input type="number" step="1" className="ft-input" value={seasonFee} onChange={(e) => setSeasonFee(e.target.value)} /></div>}
          {!isLeague && (<><Label>Preço por jogo ({model === "pergame" ? "todos" : "convidados"}) (EUR)</Label><input type="number" step="0.10" className="ft-input" value={guestFee} onChange={(e) => setGuestFee(e.target.value)} /></>)}
        </div>
      )}
      {amIAdmin && !isLeague && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 16px", alignItems: "center" }}><Clock size={17} style={{ color: "var(--blue)" }} /> Próximo jogo</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><Label>Data</Label><input type="date" className="ft-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Hora</Label><input type="time" className="ft-input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <Label>Periodicidade</Label>
          <select className="ft-input" value={freq} onChange={(e) => setFreq(e.target.value)}><option value="once">Apenas uma vez</option><option value="weekly">Semanalmente</option><option value="biweekly">Quinzenalmente</option></select>
        </div>
      )}
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 12px", alignItems: "center" }}><MapIcon size={17} style={{ color: "var(--grass-bright)" }} /> Localização do campo</h3>
          <input className="ft-input" value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} placeholder="Cola aqui o link do Google Maps..." />
          <p style={{ fontSize: 10, color: "var(--faint)", marginTop: 8 }}>A meteorologia é atualizada com base neste link.</p>
        </div>
      )}
      <div className="ft-card" style={{ padding: 16, background: "rgba(106,169,224,.06)", borderColor: "rgba(106,169,224,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isLeague ? <Trophy size={16} style={{ color: "var(--gold)" }} /> : settings.groupMode === "weekly" ? <CalendarCheck size={16} style={{ color: "var(--grass-bright)" }} /> : <Zap size={16} style={{ color: "var(--blue)" }} />}
          <div><div style={{ fontSize: 12, fontWeight: 700 }}>Tipo de grupo: {isLeague ? "Liga" : settings.groupMode === "weekly" ? "Semanal" : "Casual"}</div><div style={{ fontSize: 10, color: "var(--faint)" }}>O tipo de grupo e definido na criacao e nao pode ser alterado.</div></div>
        </div>
      </div>
      {amIAdmin && <button onClick={save} className="ft-btn" style={{ width: "100%", background: "var(--blue)", color: "#04101c", padding: 13 }}><Save size={18} /> Guardar definições</button>}
      <div style={{ border: "1px solid rgba(240,86,58,.3)", background: "rgba(240,86,58,.05)", borderRadius: 18, padding: 20, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ff9684", fontWeight: 800, marginBottom: 10 }}><ShieldAlert size={18} /> Zona de perigo</div>
        <p style={{ fontSize: 13, color: "#ffb3a5", margin: "0 0 14px" }}>{isOwner ? "Como dono, podes apagar este grupo permanentemente. Esta acao e irreversivel." : "Se saires do grupo, deixas de receber convocatorias. O historico e mantido."}</p>
        <button onClick={isOwner ? onDelete : onLeave} className="ft-btn ft-danger" style={{ width: "100%", padding: 13 }}>{isOwner ? <><Trash2 size={17} /> Apagar grupo</> : <><LogOut size={17} /> Sair do grupo</>}</button>
      </div>
    </div>
  );
};
