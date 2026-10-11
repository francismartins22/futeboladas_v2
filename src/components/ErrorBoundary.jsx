import React from "react";
import { RotateCcw, Activity } from "lucide-react";
import { STYLES } from "../styles";

/* --------------------------- ErrorBoundary ------------------------------- */
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { const msg = error?.message?.toLowerCase() || ""; if (msg.includes("loading chunk") || msg.includes("importing a module")) window.location.reload(); }
  handleReset = () => { if ("caches" in window) caches.keys().then((names) => names.forEach((n) => caches.delete(n))); window.location.reload(); };
  render() {
    if (this.state.hasError) {
      return (
        <div className="ft" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <style>{STYLES}</style>
          <div className="ft-card" style={{ padding: 28, maxWidth: 360, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, margin: "0 auto 14px", borderRadius: "50%", background: "rgba(240,86,58,.12)", border: "1px solid rgba(240,86,58,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={28} style={{ color: "#ff9684" }} /></div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Jogo interrompido</h1>
            <p style={{ fontSize: 12, color: "var(--dim)", margin: "0 0 18px" }}>Atualização detetada ou erro de rede.</p>
            <button onClick={this.handleReset} className="ft-btn ft-grass" style={{ width: "100%", padding: 13 }}><RotateCcw size={18} /> Recarregar app</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
