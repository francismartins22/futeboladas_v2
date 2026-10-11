import { useState } from "react";
import { Loader2, Globe } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { SoccerBall, PitchLines } from "../components/icons";

/* ============================ AUTH SCREEN ================================ */
export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { if (isLogin) await signInWithEmailAndPassword(auth, email, password); else await createUserWithEmailAndPassword(auth, email, password); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleGoogle = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch { setError("Erro Google (popup bloqueado?)"); } };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="ft-in" style={{ width: "100%", maxWidth: 400 }}>
        <div className="pitch" style={{ padding: "34px 24px 26px", textAlign: "center", marginBottom: 22 }}>
          <PitchLines /><div className="stripe" />
          <div style={{ position: "relative" }}>
            <div style={{ width: 76, height: 76, margin: "0 auto 16px", borderRadius: 22, transform: "rotate(-6deg)", background: "linear-gradient(135deg,var(--grass-2),#0c7a3a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px -12px rgba(34,197,94,.7)", border: "2px solid rgba(255,255,255,.15)" }}><SoccerBall size={42} color="#fff" /></div>
            <h1 className="num" style={{ fontSize: 46, lineHeight: .9, margin: 0, color: "var(--chalk)" }}>FUTEBOLADAS</h1>
            <div style={{ height: 3, width: 64, margin: "10px auto 0", background: "var(--lime)", borderRadius: 2 }} />
            <p className="eyebrow" style={{ marginTop: 12, color: "var(--grass-bright)" }}>Gestor de peladas · V3</p>
          </div>
        </div>
        <div className="ft-card" style={{ padding: 24 }}>
          <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: "0 0 18px" }}>{isLogin ? "Entrar em campo" : "Criar conta"}</h2>
          {error && <div style={{ background: "rgba(240,86,58,.1)", border: "1px solid rgba(240,86,58,.25)", color: "#ff9684", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{error}</div>}
          <button onClick={handleGoogle} className="ft-btn" style={{ width: "100%", background: "#fff", color: "#0b0b0b", padding: 12, marginBottom: 14 }}><Globe size={18} /> Continuar com Google</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}><div style={{ flex: 1, height: 1, background: "var(--line)" }} /><span className="eyebrow">ou email</span><div style={{ flex: 1, height: 1, background: "var(--line)" }} /></div>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="ft-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input className="ft-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Palavra-passe" required />
            <button type="submit" disabled={loading} className="ft-btn ft-grass" style={{ padding: 13, marginTop: 4 }}>{loading ? <Loader2 size={18} style={{ animation: "ftspin 1s linear infinite" }} /> : (isLogin ? "Entrar" : "Registar")}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grass-bright)", fontSize: 13, marginTop: 18, width: "100%" }}>{isLogin ? "Ainda não tens conta? Cria grátis" : "Já tens conta? Faz login"}</button>
        </div>
      </div>
    </div>
  );
};
