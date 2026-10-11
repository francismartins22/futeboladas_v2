import { Clock, MapPin } from "lucide-react";
import { firstName } from "../utils";
import { MapPreview } from "../components/MapPreview";
import { Avatar } from "../components/ui";
import { PitchLines } from "../components/icons";
import { WeatherWidget } from "../components/WeatherWidget";
import { rsvpLists } from "../rsvp";

/* ----------------------------- Agenda ------------------------------------ */
export const ScheduleTab = ({ next, players, me, locationUrl, maxPlayers, onToggle }) => {
  const date = next?.date ? new Date(next.date) : null;
  const myResp = next?.responses?.[me.uid];
  const { confirmed, waiting } = rsvpLists(next, maxPlayers);
  const myWaitPos = waiting.indexOf(me.uid) + 1; // 0 = nao estou em espera
  const full = maxPlayers > 0 && confirmed.length >= maxPlayers;
  const Chip = (uid, pos) => { const p = players.find((pl) => pl.uid === uid); return p ? (<div key={uid} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px 5px 5px" }}><Avatar name={p.name} photo={p.photoUrl} size={24} /><span style={{ fontSize: 12, fontWeight: 600 }}>{pos ? `${pos}. ` : ""}{firstName(p.name)}</span></div>) : null; };
  const diffMs = date ? date - new Date() : 0;
  const days = Math.floor(diffMs / 864e5), hrs = Math.floor((diffMs % 864e5) / 36e5);
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pitch" style={{ padding: 22 }}>
        <PitchLines /><div className="stripe" />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Próxima peladinha</span>
            {diffMs > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--lime)", border: "1px solid rgba(198,242,74,.3)", background: "rgba(198,242,74,.08)", padding: "4px 10px", borderRadius: 999 }}>{days > 0 ? `faltam ${days}d ${hrs}h` : `hoje · ${Math.max(0, hrs)}h`}</span>}
          </div>
          <div className="num" style={{ fontSize: 40, lineHeight: .95, color: "var(--chalk)", marginTop: 10, textTransform: "capitalize" }}>{date ? date.toLocaleDateString("pt-PT", { weekday: "long" }) : "A definir"}</div>
          {date && <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}><span className="num" style={{ fontSize: 22, color: "var(--text)" }}>{date.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 700, color: "var(--grass-bright)" }}><Clock size={14} /> {date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span></div>}
        </div>
      </div>
      {date && <WeatherWidget date={next.date} locationUrl={locationUrl} />}
      {locationUrl && <MapPreview locationUrl={locationUrl} />}
      {locationUrl && <button onClick={() => window.open(locationUrl, "_blank")} className="ft-card ft-btn" style={{ padding: 14, justifyContent: "center", gap: 8, color: "var(--grass-bright)", fontWeight: 700 }}><MapPin size={16} style={{ color: "var(--danger)" }} /> Ver campo no mapa</button>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => onToggle("going")} className="ft-btn" style={{ padding: 18, flexDirection: "column", gap: 4, border: "1px solid", borderColor: myResp === "going" ? "var(--grass-bright)" : "var(--line)", background: myResp === "going" ? "linear-gradient(135deg,var(--grass-2),var(--grass))" : "var(--raised)", color: myResp === "going" ? "#04130a" : "var(--text)" }}><span style={{ fontSize: 22 }}>{"\u{1F44D}"}</span><span style={{ fontWeight: 800 }}>{full && myResp !== "going" ? "Lista de espera" : "Vou jogar"}</span></button>
        <button onClick={() => onToggle("not_going")} className="ft-btn" style={{ padding: 18, flexDirection: "column", gap: 4, border: "1px solid", borderColor: myResp === "not_going" ? "var(--danger)" : "var(--line)", background: myResp === "not_going" ? "rgba(240,86,58,.85)" : "var(--raised)", color: myResp === "not_going" ? "#fff" : "var(--text)" }}><span style={{ fontSize: 22 }}>{"\u{1F6AB}"}</span><span style={{ fontWeight: 800 }}>Não vou</span></button>
      </div>
      {myWaitPos > 0 && <div role="status" style={{ background: "rgba(245,197,66,.1)", border: "1px solid rgba(245,197,66,.3)", color: "var(--gold)", padding: 12, borderRadius: 14, fontSize: 13, fontWeight: 700, textAlign: "center" }}>Estás em {myWaitPos}.º na lista de espera. Avisamos-te se abrir uma vaga.</div>}
      <div className="ft-card" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Convocados - {confirmed.length}{maxPlayers > 0 ? `/${maxPlayers}` : ""}{full ? " · completo" : ""}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {confirmed.map((uid) => Chip(uid))}
          {confirmed.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Ainda ninguém confirmou.</span>}
        </div>
      </div>
      {waiting.length > 0 && (
        <div className="ft-card" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12, color: "var(--gold)" }}>Lista de espera - {waiting.length}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{waiting.map((uid, i) => Chip(uid, i + 1))}</div>
        </div>
      )}
    </div>
  );
};
