import { useState } from "react";
import { MapPin, Check, X } from "lucide-react";
import { firstName } from "../utils";
import { MapPreview } from "../components/MapPreview";
import { Cromo, CromoFalta } from "../components/ui";
import { WeatherWidget } from "../components/WeatherWidget";
import { rsvpLists } from "../rsvp";

/* ----------------------------- Agenda ------------------------------------ */
export const ScheduleTab = ({ next, players, me, locationUrl, maxPlayers, onToggle }) => {
  const date = next?.date ? new Date(next.date) : null;
  const myResp = next?.responses?.[me.uid];
  const { confirmed, waiting } = rsvpLists(next, maxPlayers);
  const myWaitPos = waiting.indexOf(me.uid) + 1; // 0 = nao estou em espera
  const full = maxPlayers > 0 && confirmed.length >= maxPlayers;
  const byUid = (uid) => players.find((pl) => pl.uid === uid);
  // so os cromos que entram depois de abrir o ecra se "colam" com animacao
  const [initial] = useState(() => new Set(confirmed));
  const diffMs = date ? date - new Date() : 0;
  const days = Math.floor(diffMs / 864e5), hrs = Math.floor((diffMs % 864e5) / 36e5), mins = Math.floor((diffMs % 36e5) / 6e4);
  const countdown = days > 0 ? `faltam ${days}d ${hrs}h` : hrs > 0 ? `hoje · faltam ${hrs}h` : `hoje · faltam ${mins} min`;
  const weekday = date?.toLocaleDateString("pt-PT", { weekday: "long" }).replace("-feira", "");
  const slots = Math.max(0, maxPlayers - confirmed.length);
  return (
    // minHeight = ecra menos cabecalho, margens e barra de baixo: a barra de resposta assenta em cima da navegacao
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "calc(100dvh - 190px)" }}>
      {date && (
        <section className="ft-card" style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="num" style={{ fontSize: 34, lineHeight: 1.05, margin: 0, color: "var(--chalk)", textTransform: "uppercase" }}>
              <span className="sr-only">Próxima pelada: </span>{weekday} · {date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            </h2>
            <p style={{ fontSize: 14, color: "var(--dim)", marginTop: 2 }}>{date.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}</p>
            {locationUrl && <a href={locationUrl} target="_blank" rel="noopener noreferrer" className="ft-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--grass-bright)", fontSize: 14, fontWeight: 600, margin: "2px -8px -8px" }}><MapPin size={15} aria-hidden="true" /> Ver campo no mapa</a>}
          </div>
          {diffMs > 0 && <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: "var(--bg)", background: "var(--lime)", padding: "4px 10px", borderRadius: 999 }}>{countdown}</span>}
        </section>
      )}

      {!date ? (
        <div style={{ textAlign: "center", padding: "28px 20px", border: "1.5px dashed var(--line)", borderRadius: 16, color: "var(--dim)", fontSize: 14 }}>
          Ainda não há pelada marcada.<br /><span style={{ fontSize: 13, color: "var(--faint)" }}>O admin marca a data em Mais → Definições.</span>
        </div>
      ) : (<>
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Convocados</h3>
            <span style={{ fontSize: 14, color: "var(--dim)", fontWeight: 600 }}>{confirmed.length}{maxPlayers > 0 ? ` de ${maxPlayers}` : ""}{full ? " · completo" : ""}</span>
          </div>
          {confirmed.length === 0 && slots === 0
            ? <p style={{ fontSize: 14, color: "var(--faint)" }}>Ainda ninguém confirmou. Sê o primeiro.</p>
            : <div className="cromo-grid">
                {confirmed.map((uid) => { const p = byUid(uid); return p ? <Cromo key={uid} name={p.name} photo={p.photoUrl} stick={!initial.has(uid)} /> : null; })}
                {Array.from({ length: slots }, (_, i) => <CromoFalta key={`f${i}`} />)}
              </div>}
          {waiting.length > 0 && (
            <p style={{ fontSize: 14, color: "var(--dim)", marginTop: 12 }}>
              <b style={{ color: "var(--text)" }}>Lista de espera:</b> {waiting.map((uid, i) => `${i + 1}. ${firstName(byUid(uid)?.name || "?")}`).join(", ")}
            </p>
          )}
          {myWaitPos > 0 && <p role="status" style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: "var(--lime)" }}>Estás em {myWaitPos}.º na lista de espera. Avisamos-te se abrir uma vaga.</p>}
        </section>

        {date && <WeatherWidget date={next.date} locationUrl={locationUrl} />}
        {locationUrl && <MapPreview locationUrl={locationUrl} />}

        {/* Resposta sempre a mao: cola por cima da barra de baixo quando a pagina e comprida */}
        <div style={{ position: "sticky", marginTop: "auto", bottom: "calc(84px + env(safe-area-inset-bottom))", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, paddingTop: 8, background: "linear-gradient(to bottom, transparent, var(--bg) 30%)" }}>
          <button onClick={() => onToggle("going")} aria-pressed={myResp === "going"} className={`ft-btn ${myResp === "not_going" ? "ft-ghost" : "ft-grass"}`} style={{ height: 52, fontSize: 16 }}>
            {myResp === "going" && <Check size={18} aria-hidden="true" />}{myResp === "going" ? (myWaitPos ? "Em espera" : "Vais jogar") : full ? "Entrar na lista de espera" : "Vou jogar"}
          </button>
          <button onClick={() => onToggle("not_going")} aria-pressed={myResp === "not_going"} className="ft-btn ft-ghost" style={{ height: 52, fontSize: 16, ...(myResp === "not_going" ? { background: "var(--danger)", borderColor: "var(--danger)", color: "#fff" } : {}) }}>
            {myResp === "not_going" && <X size={18} aria-hidden="true" />}Não vou
          </button>
        </div>
      </>)}
    </div>
  );
};
