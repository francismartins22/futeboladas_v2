import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { firstName, timeStr } from "../utils";
import { Avatar } from "../components/ui";

/* ------------------------------- Chat ------------------------------------ */
export const ChatTab = ({ messages, me, onSend, onMarkRead }) => {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { onMarkRead?.(); }, []);
  const send = async () => { const t = text.trim(); if (!t) return; setText(""); if (!(await onSend(t))) setText(t); };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 158px)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && <p style={{ textAlign: "center", color: "var(--faint)", fontStyle: "italic", fontSize: 13, marginTop: 20 }}>Ainda sem mensagens. Diz olá!</p>}
        {messages.map((m) => {
          const mine = m.uid === me.uid;
          return (
            <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end" }}>
              {!mine && <Avatar name={m.name} photo={m.photoUrl} size={30} />}
              <div style={{ maxWidth: "74%" }}>
                {!mine && <div style={{ fontSize: 10, color: "var(--faint)", marginBottom: 3, marginLeft: 4, fontWeight: 700 }}>{firstName(m.name)}</div>}
                <div style={{ padding: "9px 13px", borderRadius: 16, fontSize: 14, lineHeight: 1.35, background: mine ? "linear-gradient(135deg,var(--grass-2),var(--grass))" : "var(--raised)", color: mine ? "#04130a" : "var(--text)", border: mine ? "none" : "1px solid var(--line)", borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}>{m.text}</div>
                <div style={{ fontSize: 9, color: "var(--faint)", marginTop: 3, textAlign: mine ? "right" : "left", padding: "0 4px" }}>{m.ts ? timeStr(m.ts) : ""}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8, background: "var(--panel)" }}>
        <input className="ft-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Escreve uma mensagem..." />
        <button onClick={send} disabled={!text.trim()} className="ft-btn ft-grass" style={{ width: 46, padding: 0, borderRadius: 12 }}><Send size={18} /></button>
      </div>
    </div>
  );
};
