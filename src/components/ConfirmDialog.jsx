import { useState, useEffect, useRef } from "react";
import { setConfirmHandler } from "../confirm";

// Dialogo de confirmacao (ver src/confirm.js). requireText: o utilizador tem de escrever esse texto para confirmar.
export const ConfirmDialogHost = () => {
  const [dialog, setDialog] = useState(null);
  const [typed, setTyped] = useState("");
  const focusRef = useRef(null);

  useEffect(() => {
    setConfirmHandler((d) => { setTyped(""); setDialog(d); });
    return () => setConfirmHandler(null);
  }, []);
  useEffect(() => { focusRef.current?.focus(); }, [dialog]);
  if (!dialog) return null;

  const close = (ok) => { dialog.resolve(ok); setDialog(null); };
  const blocked = !!dialog.requireText && typed.trim().toUpperCase() !== dialog.requireText;
  return (
    <div onClick={() => close(false)} onKeyDown={(e) => { if (e.key === "Escape") close(false); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16 }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="cd-title" onClick={(e) => e.stopPropagation()} className="ft-card ft-pop"
        style={{ width: "100%", maxWidth: 420, padding: 20, marginBottom: "env(safe-area-inset-bottom)" }}>
        <h2 id="cd-title" style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{dialog.title}</h2>
        {dialog.message && <p style={{ fontSize: 14, color: "var(--dim)", margin: "0 0 16px", lineHeight: 1.45 }}>{dialog.message}</p>}
        {dialog.requireText && (
          <input ref={focusRef} className="ft-input" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={`Escreve ${dialog.requireText} para confirmar`}
            placeholder={`Escreve ${dialog.requireText}`} style={{ marginBottom: 16 }} onKeyDown={(e) => { if (e.key === "Enter" && !blocked) close(true); }} />
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => close(false)} className="ft-btn ft-ghost" style={{ flex: 1, padding: 13 }}>Cancelar</button>
          <button ref={dialog.requireText ? null : focusRef} onClick={() => close(true)} disabled={blocked}
            className={`ft-btn ${dialog.danger ? "ft-danger" : "ft-grass"}`} style={{ flex: 1, padding: 13 }}>{dialog.confirmLabel || "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
};
