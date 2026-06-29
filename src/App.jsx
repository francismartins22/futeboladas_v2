import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, CalendarCheck, Shield, History as HistoryIcon, UserPlus, Plus, Trash2,
  Shuffle, Check, ArrowLeft, ArrowRight, LogOut, LayoutGrid, Loader2, Globe,
  User, Camera, Save, Crown, ShieldAlert, Settings, Copy, Star, Trophy,
  AlertCircle, Clock, Map as MapIcon, MapPin, Wallet, ClipboardList,
  CheckCircle, Award, Flame, Medal, Share2, ShieldCheck, Wind, Droplets,
  CloudSun, Sun, CloudRain, Cloud, CloudFog, CloudLightning, Snowflake,
  MessageSquare, Send, Minus, RotateCcw, Pencil, X, Activity, PlusCircle,
  ListOrdered, Swords, ChevronDown, ChevronUp, Dumbbell, Zap,
} from "lucide-react";

import { initializeApp } from "firebase/app";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile,
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, doc, updateDoc, onSnapshot, deleteDoc,
  serverTimestamp, query, orderBy, setDoc, getDoc, where, arrayUnion, getDocs, arrayRemove, writeBatch,
} from "firebase/firestore";

/* =========================================================================
   FUTEBOLADAS V3 - app completa (Firebase) com revamp visual + novas funcoes:
   chat de grupo, quadro tatico (5/7/11 + banco de suplentes + add/remove),
   modelos de pagamento (jogo-a-jogo / mensal / época) e golos & assistencias.
   RESET DA BASE DE DADOS: APP_ID mudou para "futeboladas-v3", por isso a app
   arranca com um espaco de dados novo e limpo (os dados antigos em
   "futeboladas-v2" deixam de ser referenciados).
   ========================================================================= */

const APP_VERSION = "3.0.0";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = event?.message?.toLowerCase() || "";
    if (msg.includes("loading chunk") || msg.includes("unexpected token") || msg.includes("importing a module") || msg.includes("failed to load resource")) {
      const last = sessionStorage.getItem("app_last_rescue");
      if (!last || Date.now() - parseInt(last) > 10000) {
        sessionStorage.setItem("app_last_rescue", Date.now().toString());
        if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
        window.location.reload();
      }
    }
  }, true);
  try {
    const stored = localStorage.getItem("app_version");
    if (stored !== APP_VERSION) {
      if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      if ("caches" in window) caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
      localStorage.setItem("app_version", APP_VERSION);
    }
  } catch (e) { /* noop */ }
}

const firebaseConfig = {
  apiKey: "AIzaSyCgfsrpIIj0XWp7Uc2FNGgKIibtWriHR_c",
  authDomain: "futeboladas-v2-dev.firebaseapp.com",
  projectId: "futeboladas-v2-dev",
  storageBucket: "futeboladas-v2-dev.firebasestorage.app",
  messagingSenderId: "899361657772",
  appId: "1:899361657772:web:cdd265c50fc9574119e009",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = "futeboladas-v3"; // <-- reset: novo namespace de dados (clean)

/* ----------------------------- Design tokens ---------------------------- */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');

.ft {
  --bg:#0a0f0e; --panel:#0d1411; --card:#111b16; --raised:#16221c;
  --line:#22312b; --line-soft:rgba(255,255,255,.06);
  --text:#e9f0eb; --dim:#90a69b; --faint:#637a71;
  --grass:#16a34a; --grass-2:#22c55e; --grass-bright:#4ade80;
  --lime:#c6f24a; --gold:#f5c542; --chalk:#f5f8f6; --ink:#080b0a;
  --danger:#f0563a; --blue:#6aa9e0;
  font-family:'Inter',system-ui,sans-serif; color:var(--text);
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(34,197,94,.10), transparent 60%),
    radial-gradient(900px 500px at 90% 110%, rgba(34,197,94,.05), transparent 55%),
    var(--bg);
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.ft *{box-sizing:border-box;}
.ft ::-webkit-scrollbar{display:none;}
.ft .num{font-family:'Anton',Impact,sans-serif;letter-spacing:.5px;font-weight:400;}
.ft .eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);font-weight:700;}
.ft-card{background:var(--card);border:1px solid var(--line);border-radius:20px;}
.ft-raised{background:var(--raised);border:1px solid var(--line);}
.ft-btn{border:none;cursor:pointer;font-family:inherit;border-radius:14px;font-weight:700;
  transition:transform .12s ease,background .15s ease,opacity .15s;display:inline-flex;align-items:center;justify-content:center;gap:8px;}
.ft-btn:active{transform:scale(.96);}
.ft-btn:disabled{opacity:.45;cursor:not-allowed;}
.ft-grass{background:linear-gradient(135deg,var(--grass-2),var(--grass));color:#04130a;box-shadow:0 8px 24px -10px rgba(34,197,94,.6);}
.ft-grass:hover{background:linear-gradient(135deg,var(--grass-bright),var(--grass-2));}
.ft-ghost{background:var(--raised);color:var(--text);border:1px solid var(--line);}
.ft-ghost:hover{border-color:#33473f;}
.ft-danger{background:rgba(240,86,58,.12);color:#ff9684;border:1px solid rgba(240,86,58,.3);}
.ft-danger:hover{background:rgba(240,86,58,.2);}
.ft-input{width:100%;background:#0a120f;border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border-color .15s;}
.ft-input::placeholder{color:#46584f;}
.ft-input:focus{border-color:var(--grass);}
.pitch{position:relative;overflow:hidden;border-radius:22px;border:1px solid var(--line);
  background:radial-gradient(120% 80% at 50% -20%, rgba(34,197,94,.22), transparent 60%),linear-gradient(180deg,#0f2017,#0a1611);}
.pitch .lines{position:absolute;inset:0;opacity:.5;pointer-events:none;}
.pitch .stripe{position:absolute;inset:0;background:repeating-linear-gradient(90deg, rgba(255,255,255,.018) 0 38px, transparent 38px 76px);pointer-events:none;}
.bib{width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;}
.bib-white{background:var(--chalk);color:#0b0b0b;}
.bib-black{background:#0c0f0e;color:#cfe8da;border:1px solid #2a3a33;}
.tab-ico{transition:transform .15s ease;}
.navbtn[data-active="true"] .tab-ico{transform:translateY(-2px) scale(1.08);}
@keyframes ftin{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.ft-in{animation:ftin .35s cubic-bezier(.2,.7,.3,1) both;}
@keyframes ftpop{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:scale(1);}}
.ft-pop{animation:ftpop .25s ease both;}
@keyframes ftspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.ft-in,.ft-pop{animation:none;}}
`;

/* ------------------------------ Helpers ---------------------------------- */
const firstName = (n) => (n || "").replace(/\s*\(.*$/, "").split(" ")[0];
const avatarHue = (name) => { let h = 0; for (const c of name || "") h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const initials = (n) => (n || "?").replace(/\(.*$/, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const timeStr = (ts) => new Date(ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
const rnd = () => Math.random().toString(36).slice(2, 7);

const getCoordsFromUrl = (url) => {
  if (!url) return null;
  try {
    let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/); if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/); if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/); if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    return null;
  } catch { return null; }
};

const Avatar = ({ name, photo, size = 36, ring }) => {
  const hue = avatarHue(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.36, color: "#04130a",
      background: photo ? "none" : `linear-gradient(135deg,hsl(${hue} 55% 55%),hsl(${(hue + 40) % 360} 55% 42%))`,
      border: ring ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,.12)",
    }}>
      {photo ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
    </div>
  );
};

const SoccerBall = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 17l-4.2-2.5 1.6-5.1h5.2l1.6 5.1z" />
    <path d="M12 17v5" /><path d="M7.8 14.5l-4 2.8" /><path d="M16.2 14.5l4 2.8" /><path d="M9.4 9.4l-4.2-2.6" /><path d="M14.6 9.4l4.2-2.6" />
  </svg>
);

const TacticIcon = ({ size = 22, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const PitchLines = () => (
  <svg className="lines" viewBox="0 0 320 180" preserveAspectRatio="none">
    <g fill="none" stroke="rgba(245,248,246,.28)" strokeWidth="1.2">
      <line x1="160" y1="0" x2="160" y2="180" /><circle cx="160" cy="90" r="34" />
      <circle cx="160" cy="90" r="2.5" fill="rgba(245,248,246,.5)" stroke="none" />
      <rect x="0" y="55" width="42" height="70" /><rect x="278" y="55" width="42" height="70" />
    </g>
  </svg>
);

const StarRating = ({ value, onChange, readOnly, size = 16 }) => (
  <div style={{ display: "inline-flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} onClick={(e) => { e.stopPropagation(); if (!readOnly) onChange(s); }} disabled={readOnly} className="ft-btn" style={{ background: "none", padding: 0, borderRadius: 4 }}>
        <Star size={size} style={{ fill: s <= value ? "var(--gold)" : "none", color: s <= value ? "var(--gold)" : "#3a4a43" }} />
      </button>
    ))}
  </div>
);

const Stepper = ({ val, onDec, onInc, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <button onClick={onDec} className="ft-btn ft-ghost" style={{ width: 26, height: 26, borderRadius: 8, padding: 0 }}><Minus size={12} /></button>
    <span className="num" style={{ minWidth: 18, textAlign: "center", fontSize: 16, color: color || "var(--text)" }}>{val}</span>
    <button onClick={onInc} className="ft-btn ft-ghost" style={{ width: 26, height: 26, borderRadius: 8, padding: 0 }}><Plus size={12} /></button>
  </div>
);

/* ---------------------------- WeatherWidget ------------------------------ */
const WeatherWidget = ({ date, locationUrl }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const info = (code) => {
    if (code === 0) return { Icon: Sun, label: "Céu limpo", color: "var(--gold)" };
    if ([1, 2, 3].includes(code)) return { Icon: CloudSun, label: "Pouco nublado", color: "var(--blue)" };
    if ([45, 48].includes(code)) return { Icon: CloudFog, label: "Nevoeiro", color: "var(--dim)" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { Icon: CloudRain, label: "Chuva", color: "var(--blue)" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: Snowflake, label: "Neve", color: "var(--chalk)" };
    if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, label: "Trovoada", color: "#b48cf0" };
    return { Icon: Cloud, label: "Nublado", color: "var(--dim)" };
  };
  useEffect(() => {
    if (!date || !locationUrl) return;
    const coords = getCoordsFromUrl(locationUrl);
    if (!coords) { setError("Localização inválida no mapa"); return; }
    const run = async () => {
      setLoading(true); setError("");
      try {
        const game = new Date(date); const diff = Math.ceil((game - new Date()) / 864e5);
        if (diff > 14) { setError("Previsão disponível 14 dias antes"); setLoading(false); return; }
        if (diff < 0) { setError("Dados históricos não disponíveis"); setLoading(false); return; }
        const dateStr = new Date(date).toISOString().split("T")[0];
        const hour = new Date(date).getHours();
        // FIX: timezone=auto alinha a hora local com o indice horario do array
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
        const res = await fetch(url); const data = await res.json();
        const h = data?.hourly;
        if (h && Array.isArray(h.temperature_2m) && h.temperature_2m.length > hour) {
          setWeather({
            temp: Math.round(h.temperature_2m[hour]),
            precip: h.precipitation_probability?.[hour] ?? 0,
            code: h.weathercode?.[hour] ?? 3,
            wind: Math.round(h.windspeed_10m?.[hour] ?? 0),
          });
        } else { setError("Sem dados para esta hora"); }
      } catch { setError("Erro ao carregar meteorologia"); }
      finally { setLoading(false); }
    };
    run();
  }, [date, locationUrl]);
  if (!locationUrl) return null;
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, fontSize: 12, color: "var(--dim)" }}><Loader2 size={14} style={{ animation: "ftspin 1s linear infinite" }} /> A consultar o tempo...</div>;
  if (error) return <div style={{ padding: 10, textAlign: "center", fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>{error}</div>;
  if (!weather) return null;
  const { Icon, label, color } = info(weather.code);
  return (
    <div className="ft-raised" style={{ borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={24} style={{ color }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--dim)", display: "flex", gap: 10, marginTop: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Wind size={11} /> {weather.wind} km/h</span>
            {weather.precip > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--blue)" }}><Droplets size={11} /> {weather.precip}%</span>}
          </div>
        </div>
      </div>
      <div className="num" style={{ fontSize: 30, lineHeight: 1, display: "flex", alignItems: "flex-start" }}>{weather.temp}<span style={{ fontSize: 13, color: "var(--faint)", marginTop: 4 }}>C</span></div>
    </div>
  );
};

/* ------------------------------ Toast / Nav ------------------------------ */
const Toast = ({ toast }) => !toast.show ? null : (
  <div className="ft-pop" style={{
    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 80, padding: "12px 18px", borderRadius: 14,
    fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px -8px rgba(0,0,0,.6)",
    background: toast.type === "error" ? "var(--danger)" : "linear-gradient(135deg,var(--grass-bright),var(--grass-2))",
    color: toast.type === "error" ? "#fff" : "#04130a",
  }}>{toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}{toast.msg}</div>
);
const NavButton = ({ active, onClick, icon: Icon, label, badge }) => (
  <button onClick={onClick} data-active={active} className="navbtn ft-btn" style={{ background: "none", flexDirection: "column", minWidth: 58, padding: "6px 4px", borderRadius: 14, color: active ? "var(--grass-bright)" : "var(--faint)", position: "relative" }}>
    <div style={{ position: "relative" }}>
      <Icon size={22} className="tab-ico" strokeWidth={active ? 2.5 : 2} />
      {badge > 0 && (
        <div style={{ position: "absolute", top: -5, right: -7, minWidth: 16, height: 16, borderRadius: 999, background: "var(--danger)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "1.5px solid var(--bg)", lineHeight: 1 }}>
          {badge > 99 ? "99+" : badge}
        </div>
      )}
    </div>
    <span style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{label}</span>
  </button>
);
const BottomNav = ({ items }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,15,14,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
    <div style={{ display: "flex", overflowX: "auto", justifyContent: "flex-start", gap: 2, padding: "8px 10px", maxWidth: 760, margin: "0 auto" }}>
      {items.map((it) => <NavButton key={it.id} active={it.active} onClick={it.onClick} icon={it.icon} label={it.label} badge={it.badge} />)}
    </div>
  </div>
);

/* --------------------------- ErrorBoundary ------------------------------- */
class ErrorBoundary extends React.Component {
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

/* ============================ AUTH SCREEN ================================ */
const AuthScreen = () => {
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

/* ============================== PROFILE ================================== */
const UserProfile = ({ user, onLogout }) => {
  const [name, setName] = useState(user.displayName || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState({ games: 0, wins: 0, mvps: 0, goals: 0, assists: 0 });
  const fileRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, "artifacts", APP_ID, "users", user.uid));
        if (snap.exists()) { const d = snap.data(); if (d.name) setName(d.name); if (d.photoUrl) setPhotoUrl(d.photoUrl); }
        const gq = query(collection(db, "artifacts", APP_ID, "groups"), where("members", "array-contains", user.uid));
        const gs = await getDocs(gq);
        let games = 0, wins = 0, mvps = 0, goals = 0, assists = 0;
        for (const gdoc of gs.docs) {
          const gref = gdoc.ref;
          const pq = query(collection(gref, "players"), where("uid", "==", user.uid));
          const ps = await getDocs(pq);
          let myId = null;
          ps.forEach((p) => { const d = p.data(); if (d.stats) { games += d.stats.games || 0; wins += d.stats.wins || 0; } myId = p.id; });
          if (myId) {
            const ms = await getDocs(collection(gref, "matches"));
            ms.forEach((m) => {
              const d = m.data();
              if (d.goals?.[myId]) { goals += d.goals[myId].g || 0; assists += d.goals[myId].a || 0; }
              if (d.mvpVotes) { const c = {}; Object.values(d.mvpVotes).forEach((pid) => (c[pid] = (c[pid] || 0) + 1)); let mx = 0, win = null; Object.entries(c).forEach(([pid, n]) => { if (n > mx) { mx = n; win = pid; } }); if (win === myId) mvps++; }
            });
          }
        }
        setStats({ games, wins, mvps, goals, assists });
      } catch (e) { console.error(e); } finally { setLoadingData(false); }
    };
    run();
  }, [user.uid]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMsg("Imagem muito grande (max 5MB)");
    setUploading(true);
    const reader = new FileReader();
    reader.onerror = () => { setUploading(false); setMsg("Erro ao ler a imagem."); };
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => { setUploading(false); setMsg("Imagem inválida."); };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 512; let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        setPhotoUrl(canvas.toDataURL("image/jpeg", 0.8)); setUploading(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setMsg(""); if (!name.trim()) return setMsg("O nome e obrigatorio.");
    try { setUploading(true); await updateProfile(auth.currentUser, { displayName: name }); await setDoc(doc(db, "artifacts", APP_ID, "users", user.uid), { name, photoUrl, updatedAt: serverTimestamp() }, { merge: true }); setMsg("Perfil atualizado com sucesso!"); }
    catch (e) { console.error(e); setMsg("Erro ao guardar perfil."); } finally { setUploading(false); }
  };

  const Stat = ({ label, value, color }) => (<div className="ft-raised" style={{ borderRadius: 14, padding: 12, textAlign: "center" }}><div className="eyebrow" style={{ color: color || "var(--faint)" }}>{label}</div><div className="num" style={{ fontSize: 24, color: color || "var(--text)", marginTop: 2 }}>{value}</div></div>);

  if (loadingData) return <div style={{ padding: 60, textAlign: "center", color: "var(--grass-bright)" }}><Loader2 size={28} style={{ animation: "ftspin 1s linear infinite" }} /></div>;
  return (
    <div className="ft-in" style={{ padding: "20px 16px 110px", maxWidth: 440, margin: "0 auto" }}>
      <h2 className="num" style={{ fontSize: 24, color: "var(--chalk)", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 10 }}><User size={22} style={{ color: "var(--grass-bright)" }} /> O MEU PERFIL</h2>
      <div className="ft-card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
            <Avatar name={name || "Eu"} photo={photoUrl} size={92} />
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--grass)", padding: 8, borderRadius: "50%", border: "2px solid var(--card)" }}>{uploading ? <Loader2 size={15} color="#04130a" style={{ animation: "ftspin 1s linear infinite" }} /> : <Camera size={15} color="#04130a" />}</div>
          </div>
          <input type="file" ref={fileRef} onChange={handleImageUpload} accept="image/*" style={{ display: "none" }} />
          <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 10 }}>Toca para alterar a foto</p>
        </div>
        <div style={{ marginTop: 16 }}><label className="eyebrow">Nome de jogador</label><input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="O teu nome..." style={{ marginTop: 6 }} /></div>
        {msg && <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, padding: 8, borderRadius: 10, background: msg.includes("sucesso") ? "rgba(34,197,94,.12)" : "rgba(240,86,58,.12)", color: msg.includes("sucesso") ? "var(--grass-bright)" : "#ff9684" }}>{msg}</div>}
        <button onClick={save} disabled={uploading} className="ft-btn ft-grass" style={{ width: "100%", padding: 13, marginTop: 16 }}><Save size={18} /> Guardar alterações</button>
      </div>
      <div className="ft-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px" }}><Trophy size={16} style={{ color: "var(--gold)" }} /> Números globais</h3>
        <p style={{ fontSize: 11, color: "var(--dim)", margin: "0 0 14px" }}>O somatório da tua carreira em todos os grupos.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          <Stat label="Jogos" value={stats.games} /><Stat label="Vitorias" value={stats.wins} color="var(--grass-bright)" /><Stat label="Win %" value={`${stats.games ? Math.round((stats.wins / stats.games) * 100) : 0}%`} color="var(--blue)" />
          <Stat label="Golos" value={stats.goals} color="var(--grass-bright)" /><Stat label="Assist." value={stats.assists} color="var(--blue)" /><Stat label="MVPs" value={stats.mvps} color="var(--gold)" />
        </div>
      </div>
      <button onClick={onLogout} className="ft-btn" style={{ width: "100%", background: "none", color: "#ff9684", padding: 14, marginTop: 18 }}><LogOut size={16} /> Terminar sessao</button>
    </div>
  );
};

/* ------------------------------- Chat ------------------------------------ */
const ChatTab = ({ messages, me, onSend, onMarkRead }) => {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { onMarkRead?.(); }, []);
  const send = () => { if (!text.trim()) return; onSend(text.trim()); setText(""); };
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

/* ========================= TREINOS ======================================= */
const TrainingTab = ({ trainings, me, amIAdmin, onAdd, onDelete, onToggle }) => {
  const [open, setOpen] = useState(false);
  const [tdate, setTdate] = useState(""); const [ttime, setTtime] = useState("19:00"); const [local, setLocal] = useState("");
  const submit = () => { if (!tdate || !local.trim()) return; onAdd({ date: `${tdate}T${ttime}:00`, local: local.trim() }); setTdate(""); setLocal(""); setOpen(false); };
  const now = new Date();
  const upcoming = [...trainings].filter((t) => new Date(t.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = [...trainings].filter((t) => new Date(t.date) <= now).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const Card = (t) => {
    const d = new Date(t.date); const myResp = t.responses?.[me.uid];
    const going = Object.values(t.responses || {}).filter((v) => v === "going").length;
    const isFuture = d > now;
    return (
      <div key={t.id} className="ft-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "rgba(0,0,0,.25)", padding: "6px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
          {amIAdmin && <button onClick={() => onDelete(t.id)} className="ft-btn" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Trash2 size={12} /></button>}
        </div>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 12, background: "rgba(106,169,224,.12)", color: "var(--blue)" }}><Dumbbell size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t.local}</div>
            <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><Users size={11} /> {going} confirmados</div>
          </div>
          {isFuture && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onToggle(t.id, "going")} className="ft-btn" style={{ fontSize: 11, padding: "6px 10px", background: myResp === "going" ? "var(--grass)" : "var(--raised)", color: myResp === "going" ? "#04130a" : "var(--dim)", border: "1px solid var(--line)" }}>Vou</button>
              <button onClick={() => onToggle(t.id, "not_going")} className="ft-btn" style={{ fontSize: 11, padding: "6px 10px", background: myResp === "not_going" ? "var(--danger)" : "var(--raised)", color: myResp === "not_going" ? "#fff" : "var(--dim)", border: "1px solid var(--line)" }}>Não vou</button>
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {amIAdmin && (
        <button onClick={() => setOpen((o) => !o)} className="ft-btn ft-grass" style={{ padding: 13, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Plus size={16} /> Marcar treino</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
      {open && (
        <div className="ft-card ft-in" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Local</label><input className="ft-input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Campo Municipal de Odivelas" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Data</label><input type="date" className="ft-input" value={tdate} onChange={(e) => setTdate(e.target.value)} /></div>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Hora</label><input type="time" className="ft-input" value={ttime} onChange={(e) => setTtime(e.target.value)} /></div>
          </div>
          <button onClick={submit} disabled={!tdate || !local.trim()} className="ft-btn ft-grass" style={{ padding: 12 }}>Adicionar treino</button>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed var(--line)", borderRadius: 18, color: "var(--faint)", fontSize: 13 }}>Ainda sem treinos marcados.</div>}
      {upcoming.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 10 }}>Próximos treinos</div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{upcoming.map(Card)}</div></div>}
      {past.length > 0 && <div style={{ opacity: 0.6 }}><div className="eyebrow" style={{ marginBottom: 10 }}>Últimos treinos</div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{past.map(Card)}</div></div>}
    </div>
  );
};

/* ========================= AGENDA MODO LIGA ============================== */
const LeagueScheduleTab = ({ leagueGames, me, players }) => {
  const now = new Date();
  const next = [...leagueGames].filter((g) => g.scoreA == null).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const last = [...leagueGames].filter((g) => g.scoreA != null).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const played = leagueGames.filter((g) => g.scoreA != null);
  const wins = played.filter((g) => g.scoreA > g.scoreB).length;
  const draws = played.filter((g) => g.scoreA === g.scoreB).length;
  const losses = played.filter((g) => g.scoreA < g.scoreB).length;
  const pts = wins * 3 + draws;
  if (!next && !last) return (
    <div className="ft-in" style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed var(--line)", borderRadius: 18, color: "var(--faint)", fontSize: 13 }}>
      <ListOrdered size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p>Ainda sem jogos no calendário.<br />Adiciona jogos no separador Liga.</p>
    </div>
  );
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {next && (
        <div className="pitch" style={{ padding: 22 }}>
          <PitchLines /><div className="stripe" />
          <div style={{ position: "relative" }}>
            <span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Próximo jogo oficial</span>
            <div className="num" style={{ fontSize: 36, lineHeight: .95, color: "var(--chalk)", marginTop: 8 }}>vs {next.opponent}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} /> {new Date(next.date).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: next.home ? "var(--grass-bright)" : "var(--blue)", background: next.home ? "rgba(34,197,94,.15)" : "rgba(106,169,224,.15)", padding: "3px 10px", borderRadius: 8 }}>{next.home ? "Casa" : "Fora"}</span>
            </div>
          </div>
        </div>
      )}
      {played.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[["Pts", pts, "var(--gold)"], ["V", wins, "var(--grass-bright)"], ["E", draws, "var(--blue)"], ["D", losses, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} className="ft-raised" style={{ borderRadius: 14, padding: "10px 8px", textAlign: "center" }}><div className="eyebrow" style={{ color: c }}>{l}</div><div className="num" style={{ fontSize: 26, color: c }}>{v}</div></div>
          ))}
        </div>
      )}
      {last && (
        <div className="ft-card" style={{ padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Último resultado</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="num" style={{ fontSize: 22, color: last.scoreA > last.scoreB ? "var(--grass-bright)" : last.scoreA === last.scoreB ? "var(--gold)" : "var(--danger)", minWidth: 28 }}>{last.scoreA > last.scoreB ? "V" : last.scoreA === last.scoreB ? "E" : "D"}</div>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>vs {last.opponent}</div><div className="num" style={{ fontSize: 20, color: "var(--chalk)" }}>{last.scoreA} - {last.scoreB}</div></div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================= LIGA: CALENDARIO ============================== */
const POSITIONS_5 = ["GR","DEF","DEF","MEI","AV"];
const POSITIONS_7 = ["GR","DEF","DEF","DEF","MEI","MEI","AV"];
const POSITIONS_11 = ["GR","DEF","DEF","DEF","DEF","MEI","MEI","MEI","AV","AV","AV"];
const POSITION_OPTS = ["GR","DEF","MEI","AV","SUP"];

const LeagueCalendarTab = ({ leagueGames, members, amIAdmin, onAdd, onDelete, onResult }) => {
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [home, setHome] = useState(true);
  const [editResult, setEditResult] = useState(null);
  const [sa, setSa] = useState(""); const [sb, setSb] = useState("");

  const sorted = [...leagueGames].sort((a, b) => new Date(a.date) - new Date(b.date));
  const played = sorted.filter((g) => g.scoreA != null);
  const upcoming = sorted.filter((g) => g.scoreA == null);

  const pts = (g) => { if (g.scoreA == null) return null; const w = home ? g.scoreA > g.scoreB : g.scoreB > g.scoreA; const d = g.scoreA === g.scoreB; return w ? 3 : d ? 1 : 0; };
  const totalPts = played.reduce((s, g) => s + (pts(g) || 0), 0);
  const wins = played.filter((g) => pts(g) === 3).length;
  const draws = played.filter((g) => pts(g) === 1).length;
  const losses = played.filter((g) => pts(g) === 0).length;

  const submit = () => {
    if (!opponent.trim() || !date) return;
    onAdd({ opponent: opponent.trim(), date: `${date}T${time}:00`, home });
    setOpponent(""); setDate(""); setOpen(false);
  };
  const saveResult = (g) => {
    if (sa === "" || sb === "") return;
    onResult(g.id, parseInt(sa, 10), parseInt(sb, 10));
    setEditResult(null); setSa(""); setSb("");
  };

  const GameCard = (g) => {
    const d = new Date(g.date); const past = g.scoreA != null;
    const myScore = g.home ? g.scoreA : g.scoreB; const oppScore = g.home ? g.scoreB : g.scoreA;
    const result = past ? (myScore > oppScore ? "V" : myScore === oppScore ? "E" : "D") : null;
    const resultColor = { V: "var(--grass-bright)", E: "var(--gold)", D: "var(--danger)" }[result];
    return (
      <div key={g.id} className="ft-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "rgba(0,0,0,.25)", padding: "6px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="eyebrow">{d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: g.home ? "rgba(34,197,94,.15)" : "rgba(106,169,224,.15)", color: g.home ? "var(--grass-bright)" : "var(--blue)" }}>{g.home ? "Casa" : "Fora"}</span>
            {amIAdmin && <button onClick={() => onDelete(g.id)} className="ft-btn" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Trash2 size={12} /></button>}
          </div>
        </div>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {result && <div className="num" style={{ fontSize: 22, color: resultColor, minWidth: 28 }}>{result}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>vs {g.opponent}</div>
            {past && <div className="num" style={{ fontSize: 26, color: "var(--chalk)", marginTop: 2 }}>{g.scoreA} <span style={{ color: "var(--faint)", fontWeight: 300 }}>-</span> {g.scoreB}</div>}
          </div>
          {!past && amIAdmin && editResult?.id !== g.id && (
            <button onClick={() => { setEditResult(g); setSa(""); setSb(""); }} className="ft-btn ft-ghost" style={{ fontSize: 12, padding: "8px 12px" }}>Resultado</button>
          )}
        </div>
        {editResult?.id === g.id && (
          <div className="ft-in" style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" min="0" value={sa} onChange={(e) => setSa(e.target.value)} placeholder="Nos" className="num ft-input" style={{ width: 60, textAlign: "center", fontSize: 22, padding: "8px 4px" }} />
            <span style={{ color: "var(--faint)" }}>-</span>
            <input type="number" min="0" value={sb} onChange={(e) => setSb(e.target.value)} placeholder="Adv" className="num ft-input" style={{ width: 60, textAlign: "center", fontSize: 22, padding: "8px 4px" }} />
            <button onClick={() => saveResult(g)} className="ft-btn ft-grass" style={{ flex: 1, padding: 10, fontSize: 13 }}>Guardar</button>
            <button onClick={() => setEditResult(null)} className="ft-btn ft-ghost" style={{ padding: 10 }}><X size={14} /></button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {played.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[["Pontos", totalPts, "var(--gold)"], ["Vitorias", wins, "var(--grass-bright)"], ["Empates", draws, "var(--blue)"], ["Derrotas", losses, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} className="ft-raised" style={{ borderRadius: 14, padding: "10px 8px", textAlign: "center" }}>
              <div className="eyebrow" style={{ color: c }}>{l}</div>
              <div className="num" style={{ fontSize: 26, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {amIAdmin && (
        <button onClick={() => setOpen((o) => !o)} className="ft-btn ft-grass" style={{ padding: 13, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Plus size={16} /> Adicionar jogo oficial</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
      {open && (
        <div className="ft-card ft-in" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Adversario</label><input className="ft-input" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Nome da equipa adversaria..." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Data</label><input type="date" className="ft-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Hora</label><input type="time" className="ft-input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
            {[[true, "Casa"], [false, "Fora"]].map(([v, l]) => <button key={l} onClick={() => setHome(v)} className="ft-btn" style={{ padding: "9px 4px", fontSize: 13, background: home === v ? "var(--grass)" : "none", color: home === v ? "#04130a" : "var(--faint)" }}>{l}</button>)}
          </div>
          <button onClick={submit} disabled={!opponent.trim() || !date} className="ft-btn ft-grass" style={{ padding: 12 }}>Adicionar ao calendário</button>
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Próximos jogos - {upcoming.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{upcoming.map(GameCard)}</div>
        </div>
      )}
      {played.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Jogados - {played.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{played.map(GameCard)}</div>
        </div>
      )}
      {leagueGames.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed var(--line)", borderRadius: 18, color: "var(--faint)", fontSize: 13 }}>Ainda sem jogos na liga.<br />Adiciona o primeiro jogo oficial acima.</div>}
    </div>
  );
};

/* ========================= LIGA: CONVOCATORIA ============================ */
const LineupTab = ({ members, amIAdmin, leagueGames, onSaveLineup }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [size, setSize] = useState(5);
  const [lineup, setLineup] = useState({}); // { playerId: { pos, role: "titular"|"suplente" } }
  const [saved, setSaved] = useState(false);

  const upcoming = leagueGames.filter((g) => g.scoreA == null).sort((a, b) => new Date(a.date) - new Date(b.date));
  const defaultPositions = size === 5 ? POSITIONS_5 : size === 7 ? POSITIONS_7 : POSITIONS_11;
  const titulares = members.filter((p) => lineup[p.id]?.role === "titular");
  const suplentes = members.filter((p) => lineup[p.id]?.role === "suplente");
  const notCalled = members.filter((p) => !lineup[p.id]?.role);

  const setRole = (pid, role) => setLineup((l) => ({ ...l, [pid]: { ...l[pid], role } }));
  const setPos = (pid, pos) => setLineup((l) => ({ ...l, [pid]: { ...l[pid], pos } }));
  const clearPlayer = (pid) => setLineup((l) => { const n = { ...l }; delete n[pid]; return n; });

  const save = async () => {
    if (!selectedGame) return;
    await onSaveLineup(selectedGame.id, { size, lineup });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const PlayerRow = ({ p, role }) => (
    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderTop: "1px solid var(--line-soft)" }}>
      <Avatar name={p.name} photo={p.photoUrl} size={30} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
      {role === "titular" && (
        <select value={lineup[p.id]?.pos || ""} onChange={(e) => setPos(p.id, e.target.value)}
          className="ft-input" style={{ width: 72, padding: "4px 6px", fontSize: 11 }}>
          <option value="">Pos.</option>
          {POSITION_OPTS.map((po) => <option key={po} value={po}>{po}</option>)}
        </select>
      )}
      {amIAdmin && (
        <div style={{ display: "flex", gap: 4 }}>
          {role !== "titular" && <button onClick={() => setRole(p.id, "titular")} className="ft-btn" style={{ fontSize: 10, padding: "4px 8px", background: "rgba(34,197,94,.15)", color: "var(--grass-bright)", border: "1px solid rgba(34,197,94,.3)" }}>Titular</button>}
          {role !== "suplente" && <button onClick={() => setRole(p.id, "suplente")} className="ft-btn" style={{ fontSize: 10, padding: "4px 8px", background: "rgba(106,169,224,.15)", color: "var(--blue)", border: "1px solid rgba(106,169,224,.3)" }}>SUP</button>}
          {role && <button onClick={() => clearPlayer(p.id)} className="ft-btn" style={{ padding: "4px 6px", background: "none", color: "var(--faint)" }}><X size={12} /></button>}
        </div>
      )}
    </div>
  );

  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ft-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}><Swords size={16} style={{ color: "var(--gold)" }} /> Jogo oficial</h3>
        {upcoming.length === 0
          ? <p style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic", margin: 0 }}>Adiciona um jogo no Calendário para poder fazer a convocatória.</p>
          : <select className="ft-input" value={selectedGame?.id || ""} onChange={(e) => setSelectedGame(upcoming.find((g) => g.id === e.target.value) || null)}>
              <option value="">Seleciona o jogo...</option>
              {upcoming.map((g) => <option key={g.id} value={g.id}>{new Date(g.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · vs {g.opponent} {g.home ? "(Casa)" : "(Fora)"}</option>)}
            </select>}
      </div>
      {selectedGame && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
            {[5, 7, 11].map((n) => <button key={n} onClick={() => setSize(n)} className="ft-btn" style={{ padding: "8px 4px", fontSize: 12, background: size === n ? "var(--grass)" : "none", color: size === n ? "#04130a" : "var(--faint)" }}>{n}x{n}</button>)}
          </div>
          <div className="ft-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="eyebrow">Titulares <span style={{ color: titulares.length === size ? "var(--grass-bright)" : "var(--faint)" }}>({titulares.length}/{size})</span></span>
              <span style={{ fontSize: 10, color: "var(--faint)" }}>Posição recomendada: {defaultPositions.join("-").replace("GR-", "GR · ")}</span>
            </div>
            {titulares.length === 0 ? <p style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>Nenhum titular selecionado.</p> : titulares.map((p) => <PlayerRow key={p.id} p={p} role="titular" />)}
          </div>
          <div className="ft-card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Suplentes ({suplentes.length})</div>
            {suplentes.length === 0 ? <p style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>Nenhum suplente selecionado.</p> : suplentes.map((p) => <PlayerRow key={p.id} p={p} role="suplente" />)}
          </div>
          <div className="ft-card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Não convocados ({notCalled.length})</div>
            {notCalled.length === 0 ? <p style={{ fontSize: 11, color: "var(--grass-bright)", fontSize: 12 }}>Toda a gente convocada!</p> : notCalled.map((p) => <PlayerRow key={p.id} p={p} role={null} />)}
          </div>
          {amIAdmin && (
            <button onClick={save} className="ft-btn ft-grass" style={{ width: "100%", padding: 14 }}>
              {saved ? <><Check size={16} /> Guardado!</> : <><Save size={16} /> Guardar convocatória</>}
            </button>
          )}
        </>
      )}
    </div>
  );
};

/* ------------------------------ Tatica ----------------------------------- */
const FORMATIONS = {
  5: [[50, 90], [30, 72], [70, 72], [35, 50], [65, 50]],
  7: [[50, 92], [24, 75], [50, 77], [76, 75], [30, 53], [70, 53], [50, 37]],
  11: [[50, 93], [18, 79], [40, 81], [60, 81], [82, 79], [26, 59], [50, 61], [74, 59], [32, 39], [68, 39], [50, 30]],
};
const fLabel = (i) => (i === 0 ? "GR" : String(i));
const makeField = (n) => FORMATIONS[n].map((p, i) => ({ id: "f" + i + rnd(), label: fLabel(i), x: p[0], y: p[1] }));
const makeOpp = (n) => FORMATIONS[n].map((p, i) => ({ id: "o" + i + rnd(), label: fLabel(i), x: p[0], y: 100 - p[1] }));

/* ========================= TATICA MODO LIGA ============================== */
const TacticsLeagueTab = ({ members, leagueGames, showToast }) => {
  const upcoming = leagueGames.filter((g) => g.scoreA == null).sort((a, b) => new Date(a.date) - new Date(b.date));
  const [selectedGame, setSelectedGame] = useState(null);
  const [size, setSize] = useState(5);
  const [field, setField] = useState(() => makeField(5));
  const [bench, setBench] = useState([]);
  const [showOpp, setShowOpp] = useState(false);
  const [opp, setOpp] = useState([]);
  const [hasBall, setHasBall] = useState(true);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [drawMode, setDrawMode] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const boardRef = useRef(null); const dragRef = useRef(null); const drawingRef = useRef(false);

  useEffect(() => {
    if (!selectedGame?.lineup) return;
    const { size: s, lineup: l } = selectedGame.lineup;
    if (s) setSize(s);
    if (l) {
      const titIds = Object.entries(l).filter(([, v]) => v.role === "titular").map(([id]) => id);
      const titPlayers = members.filter((m) => titIds.includes(m.id));
      const positions = FORMATIONS[s || 5] || FORMATIONS[5];
      setField(titPlayers.map((m, i) => { const pos = positions[i] || [50, 50]; return { id: "f" + rnd(), label: initials(m.name), name: m.name, x: pos[0], y: pos[1] }; }));
      const benchIds = Object.entries(l).filter(([, v]) => v.role === "suplente").map(([id]) => id);
      setBench(members.filter((m) => benchIds.includes(m.id)).map((m) => ({ id: "b" + rnd(), label: initials(m.name), name: m.name })));
    }
  }, [selectedGame?.id]);

  const pct = (e) => { const r = boardRef.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };
  const applySize = (n) => { setSize(n); setField(makeField(n)); setBench([]); if (showOpp) setOpp(makeOpp(n)); };
  const toggleOpp = () => { setShowOpp((v) => { const n = !v; setOpp(n ? makeOpp(size) : []); return n; }); };
  const addFromBench = (item) => { setBench((b) => b.filter((x) => x.id !== item.id)); setField((f) => [...f, { id: "f" + rnd(), label: item.label, name: item.name, x: 50, y: 50 }]); };
  const addBlank = () => setField((f) => [...f, { id: "f" + rnd(), label: String(f.length), x: 50, y: 50 }]);
  const removeToBench = (t) => { setField((f) => f.filter((x) => x.id !== t.id)); setBench((b) => [...b, { id: "b" + rnd(), label: t.label, name: t.name || t.label }]); };
  const reset = () => { setField(makeField(size)); setOpp(showOpp ? makeOpp(size) : []); setBench([]); setStrokes([]); setBall({ x: 50, y: 50 }); showToast("Quadro reposto"); };
  const onTokenDown = (e, id) => { if (drawMode) return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = id; };
  const onTokenMove = (e, id) => { if (dragRef.current !== id) return; const p = pct(e); const x = Math.max(4, Math.min(96, p.x)), y = Math.max(3, Math.min(97, p.y)); if (id === "ball") setBall({ x, y }); else if (id[0] === "o") setOpp((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t))); else setField((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t))); };
  const onTokenUp = (e) => { dragRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { } };
  const onBoardDown = (e) => { if (!drawMode) return; e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; setStrokes((s) => [...s, [pct(e)]]); };
  const onBoardMove = (e) => { if (!drawMode || !drawingRef.current) return; const p = pct(e); setStrokes((s) => { const c = s.slice(); c[c.length - 1] = [...c[c.length - 1], p]; return c; }); };
  const onBoardUp = () => { drawingRef.current = false; };
  const Token = (t, black) => (
    <div key={t.id} onPointerDown={(e) => onTokenDown(e, t.id)} onPointerMove={(e) => onTokenMove(e, t.id)} onPointerUp={onTokenUp}
      style={{ position: "absolute", left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)", touchAction: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, cursor: drawMode ? "crosshair" : "grab", userSelect: "none", zIndex: 5, background: black ? "#0c0f0e" : "var(--chalk)", color: black ? "#cfe8da" : "#0b0b0b", border: black ? "2px solid #3a4a43" : "2px solid #0b0b0b", boxShadow: "0 3px 8px rgba(0,0,0,.4)" }}>
      {t.label}
      {!black && !drawMode && (<span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeToBench(t); }} style={{ position: "absolute", top: -7, right: -7, width: 16, height: 16, borderRadius: "50%", background: "var(--danger)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,.4)" }}><X size={10} /></span>)}
    </div>
  );
  return (
    <div className="ft-in" style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: "flex", gap: 8, alignItems: "center" }}><TacticIcon size={18} /> Quadro tatico</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setDrawMode((d) => !d)} className="ft-btn" style={{ padding: 9, borderRadius: 10, background: drawMode ? "var(--lime)" : "var(--raised)", color: drawMode ? "#1a2200" : "var(--text)", border: "1px solid var(--line)" }}><Pencil size={16} /></button>
          <button onClick={reset} className="ft-btn ft-ghost" style={{ padding: 9, borderRadius: 10 }}><RotateCcw size={16} /></button>
        </div>
      </div>
      {upcoming.length > 0 && (
        <div className="ft-card" style={{ padding: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Jogo oficial (carrega convocatória)</div>
          <select className="ft-input" value={selectedGame?.id || ""} onChange={(e) => setSelectedGame(upcoming.find((g) => g.id === e.target.value) || null)} style={{ padding: "8px 10px", fontSize: 12 }}>
            <option value="">Selecionar jogo...</option>
            {upcoming.map((g) => <option key={g.id} value={g.id}>{new Date(g.date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} · vs {g.opponent}</option>)}
          </select>
          {selectedGame?.lineup && <p style={{ fontSize: 10, color: "var(--grass-bright)", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}><Check size={10} /> Convocatoria carregada automaticamente</p>}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
        {[5, 7, 11].map((n) => <button key={n} onClick={() => applySize(n)} className="ft-btn" style={{ padding: "8px 4px", fontSize: 12, background: size === n ? "var(--grass)" : "none", color: size === n ? "#04130a" : "var(--faint)" }}>{n}x{n}</button>)}
      </div>
      <div ref={boardRef} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp}
        style={{ position: "relative", width: "100%", aspectRatio: "2 / 3", borderRadius: 18, overflow: "hidden", touchAction: "none", border: "1px solid var(--line)", background: "linear-gradient(180deg,#13301f,#0c2016)" }}>
        <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <g fill="none" stroke="rgba(245,248,246,.45)" strokeWidth="0.5">
            <rect x="3" y="3" width="94" height="144" /><line x1="3" y1="75" x2="97" y2="75" />
            <circle cx="50" cy="75" r="11" /><circle cx="50" cy="75" r="0.9" fill="rgba(245,248,246,.7)" stroke="none" />
            <rect x="30" y="3" width="40" height="16" /><rect x="40" y="3" width="20" height="7" />
            <rect x="30" y="131" width="40" height="16" /><rect x="40" y="140" width="20" height="7" />
            <rect x="42" y="0.5" width="16" height="2.5" stroke="rgba(245,248,246,.7)" /><rect x="42" y="147" width="16" height="2.5" stroke="rgba(245,248,246,.7)" />
          </g>
        </svg>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
          {strokes.map((s, i) => <polyline key={i} points={s.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
        </svg>
        {opp.map((t) => Token(t, true))}{field.map((t) => Token(t, false))}
        {hasBall && (<div onPointerDown={(e) => onTokenDown(e, "ball")} onPointerMove={(e) => onTokenMove(e, "ball")} onPointerUp={onTokenUp} style={{ position: "absolute", left: `${ball.x}%`, top: `${ball.y}%`, transform: "translate(-50%,-50%)", touchAction: "none", cursor: drawMode ? "crosshair" : "grab", zIndex: 6 }}><div style={{ background: "#fff", borderRadius: "50%", padding: 2, boxShadow: "0 2px 6px rgba(0,0,0,.5)" }}><SoccerBall size={18} color="#111" /></div></div>)}
        {drawMode && <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(198,242,74,.9)", color: "#1a2200", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 8, zIndex: 7 }}>MODO DESENHO</div>}
      </div>
      <div className="ft-card" style={{ padding: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Banco - {bench.length}</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, minHeight: 40 }}>
          {bench.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Sem suplentes na convocatória.</span>}
          {bench.map((b) => (<button key={b.id} onClick={() => addFromBench(b)} className="ft-btn" style={{ flexDirection: "column", gap: 4, background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 6px", minWidth: 56 }}><Avatar name={b.name || b.label} size={28} /><span style={{ fontSize: 10, fontWeight: 700 }}>{firstName(b.name || b.label)}</span></button>))}
        </div>
      </div>
      <div className="ft-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={addBlank} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Plus size={14} /> Adicionar peça</button>
          <button onClick={toggleOpp} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>{showOpp ? "Tirar adversario" : "Adversario"}</button>
          <button onClick={() => setHasBall((b) => !b)} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>{hasBall ? "Tirar bola" : "Por bola"}</button>
          <button onClick={() => setStrokes([])} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Pencil size={14} /> Limpar</button>
        </div>
      </div>
    </div>
  );
};

const TacticsTab = ({ members, showToast }) => {
  const [size, setSize] = useState(5);
  const [field, setField] = useState(() => makeField(5));
  const [bench, setBench] = useState([]);
  const [showOpp, setShowOpp] = useState(false);
  const [opp, setOpp] = useState([]);
  const [hasBall, setHasBall] = useState(true);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [drawMode, setDrawMode] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const drawingRef = useRef(false);

  const pct = (e) => { const r = boardRef.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };

  const applySize = (n) => { setSize(n); setField(makeField(n)); setBench([]); if (showOpp) setOpp(makeOpp(n)); };
  const toggleOpp = () => { setShowOpp((v) => { const n = !v; setOpp(n ? makeOpp(size) : []); return n; }); };
  const loadRoster = () => {
    if (members.length === 0) return showToast("Sem jogadores no plantel", "error");
    setField((f) => f.map((t, i) => (members[i] ? { ...t, label: initials(members[i].name), name: members[i].name } : t)));
    setBench(members.slice(field.length).map((m) => ({ id: "b" + rnd(), label: initials(m.name), name: m.name })));
    showToast("Plantel carregado no campo");
  };
  const addFromBench = (item) => { setBench((b) => b.filter((x) => x.id !== item.id)); setField((f) => [...f, { id: "f" + rnd(), label: item.label, name: item.name, x: 50, y: 50 }]); };
  const addBlank = () => setField((f) => [...f, { id: "f" + rnd(), label: String(f.length), x: 50, y: 50 }]);
  const removeToBench = (t) => { setField((f) => f.filter((x) => x.id !== t.id)); setBench((b) => [...b, { id: "b" + rnd(), label: t.label, name: t.name || t.label }]); };
  const reset = () => { setField(makeField(size)); setOpp(showOpp ? makeOpp(size) : []); setBench([]); setStrokes([]); setBall({ x: 50, y: 50 }); showToast("Quadro reposto"); };

  const onTokenDown = (e, id) => { if (drawMode) return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = id; };
  const onTokenMove = (e, id) => {
    if (dragRef.current !== id) return;
    const p = pct(e); const x = Math.max(4, Math.min(96, p.x)), y = Math.max(3, Math.min(97, p.y));
    if (id === "ball") setBall({ x, y });
    else if (id[0] === "o") setOpp((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
    else setField((ts) => ts.map((t) => (t.id === id ? { ...t, x, y } : t)));
  };
  const onTokenUp = (e) => { dragRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ } };

  const onBoardDown = (e) => { if (!drawMode) return; e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; setStrokes((s) => [...s, [pct(e)]]); };
  const onBoardMove = (e) => { if (!drawMode || !drawingRef.current) return; const p = pct(e); setStrokes((s) => { const c = s.slice(); c[c.length - 1] = [...c[c.length - 1], p]; return c; }); };
  const onBoardUp = () => { drawingRef.current = false; };

  const Token = (t, black) => (
    <div key={t.id} onPointerDown={(e) => onTokenDown(e, t.id)} onPointerMove={(e) => onTokenMove(e, t.id)} onPointerUp={onTokenUp}
      style={{ position: "absolute", left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)", touchAction: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, cursor: drawMode ? "crosshair" : "grab", userSelect: "none", zIndex: 5, background: black ? "#0c0f0e" : "var(--chalk)", color: black ? "#cfe8da" : "#0b0b0b", border: black ? "2px solid #3a4a43" : "2px solid #0b0b0b", boxShadow: "0 3px 8px rgba(0,0,0,.4)" }}>
      {t.label}
      {!black && !drawMode && (
        <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeToBench(t); }}
          style={{ position: "absolute", top: -7, right: -7, width: 16, height: 16, borderRadius: "50%", background: "var(--danger)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,.4)" }}><X size={10} /></span>
      )}
    </div>
  );

  return (
    <div className="ft-in" style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: "flex", gap: 8, alignItems: "center" }}><TacticIcon size={18} /> Quadro tatico</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setDrawMode((d) => !d)} className="ft-btn" title="Desenhar" style={{ padding: 9, borderRadius: 10, background: drawMode ? "var(--lime)" : "var(--raised)", color: drawMode ? "#1a2200" : "var(--text)", border: "1px solid var(--line)" }}><Pencil size={16} /></button>
          <button onClick={reset} className="ft-btn ft-ghost" title="Repor" style={{ padding: 9, borderRadius: 10 }}><RotateCcw size={16} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)" }}>
        {[5, 7, 11].map((n) => <button key={n} onClick={() => applySize(n)} className="ft-btn" style={{ padding: "8px 4px", fontSize: 12, background: size === n ? "var(--grass)" : "none", color: size === n ? "#04130a" : "var(--faint)" }}>{n}x{n}</button>)}
      </div>

      <div ref={boardRef} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp}
        style={{ position: "relative", width: "100%", aspectRatio: "2 / 3", borderRadius: 18, overflow: "hidden", touchAction: "none", border: "1px solid var(--line)", background: "linear-gradient(180deg,#13301f,#0c2016)" }}>
        <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <g fill="none" stroke="rgba(245,248,246,.45)" strokeWidth="0.5">
            <rect x="3" y="3" width="94" height="144" /><line x1="3" y1="75" x2="97" y2="75" />
            <circle cx="50" cy="75" r="11" /><circle cx="50" cy="75" r="0.9" fill="rgba(245,248,246,.7)" stroke="none" />
            <rect x="30" y="3" width="40" height="16" /><rect x="40" y="3" width="20" height="7" />
            <rect x="30" y="131" width="40" height="16" /><rect x="40" y="140" width="20" height="7" />
            <rect x="42" y="0.5" width="16" height="2.5" stroke="rgba(245,248,246,.7)" /><rect x="42" y="147" width="16" height="2.5" stroke="rgba(245,248,246,.7)" />
          </g>
        </svg>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
          {strokes.map((s, i) => <polyline key={i} points={s.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
        </svg>
        {opp.map((t) => Token(t, true))}
        {field.map((t) => Token(t, false))}
        {hasBall && (
          <div onPointerDown={(e) => onTokenDown(e, "ball")} onPointerMove={(e) => onTokenMove(e, "ball")} onPointerUp={onTokenUp}
            style={{ position: "absolute", left: `${ball.x}%`, top: `${ball.y}%`, transform: "translate(-50%,-50%)", touchAction: "none", cursor: drawMode ? "crosshair" : "grab", zIndex: 6 }}>
            <div style={{ background: "#fff", borderRadius: "50%", padding: 2, boxShadow: "0 2px 6px rgba(0,0,0,.5)" }}><SoccerBall size={18} color="#111" /></div>
          </div>
        )}
        {drawMode && <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(198,242,74,.9)", color: "#1a2200", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 8, zIndex: 7 }}>MODO DESENHO</div>}
      </div>

      <div className="ft-card" style={{ padding: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Banco de suplentes - {bench.length}</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, minHeight: 40 }}>
          {bench.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Remove jogadores do campo (×) ou carrega o plantel.</span>}
          {bench.map((b) => (
            <button key={b.id} onClick={() => addFromBench(b)} className="ft-btn" style={{ flexDirection: "column", gap: 4, background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 12, padding: "8px 6px", minWidth: 56 }}>
              <Avatar name={b.name || b.label} size={28} /><span style={{ fontSize: 10, fontWeight: 700 }}>{firstName(b.name || b.label)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ft-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={addBlank} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Plus size={14} /> Adicionar peça</button>
          <button onClick={loadRoster} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>Carregar plantel</button>
          <button onClick={toggleOpp} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>{showOpp ? "Tirar adversario" : "Adversario (preto)"}</button>
          <button onClick={() => setHasBall((b) => !b)} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}>{hasBall ? "Tirar bola" : "Por bola"}</button>
        </div>
        <button onClick={() => setStrokes([])} className="ft-btn ft-ghost" style={{ padding: 10, fontSize: 12 }}><Pencil size={14} /> Limpar desenho</button>
        <p style={{ fontSize: 11, color: "var(--faint)", margin: 0 }}>Arrasta as pecas e a bola. O "x" envia o jogador para o banco; toca no banco para o repor.</p>
      </div>
    </div>
  );
};

/* ----------------------------- Agenda ------------------------------------ */
const ScheduleTab = ({ next, players, me, locationUrl, onToggle }) => {
  const date = next?.date ? new Date(next.date) : null;
  const myResp = next?.responses?.[me.uid];
  const going = Object.entries(next?.responses || {}).filter(([, s]) => s === "going");
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
      {locationUrl && <button onClick={() => window.open(locationUrl, "_blank")} className="ft-card ft-btn" style={{ padding: 14, justifyContent: "center", gap: 8, color: "var(--grass-bright)", fontWeight: 700 }}><MapPin size={16} style={{ color: "var(--danger)" }} /> Ver campo no mapa</button>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => onToggle("going")} className="ft-btn" style={{ padding: 18, flexDirection: "column", gap: 4, border: "1px solid", borderColor: myResp === "going" ? "var(--grass-bright)" : "var(--line)", background: myResp === "going" ? "linear-gradient(135deg,var(--grass-2),var(--grass))" : "var(--raised)", color: myResp === "going" ? "#04130a" : "var(--text)" }}><span style={{ fontSize: 22 }}>{"\u{1F44D}"}</span><span style={{ fontWeight: 800 }}>Vou jogar</span></button>
        <button onClick={() => onToggle("not_going")} className="ft-btn" style={{ padding: 18, flexDirection: "column", gap: 4, border: "1px solid", borderColor: myResp === "not_going" ? "var(--danger)" : "var(--line)", background: myResp === "not_going" ? "rgba(240,86,58,.85)" : "var(--raised)", color: myResp === "not_going" ? "#fff" : "var(--text)" }}><span style={{ fontSize: 22 }}>{"\u{1F6AB}"}</span><span style={{ fontWeight: 800 }}>Não vou</span></button>
      </div>
      <div className="ft-card" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Convocados - {going.length}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {going.map(([uid]) => { const p = players.find((pl) => pl.uid === uid); return p ? (<div key={uid} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px 5px 5px" }}><Avatar name={p.name} photo={p.photoUrl} size={24} /><span style={{ fontSize: 12, fontWeight: 600 }}>{firstName(p.name)}</span></div>) : null; })}
          {going.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Ainda ninguém confirmou.</span>}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- Plantel ----------------------------------- */
const PlayersTab = ({ members, guests, players, me, amIAdmin, isOwner, ownerId, avg, onAdd, onJoin, onRate, onRemove, onToggleAdmin }) => {
  const [name, setName] = useState(""); const [type, setType] = useState("guest"); const [host, setHost] = useState("");
  const [expanded, setExpanded] = useState(null); const [stars, setStars] = useState(3);
  const inRoster = players.some((p) => p.uid === me.uid);
  const submitAdd = () => { if (!name.trim()) return; if (type === "guest" && !host) return; onAdd({ name: name.trim(), type, hostId: type === "guest" ? host : null }); setName(""); };
  const Card = (p) => {
    const open = expanded === p.id; const myVote = p.votes?.[me.uid] || 0;
    return (
      <div key={p.id} onClick={() => { if (open) setExpanded(null); else { setExpanded(p.id); setStars(myVote || 3); } }} className="ft-card" style={{ padding: 12, cursor: "pointer", borderColor: open ? "rgba(34,197,94,.4)" : "var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={p.name} photo={p.photoUrl} size={36} ring={p.isAdmin} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>{p.name}{p.isAdmin && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", background: "rgba(245,197,66,.15)", padding: "1px 6px", borderRadius: 6 }}>Admin</span>}</div>
            <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>{amIAdmin ? <span style={{ color: "var(--gold)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}><Star size={11} style={{ fill: "var(--gold)" }} /> {avg(p)}</span> : myVote ? <span style={{ color: "var(--grass-bright)" }}>Avaliado</span> : <span>Toca para avaliar</span>}</div>
          </div>
          <ArrowRight size={16} style={{ color: "var(--faint)", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
        </div>
        {open && (
          <div className="ft-in" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            {p.uid !== me.uid && (
              <div className="ft-raised" style={{ borderRadius: 14, padding: 14, textAlign: "center", marginBottom: 10 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Classificar</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><StarRating value={stars} onChange={setStars} size={26} /></div>
                <button onClick={(e) => { e.stopPropagation(); onRate(p, stars); setExpanded(null); }} className="ft-btn ft-grass" style={{ width: "100%", padding: 9, fontSize: 13 }}>Confirmar</button>
              </div>
            )}
            {amIAdmin && (
              <div style={{ display: "flex", gap: 8 }}>
                {isOwner && p.uid !== ownerId && <button onClick={(e) => { e.stopPropagation(); onToggleAdmin(p); }} className="ft-btn" style={{ flex: 1, padding: 10, fontSize: 12, border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", color: "var(--gold)" }}>{p.isAdmin ? "Remover admin" : "Promover admin"}</button>}
                <button onClick={(e) => { e.stopPropagation(); onRemove(p); }} className="ft-btn ft-danger" style={{ flex: 1, padding: 10, fontSize: 12 }}><Trash2 size={14} /> Eliminar</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!inRoster && <button onClick={onJoin} className="ft-btn" style={{ background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.4)", color: "var(--grass-bright)", padding: 14, justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><UserPlus size={18} /> Entrar no plantel</span><Plus size={16} /></button>}
      <div className="ft-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><UserPlus size={16} style={{ color: "var(--grass-bright)" }} /> Novo jogador</h3>
          <div style={{ display: "flex", background: "#0a120f", borderRadius: 10, padding: 3, border: "1px solid var(--line)" }}>{["guest", "member"].map((t) => <button key={t} onClick={() => setType(t)} className="ft-btn" style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", background: type === t ? "var(--raised)" : "none", color: type === t ? "var(--text)" : "var(--faint)" }}>{t === "guest" ? "Convidado" : "Membro"}</button>)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome..." />
          {type === "guest" && <select className="ft-input" value={host} onChange={(e) => setHost(e.target.value)}><option value="">Quem convidou?</option>{members.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          <button onClick={submitAdd} className="ft-btn ft-grass" style={{ padding: 11 }}><Plus size={16} /> Adicionar</button>
        </div>
      </div>
      {members.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8, marginLeft: 4 }}>Membros - {members.length}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{members.map(Card)}</div></div>}
      {guests.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8, marginLeft: 4 }}>Convidados - {guests.length}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{guests.map(Card)}</div></div>}
    </div>
  );
};

/* ------------------------------ Equipa ----------------------------------- */
const TeamTab = ({ players, next, avg, onSaveMatch, showToast }) => {
  const goingIds = useMemo(() => {
    const uids = Object.entries(next?.responses || {}).filter(([, s]) => s === "going").map(([u]) => u);
    return players.filter((p) => p.uid && uids.includes(p.uid)).map((p) => p.id);
  }, [next, players]);
  const [selected, setSelected] = useState([]);
  const [seeded, setSeeded] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState(null);
  const [sa, setSa] = useState(""); const [sb, setSb] = useState("");
  const [gstats, setGstats] = useState({}); const [showStats, setShowStats] = useState(false);
  useEffect(() => { if (!seeded && goingIds.length > 0 && selected.length === 0) { setSelected(goingIds); setSeeded(true); } }, [goingIds, seeded, selected.length]);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const filt = (list) => list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const members = players.filter((p) => p.type !== "guest");
  const guests = players.filter((p) => p.type === "guest");
  const generate = () => {
    if (selected.length < 2) return showToast("Mínimo 2 jogadores", "error");
    const chosen = players.filter((p) => selected.includes(p.id));
    const blocks = {};
    chosen.forEach((p) => { let b = p.id; if (p.type === "guest" && p.hostId && selected.includes(p.hostId)) b = p.hostId; (blocks[b] ||= []).push(p); });
    const list = Object.values(blocks).map((mem) => ({ mem, r: mem.reduce((s, p) => s + avg(p), 0) })).sort((a, b) => b.r - a.r);
    let A = [], B = [], rA = 0, rB = 0;
    list.forEach((blk) => { const pick = rA < rB || (rA === rB && A.length <= B.length) ? "A" : "B"; if (pick === "A") { A = [...A, ...blk.mem]; rA += blk.r; } else { B = [...B, ...blk.mem]; rB += blk.r; } });
    const gs = {}; [...A, ...B].forEach((p) => (gs[p.id] = { g: 0, a: 0 }));
    setGstats(gs); setTeams({ A, B }); showToast("Equipas equilibradas!");
  };
  const bump = (pid, key, d) => setGstats((g) => ({ ...g, [pid]: { ...g[pid], [key]: Math.max(0, (g[pid]?.[key] || 0) + d) } }));
  const share = () => {
    const txt = `*Equipas definidas*\n\nBranco (${teams.A.length})\n${teams.A.map((p) => p.name).join("\n")}\n\nPreto (${teams.B.length})\n${teams.B.map((p) => p.name).join("\n")}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => showToast("Copiado! Cola no WhatsApp.")).catch(() => showToast("Erro ao copiar", "error"));
    else showToast("Erro ao copiar", "error");
  };
  const finish = () => {
    if (sa === "" || sb === "") return showToast("Insere o resultado", "error");
    onSaveMatch({ teamA: teams.A, teamB: teams.B, scoreA: parseInt(sa, 10), scoreB: parseInt(sb, 10), goals: gstats });
  };
  const Grid = (list) => list.length === 0 ? null : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {list.map((p) => { const on = selected.includes(p.id); return (
        <button key={p.id} onClick={() => toggle(p.id)} className="ft-btn" style={{ justifyContent: "flex-start", gap: 8, padding: 10, border: "1px solid", borderColor: on ? "var(--grass-bright)" : "var(--line)", background: on ? "rgba(34,197,94,.14)" : "var(--card)", color: on ? "var(--text)" : "var(--dim)" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid", borderColor: on ? "var(--grass-bright)" : "#4a5a52", background: on ? "var(--grass-bright)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={10} color="#04130a" />}</div>
          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName(p.name)}</span>
        </button>); })}
    </div>
  );
  if (teams) {
    return (
      <div className="ft-pop" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><SoccerBall size={18} color="var(--gold)" /> Jogo a decorrer</h3>
          <button onClick={() => setTeams(null)} style={{ background: "none", border: "none", color: "#ff9684", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
        </div>
        <button onClick={share} className="ft-btn" style={{ background: "rgba(106,169,224,.14)", border: "1px solid rgba(106,169,224,.3)", color: "var(--blue)", padding: 11 }}><Share2 size={16} /> Partilhar equipas</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["A", "Branco", "bib-white", teams.A], ["B", "Preto", "bib-black", teams.B]].map(([k, label, bib, listv]) => (
            <div key={k} className="ft-card" style={{ padding: 12, borderTop: `3px solid ${k === "A" ? "var(--chalk)" : "#1a2620"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 8 }}><span className={`bib ${bib}`}>{listv.length}</span><span style={{ fontSize: 13, fontWeight: 800 }}>{label}</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{listv.map((p) => <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}><Avatar name={p.name} photo={p.photoUrl} size={20} /> {firstName(p.name)}</div>)}</div>
            </div>
          ))}
        </div>
        <div className="ft-card" style={{ padding: 18 }}>
          <div className="eyebrow" style={{ textAlign: "center", marginBottom: 12 }}>Resultado final</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <input type="number" min="0" value={sa} onChange={(e) => setSa(e.target.value)} placeholder="0" className="num" style={{ width: 64, height: 64, textAlign: "center", fontSize: 30, background: "#0a120f", border: "1px solid var(--line)", borderRadius: 14, color: "var(--chalk)", outline: "none" }} />
            <span style={{ color: "var(--faint)", fontWeight: 300, fontSize: 22 }}>x</span>
            <input type="number" min="0" value={sb} onChange={(e) => setSb(e.target.value)} placeholder="0" className="num" style={{ width: 64, height: 64, textAlign: "center", fontSize: 30, background: "#0a120f", border: "1px solid var(--line)", borderRadius: 14, color: "var(--chalk)", outline: "none" }} />
          </div>
        </div>
        <button onClick={() => setShowStats((s) => !s)} className="ft-btn ft-ghost" style={{ padding: 12, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><SoccerBall size={15} color="var(--grass-bright)" /> Golos & assistências (opcional)</span>
          <span style={{ transform: showStats ? "rotate(90deg)" : "none", transition: "transform .2s" }}><ArrowRight size={16} /></span>
        </button>
        {showStats && (
          <div className="ft-card ft-in" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 28, paddingRight: 4, marginBottom: 4 }}><span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Golos</span><span className="eyebrow" style={{ color: "var(--blue)" }}>Assist</span></div>
            {[...teams.A, ...teams.B].map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderTop: "1px solid var(--line-soft)" }}>
                <Avatar name={p.name} photo={p.photoUrl} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
                <Stepper val={gstats[p.id]?.g || 0} onDec={() => bump(p.id, "g", -1)} onInc={() => bump(p.id, "g", 1)} color="var(--grass-bright)" />
                <Stepper val={gstats[p.id]?.a || 0} onDec={() => bump(p.id, "a", -1)} onInc={() => bump(p.id, "a", 1)} color="var(--blue)" />
              </div>
            ))}
          </div>
        )}
        <button onClick={finish} className="ft-btn ft-grass" style={{ width: "100%", padding: 14 }}>Terminar jogo</button>
      </div>
    );
  }
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ft-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Selecionar - {selected.length}</h3>
          <button onClick={generate} className="ft-btn ft-grass" style={{ fontSize: 12, padding: "8px 14px" }}><Shuffle size={14} /> Criar equipas</button>
        </div>
        <input className="ft-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar jogador..." />
      </div>
      {filt(members).length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8 }}>Membros</div>{Grid(filt(members))}</div>}
      {filt(guests).length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8 }}>Convidados</div>{Grid(filt(guests))}</div>}
    </div>
  );
};

/* ------------------------------ Jogos ------------------------------------ */
const HistoryTab = ({ matches, matchMVP, amIAdmin, me, onVote, onDelete }) => {
  const [voting, setVoting] = useState(null); const [pick, setPick] = useState("");
  if (matches.length === 0) return <div style={{ textAlign: "center", color: "var(--faint)", fontStyle: "italic", padding: 40 }}>Sem jogos registados ainda.</div>;
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {matches.map((m) => {
        const d = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000) : new Date(m.date);
        const hrs = (Date.now() - d.getTime()) / 36e5; const open = hrs < 48; const left = Math.max(0, Math.round(48 - hrs));
        const mvp = matchMVP(m); const myVote = m.mvpVotes?.[me.uid];
        const allp = [...(m.teamA || []), ...(m.teamB || [])];
        const scorers = m.goals ? Object.entries(m.goals).filter(([, v]) => v.g || v.a) : [];
        return (
          <div key={m.id} className="ft-card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ background: "rgba(0,0,0,.25)", padding: "7px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">{d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</span>
              {amIAdmin && <button onClick={() => onDelete(m.id)} className="ft-btn" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Trash2 size={13} /></button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "18px 14px 12px" }}>
              <div style={{ textAlign: "center" }}><span className="bib bib-white" style={{ marginBottom: 6 }}>B</span><div className="num" style={{ fontSize: 44, color: m.scoreA > m.scoreB ? "var(--grass-bright)" : "var(--text)" }}>{m.scoreA}</div></div>
              <span style={{ color: "var(--faint)", fontWeight: 300, fontSize: 18 }}>x</span>
              <div style={{ textAlign: "center" }}><span className="bib bib-black" style={{ marginBottom: 6 }}>P</span><div className="num" style={{ fontSize: 44, color: m.scoreB > m.scoreA ? "var(--grass-bright)" : "var(--text)" }}>{m.scoreB}</div></div>
            </div>
            {scorers.length > 0 && (
              <div style={{ padding: "0 12px 12px", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {scorers.map(([pid, v]) => { const nm = firstName(allp.find((p) => p.id === pid)?.name || "?"); return (<span key={pid} style={{ fontSize: 11, color: "var(--dim)", background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 10px" }}>{nm}{v.g ? <b style={{ color: "var(--grass-bright)" }}> {v.g}G</b> : ""}{v.a ? <b style={{ color: "var(--blue)" }}> {v.a}A</b> : ""}</span>); })}
              </div>
            )}
            <div style={{ background: "rgba(0,0,0,.2)", borderTop: "1px solid var(--line)", padding: 12, minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!open ? (mvp ? <div className="ft-pop" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gold)" }}><Trophy size={15} style={{ fill: "var(--gold)" }} /><span style={{ fontSize: 13, fontWeight: 700 }}>MVP: {firstName(mvp.name)} - {mvp.votes} votos</span></div> : <span style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>Votação encerrada</span>)
                : myVote ? <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "var(--grass-bright)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Check size={11} /> Voto registado</div><div style={{ fontSize: 10, color: "var(--faint)" }}>Resultado em {left}h</div></div>
                  : voting === m.id ? <div style={{ display: "flex", gap: 8, width: "100%" }}><select value={pick} onChange={(e) => setPick(e.target.value)} className="ft-input" style={{ padding: 8, fontSize: 12 }}><option value="">Quem foi o craque?</option>{allp.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={() => { if (pick) { onVote(m.id, pick); setVoting(null); setPick(""); } }} className="ft-btn" style={{ background: "var(--gold)", color: "#1a1300", padding: "0 16px", fontSize: 12 }}>Votar</button></div>
                    : <button onClick={() => setVoting(m.id)} className="ft-btn" style={{ background: "none", color: "var(--gold)", fontSize: 12, fontWeight: 700 }}><Star size={13} /> Votar MVP · faltam {left}h</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ----------------------------- Carreira ---------------------------------- */
const TrophiesTab = ({ myProfile, amIAdmin, avg, mvpCount, fixedIds, players, matches }) => {
  const s = myProfile?.stats || {};
  const winRate = s.games ? s.wins / s.games : 0;
  const scorerMap = useMemo(() => { const map = {}; matches.forEach((m) => Object.entries(m.goals || {}).forEach(([pid, v]) => { if (!map[pid]) map[pid] = { g: 0, a: 0 }; map[pid].g += v.g || 0; map[pid].a += v.a || 0; })); return map; }, [matches]);
  const mine = scorerMap[myProfile?.id] || { g: 0, a: 0 };
  const top = Object.entries(scorerMap).map(([pid, v]) => ({ pid, ...v, name: players.find((p) => p.id === pid)?.name })).filter((x) => x.name).sort((a, b) => b.g - a.g || b.a - a.a).slice(0, 5);
  const ach = [
    { ok: s.games >= 50, Icon: Trophy, c: "var(--gold)", t: "Lenda do clube", d: "+50 jogos realizados" },
    { ok: s.games >= 10, Icon: Medal, c: "var(--blue)", t: "Veterano", d: "+10 jogos realizados" },
    { ok: winRate > 0.6 && s.games >= 5, Icon: Flame, c: "#ff8a4c", t: "Imparavel", d: "+60% vitorias (min. 5 jogos)" },
    { ok: mine.g >= 10, Icon: SoccerBall, c: "var(--grass-bright)", t: "Goleador", d: "+10 golos marcados" },
    { ok: fixedIds.includes(myProfile?.id), Icon: ShieldCheck, c: "var(--grass-bright)", t: "Membro fixo", d: "Inscrito na época/mês atual" },
  ];
  const Stat = ({ label, value, color }) => (<div className="ft-raised" style={{ borderRadius: 12, padding: 10, textAlign: "center" }}><div className="eyebrow" style={{ color: color || "var(--faint)" }}>{label}</div><div className="num" style={{ fontSize: 22, color: color || "var(--text)" }}>{value}</div></div>);
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ft-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
        <Trophy size={120} style={{ position: "absolute", top: -10, right: -10, color: "var(--gold)", opacity: .06 }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ margin: "0 auto 10px", width: 84, height: 84 }}><Avatar name={myProfile?.name || "Eu"} photo={myProfile?.photoUrl} size={84} /></div>
          <h2 className="num" style={{ fontSize: 24, color: "var(--chalk)", margin: 0 }}>{(myProfile?.name || "EU").toUpperCase()}</h2>
          <p className="eyebrow" style={{ marginTop: 4, marginBottom: 18 }}>Estatísticas de carreira</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            <Stat label="Jogos" value={s.games || 0} /><Stat label="Vitorias" value={s.wins || 0} color="var(--grass-bright)" /><Stat label="Win %" value={`${Math.round(winRate * 100)}%`} color="var(--blue)" />
            <Stat label="Golos" value={mine.g} color="var(--grass-bright)" /><Stat label="Assist." value={mine.a} color="var(--blue)" /><Stat label="MVPs" value={mvpCount(myProfile?.id)} color="var(--gold)" />
          </div>
          {amIAdmin && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(106,169,224,.1)", border: "1px solid rgba(106,169,224,.3)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "var(--blue)" }}><Star size={12} style={{ fill: "var(--blue)" }} /> Rating médio: {avg(myProfile || { votes: {} })}</div>}
        </div>
      </div>
      <div className="ft-card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}><SoccerBall size={16} color="var(--grass-bright)" /> Melhores marcadores</h3>
        {top.length === 0 ? <p style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic", margin: 0 }}>Ainda sem golos registados.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top.map((p, i) => (
              <div key={p.pid} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="num" style={{ width: 22, textAlign: "center", fontSize: 16, color: i === 0 ? "var(--gold)" : "var(--faint)" }}>{i + 1}</span>
                <Avatar name={p.name} size={30} /><span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{firstName(p.name)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--grass-bright)" }}>{p.g}G</span><span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>{p.a}A</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="ft-card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Award size={16} style={{ color: "var(--gold)" }} /> Conquistas</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ach.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, border: "1px solid", borderColor: a.ok ? "rgba(245,197,66,.25)" : "var(--line)", background: a.ok ? "linear-gradient(90deg,rgba(245,197,66,.08),transparent)" : "rgba(0,0,0,.15)", opacity: a.ok ? 1 : .45, filter: a.ok ? "none" : "grayscale(1)" }}>
              <div style={{ padding: 9, borderRadius: "50%", background: "#0a120f", border: "1px solid var(--line)" }}><a.Icon size={17} color={a.c} style={{ color: a.c }} /></div>
              <div style={{ textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{a.t}</div><div style={{ fontSize: 10, color: "var(--dim)" }}>{a.d}</div></div>
              {a.ok && <CheckCircle size={16} style={{ marginLeft: "auto", color: "var(--grass-bright)" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --------------------------- Inscricoes ---------------------------------- */
const MembersTab = ({ fixedIds, players, myProfile, paymentModel, onSignUp, onSignOut }) => {
  const season = paymentModel === "season";
  const inscrito = fixedIds.includes(myProfile?.id);
  return (
    <div className="ft-in ft-card" style={{ padding: 22, maxWidth: 480, margin: "0 auto" }}>
      <h3 style={{ textAlign: "center", fontSize: 14, fontWeight: 800, display: "flex", justifyContent: "center", gap: 8, margin: "0 0 4px" }}><ClipboardList size={18} style={{ color: "var(--grass-bright)" }} /> {season ? "Inscrições da época" : "Inscrições mensais"}</h3>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--dim)", margin: "0 0 18px" }}>{season ? "Inscreve-te como fixo desta época." : "Inscreve-te como fixo deste mês."}</p>
      {!myProfile ? <p style={{ textAlign: "center", fontSize: 12, color: "var(--faint)" }}>Entra primeiro no plantel.</p> : inscrito
        ? <button onClick={onSignOut} className="ft-btn ft-danger" style={{ width: "100%", padding: 12, marginBottom: 18 }}>Cancelar inscrição</button>
        : <button onClick={onSignUp} className="ft-btn ft-grass" style={{ width: "100%", padding: 12, marginBottom: 18 }}>Inscrever-me</button>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fixedIds.map((id) => { const p = players.find((pl) => pl.id === id); return p ? (<div key={id} className="ft-raised" style={{ borderRadius: 12, padding: 10, display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p.name} photo={p.photoUrl} size={32} /><span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>{id === myProfile?.id && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "var(--grass-bright)", background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)", padding: "3px 8px", borderRadius: 8 }}>Eu</span>}</div>) : null; })}
      </div>
    </div>
  );
};

/* ----------------------------- Tesouraria -------------------------------- */
const TreasuryTab = ({ players, matches, collectsFixed, fixedIds, payments, fixedFee, fee, fixedLabel, totalRevenue, totalDebt, currentMonth, setCurrentMonth, paymentModel, onPayFixed, onPayMatch }) => {
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

/* ----------------------------- Definicoes -------------------------------- */
const SettingsTab = ({ settings, next, isOwner, amIAdmin, onSave, onLeave, onDelete }) => {
  const [model, setModel] = useState(settings.paymentModel || "monthly");
  const [monthlyFee, setMonthlyFee] = useState(settings.monthlyFee ?? 0);
  const [seasonFee, setSeasonFee] = useState(settings.seasonFee ?? 0);
  const [guestFee, setGuestFee] = useState(settings.guestFee ?? 4.5);
  const [date, setDate] = useState(next?.date ? new Date(next.date).toISOString().slice(0, 10) : "");
  const [time, setTime] = useState(next?.date ? new Date(next.date).toTimeString().slice(0, 5) : "21:00");
  const [freq, setFreq] = useState(next?.frequency || "weekly");
  const [locationUrl, setLocationUrl] = useState(settings.locationUrl || "");
  const [leagueModeLocal, setLeagueModeLocal] = useState(settings.leagueMode === true);
  useEffect(() => { setLeagueModeLocal(settings.leagueMode === true); }, [settings.leagueMode]);
  const Label = ({ children }) => <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>{children}</label>;
  const MODELS = [["pergame", "Jogo-a-jogo"], ["monthly", "Mensal"], ["season", "Epoca"]];
  const save = () => onSave({ paymentModel: model, monthlyFee, seasonFee, guestFee, date, time, freq, locationUrl, leagueMode: leagueModeLocal });
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 16px", alignItems: "center" }}><Wallet size={17} style={{ color: "var(--blue)" }} /> Modelo de pagamento</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)", marginBottom: 14 }}>
            {MODELS.map(([v, l]) => <button key={v} onClick={() => setModel(v)} className="ft-btn" style={{ padding: "9px 4px", fontSize: 12, background: model === v ? "var(--grass)" : "none", color: model === v ? "#04130a" : "var(--faint)" }}>{l}</button>)}
          </div>
          <p style={{ fontSize: 11, color: "var(--dim)", margin: "0 0 14px" }}>
            {model === "pergame" && "Todos pagam um valor por cada jogo."}
            {model === "monthly" && "Os fixos pagam uma mensalidade; convidados pagam por jogo."}
            {model === "season" && "Os fixos pagam uma vez por toda a época; convidados pagam por jogo."}
          </p>
          {model === "monthly" && <div style={{ marginBottom: 14 }}><Label>Valor da mensalidade (EUR)</Label><input type="number" step="0.50" className="ft-input" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} /></div>}
          {model === "season" && <div style={{ marginBottom: 14 }}><Label>Valor da época (EUR)</Label><input type="number" step="1" className="ft-input" value={seasonFee} onChange={(e) => setSeasonFee(e.target.value)} /></div>}
          <Label>Preço por jogo ({model === "pergame" ? "todos" : "convidados"}) (EUR)</Label>
          <input type="number" step="0.10" className="ft-input" value={guestFee} onChange={(e) => setGuestFee(e.target.value)} />
        </div>
      )}
      {amIAdmin && (
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
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 10px", alignItems: "center" }}><Swords size={17} style={{ color: "var(--gold)" }} /> Modo liga</h3>
          <p style={{ fontSize: 11, color: "var(--dim)", margin: "0 0 14px" }}>Ativa separadores exclusivos para gerir jogos oficiais, calendário da liga e convocatórias.</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a120f", border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>Modo Liga</div><div style={{ fontSize: 10, color: leagueModeLocal ? "var(--grass-bright)" : "var(--faint)" }}>{leagueModeLocal ? "Ativo" : "Inativo"}</div></div>
            <button onClick={() => setLeagueModeLocal((v) => !v)} className="ft-btn" style={{ fontSize: 12, padding: "7px 14px", background: leagueModeLocal ? "var(--grass)" : "var(--raised)", color: leagueModeLocal ? "#04130a" : "var(--faint)", border: "1px solid var(--line)" }}>{leagueModeLocal ? "Ativo" : "Inativo"}</button>
          </div>
        </div>
      )}
      {amIAdmin && <button onClick={save} className="ft-btn" style={{ width: "100%", background: "var(--blue)", color: "#04101c", padding: 13 }}><Save size={18} /> Guardar definições</button>}
      <div style={{ border: "1px solid rgba(240,86,58,.3)", background: "rgba(240,86,58,.05)", borderRadius: 18, padding: 20, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ff9684", fontWeight: 800, marginBottom: 10 }}><ShieldAlert size={18} /> Zona de perigo</div>
        <p style={{ fontSize: 13, color: "#ffb3a5", margin: "0 0 14px" }}>{isOwner ? "Como dono, podes apagar este grupo permanentemente. Esta acao e irreversivel." : "Se saires do grupo, deixas de receber convocatorias. O historico e mantido."}</p>
        <button onClick={isOwner ? onDelete : onLeave} className="ft-btn ft-danger" style={{ width: "100%", padding: 13 }}>{isOwner ? <><Trash2 size={17} /> Apagar grupo</> : <><LogOut size={17} /> Sair do grupo</>}</button>
      </div>
    </div>
  );
};

/* ============================ DASHBOARD ================================== */
const GroupDashboard = ({ group, currentUser, onBack }) => {
  const [tab, setTab] = useState("schedule");
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [nextGame, setNextGame] = useState(null);
  const [settings, setSettings] = useState({ paymentModel: "monthly", monthlyFee: 0, seasonFee: 0, guestFee: 4.5, locationUrl: "" });
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fixedIds, setFixedIds] = useState([]);
  const [payments, setPayments] = useState({});
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [copied, setCopied] = useState(false);
  const [lastReadTs, setLastReadTs] = useState(() => {
    try { return parseInt(localStorage.getItem(`lastRead_${group.id}`) || "0"); } catch { return 0; }
  });
  const [leagueGames, setLeagueGames] = useState([]);
  const [trainings, setTrainings] = useState([]);

  const me = currentUser;
  const groupRef = (col) => collection(db, "artifacts", APP_ID, "groups", group.id, col);
  const groupDoc = (col, id) => doc(db, "artifacts", APP_ID, "groups", group.id, col, id);
  const isOwner = group.ownerId === me.uid;
  const myProfile = players.find((p) => p.uid === me.uid);
  const amIAdmin = isOwner || (myProfile && myProfile.isAdmin);
  const showToast = (msg, type = "success") => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 2400); };

  const collectsFixed = settings.paymentModel !== "pergame";
  const fixedFee = settings.paymentModel === "season" ? Number(settings.seasonFee) || 0 : Number(settings.monthlyFee) || 0;
  const fixedLabel = settings.paymentModel === "season" ? "Inscrição da época" : "Mensalidade";
  const fee = Number(settings.guestFee) || 0;
  const periodKey = settings.paymentModel === "season" ? "season" : `month_${currentMonth}`;

  useEffect(() => {
    const unsubP = onSnapshot(groupRef("players"), (s) => setPlayers(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubM = onSnapshot(query(groupRef("matches"), orderBy("createdAt", "desc")), (s) => setMatches(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubMsg = onSnapshot(query(groupRef("messages"), orderBy("createdAt", "asc")), (s) => setMessages(s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, ts: x.createdAt?.seconds ? x.createdAt.seconds * 1000 : Date.now() }; })));
    const unsubG = onSnapshot(groupDoc("schedule", "next"), (s) => { if (s.exists()) setNextGame(s.data()); else setNextGame({ date: new Date().toISOString(), responses: {} }); });
    const unsubGroup = onSnapshot(doc(db, "artifacts", APP_ID, "groups", group.id), (s) => {
      if (s.exists()) { const d = s.data(); const st = d.settings || {}; setSettings({ paymentModel: st.paymentModel || "monthly", monthlyFee: st.monthlyFee ?? 0, seasonFee: st.seasonFee ?? 0, guestFee: st.guestFee ?? 4.5, locationUrl: d.locationUrl || "", leagueMode: st.leagueMode === true, groupMode: st.groupMode || "casual" }); }
    });
    const unsubLG = onSnapshot(query(groupRef("leagueGames"), orderBy("date", "asc")), (s) => setLeagueGames(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubTr = onSnapshot(query(groupRef("trainings"), orderBy("date", "asc")), (s) => setTrainings(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { unsubP(); unsubM(); unsubMsg(); unsubG(); unsubGroup(); unsubLG(); unsubTr(); };
  }, [group.id]);

  useEffect(() => {
    const unsub = onSnapshot(groupDoc("treasury", periodKey), (s) => { if (s.exists()) { const d = s.data(); setFixedIds(Array.isArray(d.fixedIds) ? d.fixedIds : []); setPayments(d.payments || {}); } else { setFixedIds([]); setPayments({}); } });
    return () => unsub();
  }, [group.id, periodKey]);

  useEffect(() => {
    if (players.length === 0) return;
    const mine = players.find((p) => p.uid === me.uid); if (!mine) return;
    (async () => {
      try {
        const ud = await getDoc(doc(db, "artifacts", APP_ID, "users", me.uid));
        if (!ud.exists()) return;
        const d = ud.data(); const photo = d.photoUrl || me.photoURL; const name = d.name || me.displayName;
        const up = {}; if (mine.photoUrl !== photo) up.photoUrl = photo; if (mine.name !== name && mine.type !== "guest") up.name = name;
        if (Object.keys(up).length) await updateDoc(groupDoc("players", mine.id), up);
      } catch (e) { /* noop */ }
    })();
  }, [players.length, me.uid]);

  useEffect(() => {
    if (!nextGame?.date || !nextGame.frequency || nextGame.frequency === "once" || !amIAdmin) return;
    const gd = new Date(nextGame.date); const now = new Date(); const tol = 864e5;
    if (now.getTime() > gd.getTime() + tol) {
      const nd = new Date(gd); const step = nextGame.frequency === "biweekly" ? 14 : 7;
      while (nd.getTime() + tol < now.getTime()) nd.setDate(nd.getDate() + step);
      if (nd.getTime() !== gd.getTime()) setDoc(groupDoc("schedule", "next"), { date: nd.toISOString(), frequency: nextGame.frequency, responses: {} }, { merge: true });
    }
  }, [nextGame, amIAdmin]);

  const avg = (p) => { const v = Object.values(p.votes || {}); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : 3; };
  const matchMVP = (m) => { if (!m.mvpVotes) return null; const c = {}; Object.values(m.mvpVotes).forEach((id) => (c[id] = (c[id] || 0) + 1)); let mx = 0, win = null; Object.entries(c).forEach(([id, n]) => { if (n > mx) { mx = n; win = id; } }); const p = players.find((pl) => pl.id === win); return p ? { ...p, votes: mx } : null; };
  const mvpCount = (pid) => matches.filter((m) => matchMVP(m)?.id === pid).length;
  const playerDebt = (pid) => { let t = 0; if (collectsFixed && fixedIds.includes(pid) && !payments[pid]) t += fixedFee; matches.forEach((m) => { if (m.payments?.[pid] === false) t += fee; }); return t; };
  const totalDebt = players.reduce((s, p) => s + playerDebt(p.id), 0);
  const guestRevenue = matches.reduce((s, m) => s + (m.payments ? Object.values(m.payments).filter((v) => v === true).length * fee : 0), 0);
  const fixedRevenue = collectsFixed ? fixedIds.filter((id) => payments[id]).length * fixedFee : 0;
  const totalRevenue = guestRevenue + fixedRevenue;
  const members = players.filter((p) => p.type !== "guest");
  const guests = players.filter((p) => p.type === "guest");

  // badges de notificacao in-app
  const unreadChat = messages.filter((m) => m.uid !== me.uid && (m.ts || 0) > lastReadTs).length;
  const pendingRsvp = nextGame?.date && !nextGame?.responses?.[me.uid] ? 1 : 0;
  const myDebt = playerDebt(myProfile?.id || "") > 0 ? 1 : 0;
  const markChatRead = () => {
    const now = Date.now();
    setLastReadTs(now);
    try { localStorage.setItem(`lastRead_${group.id}`, String(now)); } catch { /* noop */ }
  };

  const toggleSchedule = async (status) => { await setDoc(groupDoc("schedule", "next"), { date: nextGame?.date || new Date().toISOString(), responses: { ...(nextGame?.responses || {}), [me.uid]: status } }, { merge: true }); showToast(status === "going" ? "Confirmado! Bora 💪" : "Removido da convocatória"); };
  const sendMessage = async (text) => { await addDoc(groupRef("messages"), { uid: me.uid, name: myProfile?.name || me.displayName || "Jogador", photoUrl: myProfile?.photoUrl || me.photoURL || null, text, createdAt: serverTimestamp() }); };
  const groupMode = settings.groupMode || "casual";
  const isLeague = groupMode === "league";
  const isWeekly = groupMode === "weekly";
  const addTraining = async ({ date, local }) => { await addDoc(groupRef("trainings"), { date, local, responses: {}, createdAt: serverTimestamp() }); showToast("Treino marcado!"); };
  const deleteTraining = async (id) => { if (window.confirm("Apagar treino?")) await deleteDoc(groupDoc("trainings", id)); };
  const toggleTraining = async (id, status) => { const t = trainings.find((x) => x.id === id); await updateDoc(groupDoc("trainings", id), { responses: { ...(t?.responses || {}), [me.uid]: status } }); showToast(status === "going" ? "Confirmado!" : "Removido"); };
  const isLeagueMode = settings.leagueMode === true;
  const addLeagueGame = async ({ opponent, date, home }) => { await addDoc(groupRef("leagueGames"), { opponent, date, home, scoreA: null, scoreB: null, lineup: null, createdAt: serverTimestamp() }); showToast("Jogo adicionado ao calendário!"); };
  const deleteLeagueGame = async (id) => { if (window.confirm("Apagar jogo da liga?")) await deleteDoc(groupDoc("leagueGames", id)); };
  const saveLeagueResult = async (id, scoreA, scoreB) => { await updateDoc(groupDoc("leagueGames", id), { scoreA, scoreB }); showToast("Resultado guardado!"); };
  const saveLineup = async (gameId, data) => { await updateDoc(groupDoc("leagueGames", gameId), { lineup: data }); showToast("Convocatoria guardada!"); };

  const addPlayer = async ({ name, type, hostId }) => { let finalName = name; if (type === "guest" && hostId) { const h = players.find((p) => p.id === hostId); if (h) finalName = `${name} (C - ${firstName(h.name)})`; } await addDoc(groupRef("players"), { name: finalName, type, hostId: hostId || null, stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: false, votes: {}, createdAt: serverTimestamp() }); showToast("Jogador adicionado!"); };
  const joinAsPlayer = async () => { if (players.find((p) => p.uid === me.uid)) return showToast("Já estás no plantel!", "error"); let photo = me.photoURL; try { const ud = await getDoc(doc(db, "artifacts", APP_ID, "users", me.uid)); if (ud.exists()) photo = ud.data().photoUrl || photo; } catch (e) { /* noop */ } await addDoc(groupRef("players"), { name: me.displayName || "Eu", uid: me.uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: isOwner, photoUrl: photo, votes: {}, createdAt: serverTimestamp() }); showToast("Entraste no plantel!"); };
  const ratePlayer = async (p, r) => { await updateDoc(groupDoc("players", p.id), { votes: { ...(p.votes || {}), [me.uid]: r } }); showToast("Avaliação registada!"); };
  const removePlayer = async (p) => { if (!amIAdmin) return; if (window.confirm(`Eliminar ${p.name}?`)) await deleteDoc(groupDoc("players", p.id)); };
  const toggleAdmin = async (p) => { if (!isOwner || p.uid === group.ownerId) return; await updateDoc(groupDoc("players", p.id), { isAdmin: !p.isAdmin }); showToast("Admin alterado"); };
  const deleteMatch = async (id) => { if (!amIAdmin) return; if (window.confirm("Apagar jogo?")) await deleteDoc(groupDoc("matches", id)); };
  const submitMvp = async (mid, pid) => { const m = matches.find((x) => x.id === mid); await updateDoc(groupDoc("matches", mid), { mvpVotes: { ...(m.mvpVotes || {}), [me.uid]: pid } }); showToast("Voto registado!"); };
  const signUp = async () => { if (!myProfile || fixedIds.includes(myProfile.id)) return; await setDoc(groupDoc("treasury", periodKey), { fixedIds: [...fixedIds, myProfile.id], payments }, { merge: true }); showToast("Inscrito como fixo!"); };
  const signOutFixed = async () => { if (!myProfile) return; await setDoc(groupDoc("treasury", periodKey), { fixedIds: fixedIds.filter((id) => id !== myProfile.id), payments }, { merge: true }); showToast("Inscrição cancelada"); };
  const payFixed = async (pid) => { await setDoc(groupDoc("treasury", periodKey), { payments: { ...payments, [pid]: true } }, { merge: true }); showToast(`${fixedLabel} paga!`); };
  const payMatch = async (mid, pid) => { const m = matches.find((x) => x.id === mid); await updateDoc(groupDoc("matches", mid), { payments: { ...(m.payments || {}), [pid]: true } }); showToast("Jogo pago!"); };

  const saveMatch = async ({ teamA, teamB, scoreA, scoreB, goals }) => {
    if (nextGame?.frequency && nextGame.frequency !== "once" && nextGame.date) {
      const nd = new Date(nextGame.date); nd.setDate(nd.getDate() + (nextGame.frequency === "biweekly" ? 14 : 7));
      await setDoc(groupDoc("schedule", "next"), { date: nd.toISOString(), frequency: nextGame.frequency, responses: {} }, { merge: true });
    }
    const pays = {}; [...teamA, ...teamB].forEach((p) => { if (collectsFixed ? !fixedIds.includes(p.id) : true) pays[p.id] = false; });
    await addDoc(groupRef("matches"), { date: new Date().toISOString(), scoreA, scoreB, teamA: teamA.map((p) => ({ id: p.id, name: p.name })), teamB: teamB.map((p) => ({ id: p.id, name: p.name })), mvpVotes: {}, goals: goals || {}, payments: pays, createdAt: serverTimestamp() });
    const w = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "draw";
    const upd = (p, res) => { const s = { games: 0, wins: 0, draws: 0, losses: 0, ...(p.stats || {}) }; s.games++; if (res === "win") s.wins++; else if (res === "draw") s.draws++; else s.losses++; return updateDoc(groupDoc("players", p.id), { stats: s }); };
    await Promise.all([...teamA.map((p) => upd(p, w === "A" ? "win" : w === "draw" ? "draw" : "loss")), ...teamB.map((p) => upd(p, w === "B" ? "win" : w === "draw" ? "draw" : "loss"))]);
    showToast("Jogo guardado! Próxima data atualizada."); setTab("history");
  };

  const saveSettings = async ({ paymentModel, monthlyFee, seasonFee, guestFee, date, time, freq, locationUrl, leagueMode }) => {
    const sched = {}; if (date && time) sched.date = `${date}T${time}:00`; if (freq) sched.frequency = freq;
    if (Object.keys(sched).length) await setDoc(groupDoc("schedule", "next"), sched, { merge: true });
    const gUpdate = { settings: { paymentModel, monthlyFee: parseFloat(monthlyFee) || 0, seasonFee: parseFloat(seasonFee) || 0, guestFee: parseFloat(guestFee) || 0, leagueMode: !!leagueMode } };
    if (locationUrl) { gUpdate.locationUrl = locationUrl; const c = getCoordsFromUrl(locationUrl); if (c) gUpdate.location = c; }
    await updateDoc(doc(db, "artifacts", APP_ID, "groups", group.id), gUpdate); showToast("Definições guardadas!");
  };
  const leaveGroup = async () => { if (isOwner) return; if (window.confirm("Sair do grupo?")) { await updateDoc(doc(db, "artifacts", APP_ID, "groups", group.id), { members: arrayRemove(me.uid) }); onBack(); } };
  const deleteGroup = async () => { if (window.confirm("Apagar grupo para sempre?")) { await deleteDoc(doc(db, "artifacts", APP_ID, "groups", group.id)); onBack(); } };
  const copyInvite = () => { navigator.clipboard?.writeText(group.id).then(() => { setCopied(true); showToast("Código copiado!"); setTimeout(() => setCopied(false), 1800); }).catch(() => showToast("Erro", "error")); };

  const TABS = [
    { id: "schedule", icon: CalendarCheck, label: "Agenda", badge: pendingRsvp },
    { id: "chat", icon: MessageSquare, label: "Chat", badge: tab === "chat" ? 0 : unreadChat },
    ...(!isLeague ? [{ id: "team", icon: Shield, label: "Equipa" }] : []),
    { id: "tactics", icon: TacticIcon, label: "Tatica" },
    { id: "players", icon: Users, label: "Plantel" },
    { id: "history", icon: HistoryIcon, label: "Jogos" },
    { id: "trophies", icon: Trophy, label: "Carreira" },
    ...(isLeague ? [{ id: "leaguecal", icon: ListOrdered, label: "Liga" }] : []),
    ...(isLeague ? [{ id: "lineup", icon: Swords, label: "Convoc." }] : []),
    ...(isLeague ? [{ id: "training", icon: Dumbbell, label: "Treinos" }] : []),
    ...(collectsFixed && !isLeague ? [{ id: "members", icon: ClipboardList, label: "Inscricoes" }] : []),
    ...(amIAdmin ? [{ id: "treasury", icon: Wallet, label: "Tesouraria", badge: myDebt }] : []),
    { id: "settings", icon: Settings, label: "Definicoes" },
  ];
  useEffect(() => { if (!TABS.find((t) => t.id === tab)) setTab("schedule"); }, [collectsFixed, amIAdmin]); // eslint-disable-line

  return (
    <div className="ft-in" style={{ minHeight: "100vh", paddingBottom: 96 }}>
      <Toast toast={toast} />
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(13,20,17,.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} className="ft-btn ft-ghost" style={{ padding: 9, borderRadius: 12 }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 7 }}><Users size={17} style={{ color: "var(--grass-bright)" }} /> {group.name}</h2>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isOwner && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", padding: "4px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Crown size={10} /> Dono</span>}
          <button onClick={copyInvite} className="ft-btn ft-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copiado" : "Convidar"}</button>
        </div>
      </div>

      <div style={{ padding: tab === "chat" || tab === "tactics" ? 0 : 16, maxWidth: tab === "chat" ? 620 : 480, margin: "0 auto" }}>
        {tab === "schedule" && !isLeague && <ScheduleTab next={nextGame} players={players} me={me} locationUrl={settings.locationUrl} onToggle={toggleSchedule} />}
        {tab === "schedule" && isLeague && <LeagueScheduleTab leagueGames={leagueGames} me={me} players={players} />}
        {tab === "chat" && <ChatTab messages={messages} me={me} onSend={sendMessage} onMarkRead={markChatRead} />}
        {tab === "leaguecal" && isLeague && <LeagueCalendarTab leagueGames={leagueGames} members={members} amIAdmin={amIAdmin} onAdd={addLeagueGame} onDelete={deleteLeagueGame} onResult={saveLeagueResult} />}
        {tab === "lineup" && isLeague && <LineupTab members={members} amIAdmin={amIAdmin} leagueGames={leagueGames} onSaveLineup={saveLineup} />}
        {tab === "training" && <TrainingTab trainings={trainings} me={me} amIAdmin={amIAdmin} onAdd={addTraining} onDelete={deleteTraining} onToggle={toggleTraining} />}
        {tab === "team" && !isLeague && <TeamTab players={players} next={nextGame} avg={avg} onSaveMatch={saveMatch} showToast={showToast} />}
        {tab === "tactics" && !isLeague && <TacticsTab members={members} showToast={showToast} />}
        {tab === "tactics" && isLeague && <TacticsLeagueTab members={members} leagueGames={leagueGames} showToast={showToast} />}
        {tab === "players" && <PlayersTab members={members} guests={guests} players={players} me={me} amIAdmin={amIAdmin} isOwner={isOwner} ownerId={group.ownerId} avg={avg} onAdd={addPlayer} onJoin={joinAsPlayer} onRate={ratePlayer} onRemove={removePlayer} onToggleAdmin={toggleAdmin} />}
        {tab === "history" && <HistoryTab matches={matches} matchMVP={matchMVP} amIAdmin={amIAdmin} me={me} onVote={submitMvp} onDelete={deleteMatch} />}
        {tab === "trophies" && <TrophiesTab myProfile={myProfile} amIAdmin={amIAdmin} avg={avg} mvpCount={mvpCount} fixedIds={fixedIds} players={players} matches={matches} />}
        {tab === "members" && collectsFixed && <MembersTab fixedIds={fixedIds} players={players} myProfile={myProfile} paymentModel={settings.paymentModel} onSignUp={signUp} onSignOut={signOutFixed} />}
        {tab === "treasury" && amIAdmin && <TreasuryTab players={players} matches={matches} collectsFixed={collectsFixed} fixedIds={fixedIds} payments={payments} fixedFee={fixedFee} fee={fee} fixedLabel={fixedLabel} totalRevenue={totalRevenue} totalDebt={totalDebt} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} paymentModel={settings.paymentModel} onPayFixed={payFixed} onPayMatch={payMatch} />}
        {tab === "settings" && <SettingsTab settings={settings} next={nextGame} isOwner={isOwner} amIAdmin={amIAdmin} onSave={saveSettings} onLeave={leaveGroup} onDelete={deleteGroup} />}
      </div>

      <BottomNav items={TABS.map((t) => ({ ...t, active: tab === t.id, onClick: () => setTab(t.id) }))} />
    </div>
  );
};

/* ============================ GROUP SELECTOR ============================= */
const GroupSelector = ({ user, onLogout }) => {
  const [view, setView] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState("");
  const [groupMode, setGroupMode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "artifacts", APP_ID, "groups"), where("members", "array-contains", user.uid));
    return onSnapshot(q, (s) => { const list = s.docs.map((d) => ({ id: d.id, ...d.data() })); list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); setGroups(list); });
  }, [user]);

  const createGroup = async (e) => {
    e.preventDefault(); if (!newGroup.trim()) return; setCreateError("");
    const customId = newGroup.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!customId) return setCreateError("Nome inválido para criar ID.");
    try {
      const groupRef = doc(db, "artifacts", APP_ID, "groups", customId);
      if ((await getDoc(groupRef)).exists()) return setCreateError("Já existe um grupo com esse nome. Tenta outro.");
      const batch = writeBatch(db);
      batch.set(groupRef, { name: newGroup, ownerId: user.uid, members: [user.uid], settings: { paymentModel: groupMode === "weekly" ? "monthly" : "pergame", monthlyFee: 0, seasonFee: 0, guestFee: 4.5, groupMode: groupMode || "casual", leagueMode: groupMode === "league" }, createdAt: serverTimestamp() });
      const playerRef = doc(collection(db, "artifacts", APP_ID, "groups", customId, "players"));
      batch.set(playerRef, { name: user.displayName || "Eu", uid: user.uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: true, photoUrl: user.photoURL || null, votes: {}, createdAt: serverTimestamp() });
      await batch.commit();
      setNewGroup("");
    } catch (err) { console.error(err); setCreateError("Erro ao criar grupo: " + err.message); }
  };

  const joinGroup = async (e) => {
    e.preventDefault(); if (!joinCode.trim()) return; setMsg("");
    try {
      const id = joinCode.trim(); const ref = doc(db, "artifacts", APP_ID, "groups", id); const snap = await getDoc(ref);
      if (!snap.exists()) return setMsg("Grupo não encontrado. Verifica o código.");
      const data = snap.data();
      if (data.members?.includes(user.uid)) return setMsg("Já pertences a este grupo!");
      await updateDoc(ref, { members: arrayUnion(user.uid) });
      const pq = query(collection(db, "artifacts", APP_ID, "groups", id, "players"), where("uid", "==", user.uid));
      if ((await getDocs(pq)).empty) {
        let name = user.displayName || "Novo Jogador", photo = user.photoURL;
        try { const ud = await getDoc(doc(db, "artifacts", APP_ID, "users", user.uid)); if (ud.exists()) { const d = ud.data(); if (d.name) name = d.name; if (d.photoUrl) photo = d.photoUrl; } } catch (e) { /* noop */ }
        await addDoc(collection(db, "artifacts", APP_ID, "groups", id, "players"), { name, uid: user.uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: false, photoUrl: photo, votes: {}, createdAt: serverTimestamp() });
      }
      setMsg("Entraste no grupo!"); setJoinCode("");
    } catch (err) { console.error(err); setMsg("Erro ao entrar."); }
  };

  if (selected) return <GroupDashboard group={selected} currentUser={user} onBack={() => setSelected(null)} />;
  if (view === "profile") {
    return (
      <div style={{ minHeight: "100vh" }}>
        <UserProfile user={user} onLogout={onLogout} />
        <BottomNav items={[{ id: "groups", icon: LayoutGrid, label: "Grupos", active: false, onClick: () => setView("groups") }, { id: "profile", icon: User, label: "Perfil", active: true, onClick: () => setView("profile") }]} />
      </div>
    );
  }
  return (
    <div className="ft-in" style={{ minHeight: "100vh", padding: "20px 16px 110px", maxWidth: 880, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--grass-bright)" }}>Balneario</div>
          <h1 className="num" style={{ fontSize: 30, margin: "2px 0 0", color: "var(--chalk)" }}>OS TEUS GRUPOS</h1>
          <p style={{ fontSize: 13, color: "var(--dim)", margin: "4px 0 0" }}>Olá, <b style={{ color: "var(--text)" }}>{user.displayName || "Jogador"}</b></p>
        </div>
        <button onClick={() => setView("profile")} className="ft-btn" style={{ background: "none", padding: 0 }}><Avatar name={user.displayName || "Eu"} photo={user.photoURL} size={44} /></button>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 26 }}>
        <div className="ft-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}><PlusCircle size={16} style={{ color: "var(--grass-bright)" }} /> Criar grupo</h2>
          {!groupMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, color: "var(--dim)", margin: "0 0 6px" }}>Qual é o tipo de grupo?</p>
              {[
                { id: "casual", Icon: Zap, color: "var(--blue)", bg: "rgba(106,169,224,.15)", label: "Casual", sub: "Jogamos de vez em quando, sem calendário fixo" },
                { id: "weekly", Icon: CalendarCheck, color: "var(--grass-bright)", bg: "rgba(34,197,94,.15)", label: "Semanal", sub: "Peladas regulares com mensalidade e inscrições" },
                { id: "league", Icon: Trophy, color: "var(--gold)", bg: "rgba(245,197,66,.15)", label: "Liga", sub: "Equipa numa competição oficial com convocatórias" },
              ].map(({ id, Icon, color, bg, label, sub }) => (
                <button key={id} onClick={() => setGroupMode(id)} className="ft-btn ft-ghost" style={{ padding: "12px 14px", justifyContent: "flex-start", gap: 12 }}>
                  <div style={{ padding: 8, borderRadius: 10, background: bg, color, flexShrink: 0 }}><Icon size={18} /></div>
                  <div style={{ textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 11, color: "var(--dim)" }}>{sub}</div></div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--raised)", borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: "var(--dim)" }}>Modo:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: groupMode === "league" ? "var(--gold)" : groupMode === "weekly" ? "var(--grass-bright)" : "var(--blue)" }}>{groupMode === "league" ? "Liga" : groupMode === "weekly" ? "Semanal" : "Casual"}</span>
                <button onClick={() => { setGroupMode(null); setNewGroup(""); setCreateError(""); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: 11 }}>Mudar</button>
              </div>
              <form onSubmit={createGroup} style={{ display: "flex", gap: 10 }}><input className="ft-input" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Nome do grupo..." autoFocus /><button type="submit" disabled={!newGroup.trim()} className="ft-btn ft-grass" style={{ padding: "0 18px" }}>Criar</button></form>
              {createError && <div style={{ fontSize: 12, background: "rgba(240,86,58,.12)", color: "#ff9684", border: "1px solid rgba(240,86,58,.3)", borderRadius: 10, padding: 8, display: "flex", gap: 6, alignItems: "center" }}><AlertCircle size={12} /> {createError}</div>}
            </div>
          )}
        </div>
        <div className="ft-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}><UserPlus size={16} style={{ color: "var(--blue)" }} /> Entrar com código</h2>
          <form onSubmit={joinGroup} style={{ display: "flex", gap: 10 }}><input className="ft-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código do convite..." /><button type="submit" disabled={!joinCode.trim()} className="ft-btn ft-ghost" style={{ padding: "0 18px", color: "var(--blue)" }}>Entrar</button></form>
          {msg && <p style={{ fontSize: 12, color: "var(--grass-bright)", marginTop: 8 }}>{msg}</p>}
        </div>
      </div>
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed var(--line)", borderRadius: 18 }}><Users size={44} style={{ color: "var(--faint)", marginBottom: 12 }} /><p style={{ color: "var(--dim)", fontSize: 14 }}>Cria um grupo ou pede um código a um amigo!</p></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {groups.map((g) => (
            <button key={g.id} onClick={() => setSelected(g)} className="ft-card ft-btn" style={{ padding: 20, textAlign: "left", alignItems: "stretch", flexDirection: "column", borderRadius: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 14, background: g.settings?.groupMode === "league" ? "rgba(245,197,66,.15)" : g.settings?.groupMode === "weekly" ? "rgba(34,197,94,.15)" : "rgba(106,169,224,.15)", color: g.settings?.groupMode === "league" ? "var(--gold)" : g.settings?.groupMode === "weekly" ? "var(--grass-bright)" : "var(--blue)" }}>{g.settings?.groupMode === "league" ? <Trophy size={24} /> : g.settings?.groupMode === "weekly" ? <CalendarCheck size={24} /> : <Zap size={24} />}</div>
                {g.ownerId === user.uid && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", padding: "3px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Crown size={10} /> Dono</span>}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{g.name}</h3>
              <p style={{ fontSize: 12, color: "var(--dim)", margin: "4px 0 0" }}>{g.settings?.groupMode === "league" ? "Liga" : g.settings?.groupMode === "weekly" ? "Semanal" : "Casual"}</p>
              <p style={{ fontSize: 12, color: "var(--faint)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>Entrar no grupo <ArrowRight size={12} /></p>
            </button>
          ))}
        </div>
      )}
      <BottomNav items={[{ id: "groups", icon: LayoutGrid, label: "Grupos", active: true, onClick: () => setView("groups") }, { id: "profile", icon: User, label: "Perfil", active: false, onClick: () => setView("profile") }]} />
    </div>
  );
};

/* ============================== ROOT ===================================== */
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }); return () => unsub(); }, []);
  if (loading) return <div className="ft" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{STYLES}</style><Loader2 size={40} style={{ color: "var(--grass-bright)", animation: "ftspin 1s linear infinite" }} /></div>;
  return (
    <div className="ft" style={{ minHeight: "100vh" }}>
      <style>{STYLES}</style>
      {!user ? <AuthScreen /> : <GroupSelector user={user} onLogout={() => signOut(auth)} />}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
