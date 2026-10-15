import { useState } from "react";
import { Loader2, Globe } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { SoccerBall } from "../components/icons";

/* ============================ AUTH SCREEN ================================ */
// Erros do Firebase Auth em portugues ("" = nao mostrar nada, ex: o utilizador fechou a janela do Google)
const AUTH_ERRORS = {
  "auth/invalid-credential": "Email ou palavra-passe incorretos.",
  "auth/wrong-password": "Email ou palavra-passe incorretos.",
  "auth/user-not-found": "Email ou palavra-passe incorretos.",
  "auth/invalid-email": "Esse email não é válido.",
  "auth/missing-email": "Escreve o teu email.",
  "auth/email-already-in-use": "Já existe uma conta com este email. Faz login.",
  "auth/weak-password": "A palavra-passe tem de ter pelo menos 6 caracteres.",
  "auth/too-many-requests": "Demasiadas tentativas. Espera um pouco e tenta de novo.",
  "auth/network-request-failed": "Sem ligação à internet.",
  "auth/popup-blocked": "O browser bloqueou a janela do Google. Permite pop-ups e tenta de novo.",
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
};
const authError = (err) => AUTH_ERRORS[err?.code] ?? "Não foi possível entrar. Tenta novamente.";

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [info, setInfo] = useState(""); const [loading, setLoading] = useState(false);
  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true); setError(""); setInfo("");
    try { if (isLogin) await signInWithEmailAndPassword(auth, email, password); else await createUserWithEmailAndPassword(auth, email, password); }
    catch (err) { setError(authError(err)); } finally { setLoading(false); }
  };
  const handleGoogle = async () => { setError(""); setInfo(""); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { setError(authError(err)); } };
  const handleReset = async () => {
    setError(""); setInfo("");
    if (!email.trim()) return setError("Escreve o teu email e carrega outra vez em \"Esqueci-me da palavra-passe\".");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // o Firebase nao diz se o email existe (protecao contra enumeracao), por isso a mensagem e neutra
      setInfo("Se existir uma conta com este email, enviámos um link para definires uma nova palavra-passe. Vê também o spam.");
    } catch (err) { setError(authError(err)); }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="ft-in" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {/* tres cromos em leque: a caderneta da malta */}
          <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            {[-10, 0, 10].map((r, i) => (
              <div key={r} className={`cromo${i === 1 ? " cromo-mvp" : ""}`} style={{ width: 62, margin: "0 -6px", transform: `rotate(${r}deg) translateY(${i === 1 ? -6 : 0}px)`, zIndex: i === 1 ? 2 : 1 }}>
                <div className="cromo-face"><SoccerBall size={26} color="var(--chalk)" /></div>
                <div className="cromo-name">{["Pelada", "Craque", "Malta"][i]}</div>
              </div>
            ))}
          </div>
          <h1 className="num" style={{ fontSize: 44, lineHeight: 1, color: "var(--chalk)", textTransform: "uppercase" }}>Futeboladas</h1>
          <p style={{ marginTop: 4, fontSize: 15, color: "var(--dim)" }}>Gestor de peladas</p>
        </div>
        <div className="ft-card" style={{ padding: 24 }}>
          <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 700, margin: "0 0 18px" }}>{isLogin ? "Entrar em campo" : "Criar conta"}</h2>
          {error && <div role="alert" style={{ background: "rgba(240,86,58,.1)", border: "1px solid rgba(240,86,58,.25)", color: "var(--danger-ink)", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{error}</div>}
          {info && <div role="status" style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", color: "var(--grass-bright)", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14 }}>{info}</div>}
          <button onClick={handleGoogle} className="ft-btn" style={{ width: "100%", background: "#fff", color: "#0b0b0b", padding: 12, marginBottom: 14 }}><Globe size={18} /> Continuar com Google</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}><div style={{ flex: 1, height: 1, background: "var(--line)" }} /><span className="eyebrow">ou email</span><div style={{ flex: 1, height: 1, background: "var(--line)" }} /></div>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="ft-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" inputMode="email" required />
            <input className="ft-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Palavra-passe" aria-label="Palavra-passe" autoComplete={isLogin ? "current-password" : "new-password"} minLength={isLogin ? undefined : 6} required />
            <button type="submit" disabled={loading} aria-busy={loading} className="ft-btn ft-grass" style={{ padding: 13, marginTop: 4 }}>{loading ? <Loader2 size={18} aria-label="A entrar" style={{ animation: "ftspin 1s linear infinite" }} /> : (isLogin ? "Entrar" : "Registar")}</button>
          </form>
          {isLogin && <button type="button" onClick={handleReset} className="ft-link" style={{ color: "var(--dim)", fontSize: 12, marginTop: 6, width: "100%" }}>Esqueci-me da palavra-passe</button>}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); setInfo(""); }} className="ft-link" style={{ color: "var(--grass-bright)", fontSize: 13, marginTop: 10, width: "100%" }}>{isLogin ? "Ainda não tens conta? Cria grátis" : "Já tens conta? Faz login"}</button>
        </div>
      </div>
    </div>
  );
};
