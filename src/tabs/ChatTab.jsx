import { useState, useEffect, useRef, Fragment } from "react";
import { Send, Bell, BellOff } from "lucide-react";
import { firstName, timeStr } from "../utils";
import { Avatar } from "../components/ui";

/* ------------------------------- Chat ------------------------------------ */
const dayKey = (ts) => new Date(ts).toDateString();
const dayLabel = (ts) => {
  const d = new Date(ts), today = new Date(), yesterday = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
};
export const ChatTab = ({ messages, me, muted, onToggleMute, onSend, onMarkRead }) => {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { onMarkRead?.(); }, []);
  const send = async () => { const t = text.trim(); if (!t) return; setText(""); if (!(await onSend(t))) setText(t); };
  return (
    <div className="ft-in chat-h" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px 0" }}>
        <button onClick={onToggleMute} className="ft-btn" aria-pressed={muted} style={{ fontSize: 12, padding: "5px 10px", background: "none", color: muted ? "var(--gold)" : "var(--faint)", border: "1px solid var(--line)" }}>
          {muted ? <><BellOff size={12} /> Notificações silenciadas</> : <><Bell size={12} /> Silenciar notificações</>}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && <p style={{ textAlign: "center", color: "var(--faint)", fontStyle: "italic", fontSize: 13, marginTop: 20 }}>Ainda sem mensagens. Diz olá!</p>}
        {messages.map((m, i) => {
          const mine = m.uid === me.uid;
          const prev = messages[i - 1], next = messages[i + 1];
          const newDay = !prev || dayKey(prev.ts) !== dayKey(m.ts);
          // mensagens seguidas da mesma pessoa (mesmo dia, ate 5 min) ficam agrupadas: nome no inicio, avatar no fim
          const joined = (a, b) => a && b && a.uid === b.uid && dayKey(a.ts) === dayKey(b.ts) && Math.abs(b.ts - a.ts) < 5 * 60e3;
          const first = !joined(prev, m), last = !joined(m, next);
          return (
            <Fragment key={m.id}>
              {newDay && <div className="eyebrow" style={{ textAlign: "center", margin: "6px 0" }}>{dayLabel(m.ts)}</div>}
            <div style={{ display: "flex", gap: 8, flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end", marginTop: first ? 0 : -8 }}>
              {!mine && (last ? <Avatar name={m.name} photo={m.photoUrl} size={30} /> : <div style={{ width: 30, flexShrink: 0 }} />)}
              <div style={{ maxWidth: "74%" }}>
                {!mine && first && <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 3, marginLeft: 4, fontWeight: 700 }}>{firstName(m.name)}</div>}
                <div style={{ padding: "9px 13px", borderRadius: 16, fontSize: 14, lineHeight: 1.35, background: mine ? "linear-gradient(135deg,var(--grass-2),var(--grass))" : "var(--raised)", color: mine ? "#04130a" : "var(--text)", border: mine ? "none" : "1px solid var(--line)", borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}>{m.text}</div>
                {last && <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, textAlign: mine ? "right" : "left", padding: "0 4px" }}>{m.ts ? timeStr(m.ts) : ""}</div>}
              </div>
            </div>
            </Fragment>
          );
        })}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8, background: "var(--panel)" }}>
        <input className="ft-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Escreve uma mensagem..." aria-label="Mensagem" />
        <button onClick={send} disabled={!text.trim()} aria-label="Enviar mensagem" className="ft-btn ft-grass" style={{ width: 46, padding: 0, borderRadius: 12 }}><Send size={18} /></button>
      </div>
    </div>
  );
};
