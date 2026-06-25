import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, CalendarCheck, Shield, History as HistoryIcon, UserPlus, Plus, Trash2,
  Shuffle, Check, ArrowLeft, ArrowRight, LogOut, LayoutGrid, Loader2, Globe,
  User, Camera, Save, Crown, ShieldAlert, Settings, Copy, Star, Trophy,
  AlertCircle, Clock, Map as MapIcon, MapPin, Wallet, ClipboardList,
  CheckCircle, Award, Flame, Medal, Share2, ShieldCheck, Wind, Droplets,
  CloudSun, Sun, CloudRain, Cloud, MessageSquare, Send, Minus, RotateCcw, Pencil,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, doc, updateDoc, 
  onSnapshot, deleteDoc, serverTimestamp, query, orderBy, setDoc, getDoc, where, arrayUnion, getDocs, arrayRemove 
} from 'firebase/firestore';



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
  font-family:'Inter',system-ui,sans-serif;
  color:var(--text);
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(34,197,94,.10), transparent 60%),
    radial-gradient(900px 500px at 90% 110%, rgba(34,197,94,.05), transparent 55%),
    var(--bg);
  min-height:100%;
  -webkit-font-smoothing:antialiased;
}
.ft *{box-sizing:border-box;}
.ft ::-webkit-scrollbar{display:none;}
.ft .num{font-family:'Anton',Impact,sans-serif;letter-spacing:.5px;font-weight:400;}
.ft .eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);font-weight:700;}

.ft-card{background:var(--card);border:1px solid var(--line);border-radius:20px;}
.ft-raised{background:var(--raised);border:1px solid var(--line);}

.ft-btn{border:none;cursor:pointer;font-family:inherit;border-radius:14px;font-weight:700;
  transition:transform .12s ease,background .15s ease,opacity .15s; display:inline-flex;
  align-items:center;justify-content:center;gap:8px;}
.ft-btn:active{transform:scale(.96);}
.ft-btn:disabled{opacity:.45;cursor:not-allowed;}
.ft-grass{background:linear-gradient(135deg,var(--grass-2),var(--grass));color:#04130a;
  box-shadow:0 8px 24px -10px rgba(34,197,94,.6);}
.ft-grass:hover{background:linear-gradient(135deg,var(--grass-bright),var(--grass-2));}
.ft-ghost{background:var(--raised);color:var(--text);border:1px solid var(--line);}
.ft-ghost:hover{border-color:#33473f;}
.ft-danger{background:rgba(240,86,58,.12);color:#ff9684;border:1px solid rgba(240,86,58,.3);}
.ft-danger:hover{background:rgba(240,86,58,.2);}

.ft-input{width:100%;background:#0a120f;border:1px solid var(--line);border-radius:12px;
  padding:12px 14px;color:var(--text);font-family:inherit;font-size:14px;outline:none;
  transition:border-color .15s;}
.ft-input::placeholder{color:#46584f;}
.ft-input:focus{border-color:var(--grass);}

.pitch{position:relative;overflow:hidden;border-radius:22px;border:1px solid var(--line);
  background:
    radial-gradient(120% 80% at 50% -20%, rgba(34,197,94,.22), transparent 60%),
    linear-gradient(180deg,#0f2017,#0a1611);}
.pitch .lines{position:absolute;inset:0;opacity:.5;pointer-events:none;}
.pitch .stripe{position:absolute;inset:0;background:repeating-linear-gradient(
  90deg, rgba(255,255,255,.018) 0 38px, transparent 38px 76px);pointer-events:none;}

.bib{width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;
  justify-content:center;font-size:11px;font-weight:800;}
.bib-white{background:var(--chalk);color:#0b0b0b;}
.bib-black{background:#0c0f0e;color:#cfe8da;border:1px solid #2a3a33;}

.tab-ico{transition:transform .15s ease;}
.navbtn[data-active="true"] .tab-ico{transform:translateY(-2px) scale(1.08);}

@keyframes ftin{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.ft-in{animation:ftin .35s cubic-bezier(.2,.7,.3,1) both;}
@keyframes ftpop{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:scale(1);}}
.ft-pop{animation:ftpop .25s ease both;}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.ft-in,.ft-pop{animation:none;}}
`;

/* ------------------------------ Mock data -------------------------------- */
const ME = { uid: "me", displayName: "Francisco", photoURL: null };

const seedPlayers = [
  { id: "p1", uid: "me", name: "Francisco", type: "member", isAdmin: true, stats: { games: 38, wins: 21, draws: 7, losses: 10 }, votes: { u2: 4, u3: 5, u4: 4 } },
  { id: "p2", uid: "u2", name: "Tiago", type: "member", isAdmin: true, stats: { games: 41, wins: 19, draws: 9, losses: 13 }, votes: { me: 4, u3: 4 } },
  { id: "p3", uid: "u3", name: "Ruben", type: "member", isAdmin: false, stats: { games: 52, wins: 30, draws: 8, losses: 14 }, votes: { me: 5, u2: 4, u4: 5 } },
  { id: "p4", uid: "u4", name: "Nuno", type: "member", isAdmin: false, stats: { games: 12, wins: 5, draws: 2, losses: 5 }, votes: { me: 3, u2: 3 } },
  { id: "p5", uid: "u5", name: "Diogo", type: "member", isAdmin: false, stats: { games: 9, wins: 3, draws: 1, losses: 5 }, votes: { me: 2, u2: 3 } },
  { id: "p6", uid: "u6", name: "Andre", type: "member", isAdmin: false, stats: { games: 24, wins: 14, draws: 4, losses: 6 }, votes: { me: 4, u3: 3 } },
  { id: "p7", uid: "u7", name: "Bruno", type: "member", isAdmin: false, stats: { games: 31, wins: 20, draws: 5, losses: 6 }, votes: { me: 4, u2: 4, u3: 4 } },
  { id: "g1", uid: null, name: "Joao (C - Ruben)", type: "guest", hostId: "p3", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, votes: { me: 3 } },
  { id: "g2", uid: null, name: "Pedro (C - Tiago)", type: "guest", hostId: "p2", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, votes: {} },
];

const inDays = (d) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(21, 0, 0, 0); return x.toISOString(); };
const agoDays = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };

const seedMatches = [
  {
    id: "m1", date: agoDays(0.3), scoreA: 6, scoreB: 4,
    teamA: [{ id: "p1", name: "Francisco" }, { id: "p3", name: "Ruben" }, { id: "p6", name: "Andre" }],
    teamB: [{ id: "p2", name: "Tiago" }, { id: "p7", name: "Bruno" }, { id: "p4", name: "Nuno" }],
    mvpVotes: { me: "p3", u2: "p3", u6: "p1" },
    goals: { p1: { g: 2, a: 1 }, p3: { g: 3, a: 1 }, p6: { g: 1, a: 0 }, p2: { g: 2, a: 1 }, p7: { g: 2, a: 0 }, p4: { g: 0, a: 1 } },
    payments: { g1: false }, createdAtMs: Date.now() - 0.3 * 864e5,
  },
  {
    id: "m2", date: agoDays(7), scoreA: 3, scoreB: 3,
    teamA: [{ id: "p1", name: "Francisco" }, { id: "p7", name: "Bruno" }],
    teamB: [{ id: "p3", name: "Ruben" }, { id: "p6", name: "Andre" }],
    mvpVotes: { me: "p7", u3: "p7", u6: "p7" },
    goals: { p1: { g: 1, a: 1 }, p7: { g: 2, a: 0 }, p3: { g: 2, a: 1 }, p6: { g: 1, a: 0 } },
    payments: {}, createdAtMs: Date.now() - 7 * 864e5,
  },
];

const seedMessages = [
  { id: "c1", uid: "u3", name: "Ruben", text: "Malta, quem confirma para quinta?", ts: Date.now() - 3600e3 * 5 },
  { id: "c2", uid: "u2", name: "Tiago", text: "Eu vou! Levo o Pedro de convidado.", ts: Date.now() - 3600e3 * 4.5 },
  { id: "c3", uid: "me", name: "Francisco", text: "Confirmado. Faltam balizas?", ts: Date.now() - 3600e3 * 4 },
  { id: "c4", uid: "u6", name: "Andre", text: "Tenho eu. Levo coletes tambem.", ts: Date.now() - 3600e3 * 2 },
];

const seedGroup = { id: "peladas-de-quinta", name: "Peladas de Quinta", ownerId: "me" };

/* ------------------------------ Helpers ---------------------------------- */
const firstName = (n) => (n || "").replace(/\s*\(.*$/, "").split(" ")[0];
const avatarHue = (name) => { let h = 0; for (const c of name || "") h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const initials = (n) => (n || "?").replace(/\(.*$/, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const timeStr = (ts) => new Date(ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

const Avatar = ({ name, photo, size = 36, ring }) => {
  const hue = avatarHue(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.36, color: "#04130a",
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
    <path d="M12 17v5" /><path d="M7.8 14.5l-4 2.8" /><path d="M16.2 14.5l4 2.8" />
    <path d="M9.4 9.4l-4.2-2.6" /><path d="M14.6 9.4l4.2-2.6" />
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
      <line x1="160" y1="0" x2="160" y2="180" />
      <circle cx="160" cy="90" r="34" />
      <circle cx="160" cy="90" r="2.5" fill="rgba(245,248,246,.5)" stroke="none" />
      <rect x="0" y="55" width="42" height="70" />
      <rect x="278" y="55" width="42" height="70" />
    </g>
  </svg>
);

const StarRating = ({ value, onChange, readOnly, size = 16 }) => (
  <div style={{ display: "inline-flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} onClick={(e) => { e.stopPropagation(); if (!readOnly) onChange(s); }}
        disabled={readOnly} className="ft-btn" style={{ background: "none", padding: 0, borderRadius: 4 }}>
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

/* --------------------------- Weather (mock) ------------------------------ */
const useMockWeather = (date) => {
  const [w, setW] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => { setW({ temp: 17, precip: 20, code: 2, wind: 12 }); setLoading(false); }, 650);
    return () => clearTimeout(t);
  }, [date]);
  return { w, loading };
};
const weatherInfo = (code) => {
  if (code === 0) return { Icon: Sun, label: "Ceu limpo", color: "var(--gold)" };
  if ([1, 2, 3].includes(code)) return { Icon: CloudSun, label: "Pouco nublado", color: "var(--blue)" };
  if ([51, 61, 63, 80, 81].includes(code)) return { Icon: CloudRain, label: "Chuva", color: "var(--blue)" };
  return { Icon: Cloud, label: "Nublado", color: "var(--dim)" };
};
const WeatherStrip = ({ date }) => {
  const { w, loading } = useMockWeather(date);
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, fontSize: 12, color: "var(--dim)" }}>
      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> A consultar o tempo...
    </div>
  );
  if (!w) return null;
  const { Icon, label, color } = weatherInfo(w.code);
  return (
    <div className="ft-raised" style={{ borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={24} style={{ color }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--dim)", display: "flex", gap: 10, marginTop: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Wind size={11} /> {w.wind} km/h</span>
            {w.precip > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--blue)" }}><Droplets size={11} /> {w.precip}%</span>}
          </div>
        </div>
      </div>
      <div className="num" style={{ fontSize: 30, lineHeight: 1, display: "flex", alignItems: "flex-start" }}>
        {w.temp}<span style={{ fontSize: 13, color: "var(--faint)", marginTop: 4 }}>C</span>
      </div>
    </div>
  );
};

/* ------------------------------ Toast ------------------------------------ */
const Toast = ({ toast }) => !toast.show ? null : (
  <div className="ft-pop" style={{
    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 80,
    padding: "12px 18px", borderRadius: 14, fontSize: 13, fontWeight: 700,
    display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 30px -8px rgba(0,0,0,.6)",
    background: toast.type === "error" ? "var(--danger)" : "linear-gradient(135deg,var(--grass-bright),var(--grass-2))",
    color: toast.type === "error" ? "#fff" : "#04130a",
  }}>
    {toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}{toast.msg}
  </div>
);

/* ------------------------------ Nav -------------------------------------- */
const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} data-active={active} className="navbtn ft-btn" style={{
    background: "none", flexDirection: "column", minWidth: 58, padding: "6px 4px", borderRadius: 14,
    color: active ? "var(--grass-bright)" : "var(--faint)",
  }}>
    <Icon size={22} className="tab-ico" strokeWidth={active ? 2.5 : 2} />
    <span style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{label}</span>
  </button>
);
const BottomNav = ({ items }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
    background: "rgba(10,15,14,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--line)" }}>
    <div style={{ display: "flex", overflowX: "auto", justifyContent: "flex-start", gap: 2, padding: "8px 10px", maxWidth: 760, margin: "0 auto" }}>
      {items.map((it) => <NavButton key={it.id} active={it.active} onClick={it.onClick} icon={it.icon} label={it.label} />)}
    </div>
  </div>
);

/* ============================ AUTH SCREEN ================================ */
const AuthScreen = ({ onEnter }) => {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="ft-in" style={{ width: "100%", maxWidth: 400 }}>
        <div className="pitch" style={{ padding: "34px 24px 26px", textAlign: "center", marginBottom: 22 }}>
          <PitchLines /><div className="stripe" />
          <div style={{ position: "relative" }}>
            <div style={{
              width: 76, height: 76, margin: "0 auto 16px", borderRadius: 22, transform: "rotate(-6deg)",
              background: "linear-gradient(135deg,var(--grass-2),#0c7a3a)", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 16px 40px -12px rgba(34,197,94,.7)", border: "2px solid rgba(255,255,255,.15)",
            }}>
              <SoccerBall size={42} color="#fff" />
            </div>
            <h1 className="num" style={{ fontSize: 46, lineHeight: .9, margin: 0, color: "var(--chalk)" }}>FUTEBOLADAS</h1>
            <div style={{ height: 3, width: 64, margin: "10px auto 0", background: "var(--lime)", borderRadius: 2 }} />
            <p className="eyebrow" style={{ marginTop: 12, color: "var(--grass-bright)" }}>Gestor de peladas - V2</p>
          </div>
        </div>
        <div className="ft-card" style={{ padding: 24 }}>
          <h2 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: "0 0 18px" }}>{isLogin ? "Entrar em campo" : "Criar conta"}</h2>
          <button onClick={onEnter} className="ft-btn" style={{ width: "100%", background: "#fff", color: "#0b0b0b", padding: "12px", marginBottom: 14 }}><Globe size={18} /> Continuar com Google</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} /><span className="eyebrow">ou email</span><div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="ft-input" placeholder="Email" type="email" />
            <input className="ft-input" placeholder="Palavra-passe" type="password" />
            <button onClick={onEnter} className="ft-btn ft-grass" style={{ padding: 13, marginTop: 4 }}>{isLogin ? "Entrar" : "Registar"}</button>
          </div>
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--grass-bright)", fontSize: 13, marginTop: 18, width: "100%" }}>
            {isLogin ? "Ainda nao tens conta? Cria gratis" : "Ja tens conta? Faz login"}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--faint)", marginTop: 16 }}>Pre-visualizacao - qualquer botao entra na demo</p>
      </div>
    </div>
  );
};

/* ============================ GROUP SELECTOR ============================= */
const GroupSelector = ({ onOpen, onProfile }) => {
  const [groups] = useState([seedGroup, { id: "domingos", name: "Liga dos Domingos", ownerId: "u2" }]);
  return (
    <div className="ft-in" style={{ minHeight: "100%", padding: "20px 16px 110px", maxWidth: 880, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--grass-bright)" }}>Balneario</div>
          <h1 className="num" style={{ fontSize: 30, margin: "2px 0 0", color: "var(--chalk)" }}>OS TEUS GRUPOS</h1>
          <p style={{ fontSize: 13, color: "var(--dim)", margin: "4px 0 0" }}>Ola, <b style={{ color: "var(--text)" }}>Francisco</b></p>
        </div>
        <button onClick={onProfile} className="ft-btn" style={{ background: "none", padding: 0 }}><Avatar name="Francisco" size={44} /></button>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 26 }}>
        <div className="ft-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}><Plus size={16} style={{ color: "var(--grass-bright)" }} /> Criar grupo</h2>
          <div style={{ display: "flex", gap: 10 }}><input className="ft-input" placeholder="Nome do grupo..." /><button className="ft-btn ft-grass" style={{ padding: "0 18px" }}>Criar</button></div>
        </div>
        <div className="ft-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}><UserPlus size={16} style={{ color: "var(--blue)" }} /> Entrar com codigo</h2>
          <div style={{ display: "flex", gap: 10 }}><input className="ft-input" placeholder="Codigo do convite..." /><button className="ft-btn ft-ghost" style={{ padding: "0 18px", color: "var(--blue)" }}>Entrar</button></div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {groups.map((g) => (
          <button key={g.id} onClick={() => onOpen(g)} className="ft-card ft-btn" style={{ padding: 20, textAlign: "left", alignItems: "stretch", flexDirection: "column", borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 14, background: "var(--raised)", color: "var(--grass-bright)" }}><Users size={24} /></div>
              {g.ownerId === "me" && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", padding: "3px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Crown size={10} /> Dono</span>}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{g.name}</h3>
            <p style={{ fontSize: 12, color: "var(--dim)", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>Entrar no grupo <ArrowRight size={12} /></p>
          </button>
        ))}
      </div>
      <BottomNav items={[
        { id: "groups", icon: LayoutGrid, label: "Grupos", active: true, onClick: () => { } },
        { id: "profile", icon: User, label: "Perfil", active: false, onClick: onProfile },
      ]} />
    </div>
  );
};

/* ============================== PROFILE ================================== */
const ProfileScreen = ({ onBack }) => {
  const me = seedPlayers[0]; const games = me.stats.games, wins = me.stats.wins;
  const Stat = ({ label, value, color }) => (
    <div className="ft-raised" style={{ borderRadius: 14, padding: 12, textAlign: "center" }}>
      <div className="eyebrow" style={{ color: color || "var(--faint)" }}>{label}</div>
      <div className="num" style={{ fontSize: 26, color: color || "var(--text)", marginTop: 2 }}>{value}</div>
    </div>
  );
  return (
    <div className="ft-in" style={{ minHeight: "100%", padding: "20px 16px 110px", maxWidth: 440, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} className="ft-btn ft-ghost" style={{ padding: 10, borderRadius: 12 }}><ArrowLeft size={18} /></button>
        <h2 className="num" style={{ fontSize: 24, color: "var(--chalk)", margin: 0 }}>O MEU PERFIL</h2>
      </div>
      <div className="ft-card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative" }}><Avatar name="Francisco" size={92} /><div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--grass)", padding: 8, borderRadius: "50%", border: "2px solid var(--card)" }}><Camera size={15} color="#04130a" /></div></div>
          <p style={{ fontSize: 11, color: "var(--faint)", marginTop: 10 }}>Toca para alterar a foto</p>
        </div>
        <div style={{ marginTop: 16 }}><label className="eyebrow">Nome de jogador</label><input className="ft-input" defaultValue="Francisco" style={{ marginTop: 6 }} /></div>
        <button className="ft-btn ft-grass" style={{ width: "100%", padding: 13, marginTop: 16 }}><Save size={18} /> Guardar alteracoes</button>
      </div>
      <div className="ft-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px" }}><Trophy size={16} style={{ color: "var(--gold)" }} /> Numeros globais</h3>
        <p style={{ fontSize: 11, color: "var(--dim)", margin: "0 0 14px" }}>O somatorio da tua carreira em todos os grupos.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Stat label="Jogos" value={games} /><Stat label="Vitorias" value={wins} color="var(--grass-bright)" />
          <Stat label="MVPs" value={6} color="var(--gold)" /><Stat label="Win rate" value={`${Math.round((wins / games) * 100)}%`} color="var(--blue)" />
        </div>
      </div>
      <button onClick={onBack} className="ft-btn" style={{ width: "100%", background: "none", color: "#ff9684", padding: 14, marginTop: 18 }}><LogOut size={16} /> Terminar sessao</button>
      <BottomNav items={[
        { id: "groups", icon: LayoutGrid, label: "Grupos", active: false, onClick: onBack },
        { id: "profile", icon: User, label: "Perfil", active: true, onClick: () => { } },
      ]} />
    </div>
  );
};

/* ============================ DASHBOARD ================================== */
const GroupDashboard = ({ group, onBack }) => {
  const [tab, setTab] = useState("schedule");
  const [players, setPlayers] = useState(seedPlayers);
  const [matches, setMatches] = useState(seedMatches);
  const [messages, setMessages] = useState(seedMessages);
  const [next, setNext] = useState({ date: inDays(3), frequency: "weekly", responses: { me: "going", u3: "going", u6: "going", u7: "going", u2: "going" } });
  const [settings, setSettings] = useState({ paymentModel: "monthly", monthlyFee: 15, seasonFee: 90, guestFee: 4.5 });
  const [fixedIds, setFixedIds] = useState(["p1", "p2", "p3", "p6", "p7"]);
  const [payments, setPayments] = useState({ p1: true, p3: true, p6: false, p2: false, p7: false });
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [copied, setCopied] = useState(false);

  const me = ME;
  const isOwner = group.ownerId === me.uid;
  const myProfile = players.find((p) => p.uid === me.uid);
  const amIAdmin = isOwner || myProfile?.isAdmin;
  const showToast = (msg, type = "success") => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 2400); };

  /* ---- modelo de pagamento ---- */
  const collectsFixed = settings.paymentModel !== "pergame";
  const fixedFee = settings.paymentModel === "season" ? Number(settings.seasonFee) || 0 : Number(settings.monthlyFee) || 0;
  const fixedLabel = settings.paymentModel === "season" ? "Inscricao da epoca" : "Mensalidade";
  const fee = Number(settings.guestFee) || 0;

  /* ---- derivados ---- */
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

  const TABS = [
    { id: "schedule", icon: CalendarCheck, label: "Agenda" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "team", icon: Shield, label: "Equipa" },
    { id: "tactics", icon: TacticIcon, label: "Tatica" },
    { id: "players", icon: Users, label: "Plantel" },
    { id: "history", icon: HistoryIcon, label: "Jogos" },
    { id: "trophies", icon: Trophy, label: "Carreira" },
    ...(collectsFixed ? [{ id: "members", icon: ClipboardList, label: "Inscricoes" }] : []),
    ...(amIAdmin ? [{ id: "treasury", icon: Wallet, label: "Tesouraria" }] : []),
    { id: "settings", icon: Settings, label: "Definicoes" },
  ];

  return (
    <div className="ft-in" style={{ minHeight: "100%", paddingBottom: 96 }}>
      <Toast toast={toast} />
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(13,20,17,.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} className="ft-btn ft-ghost" style={{ padding: 9, borderRadius: 12 }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 7 }}><Users size={17} style={{ color: "var(--grass-bright)" }} /> {group.name}</h2>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isOwner && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", padding: "4px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Crown size={10} /> Dono</span>}
          <button onClick={() => { setCopied(true); showToast("Codigo copiado!"); setTimeout(() => setCopied(false), 1800); }} className="ft-btn ft-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copiado" : "Convidar"}</button>
        </div>
      </div>

      <div style={{ padding: tab === "chat" || tab === "tactics" ? "0" : 16, maxWidth: tab === "chat" ? 620 : 480, margin: "0 auto" }}>
        {tab === "schedule" && <ScheduleTab {...{ next, setNext, players, me, showToast }} />}
        {tab === "chat" && <ChatTab {...{ messages, setMessages, me }} />}
        {tab === "team" && <TeamTab {...{ players, next, avg, collectsFixed, fixedIds, setMatches, setNext, showToast, setTab }} />}
        {tab === "tactics" && <TacticsTab {...{ members, showToast }} />}
        {tab === "players" && <PlayersTab {...{ members, guests, players, setPlayers, me, amIAdmin, isOwner, avg, showToast }} />}
        {tab === "history" && <HistoryTab {...{ matches, setMatches, matchMVP, amIAdmin, me, showToast }} />}
        {tab === "trophies" && <TrophiesTab {...{ myProfile, amIAdmin, avg, mvpCount, fixedIds, players, matches }} />}
        {tab === "members" && collectsFixed && <MembersTab {...{ fixedIds, setFixedIds, players, myProfile, showToast, paymentModel: settings.paymentModel }} />}
        {tab === "treasury" && amIAdmin && <TreasuryTab {...{ players, matches, setMatches, collectsFixed, fixedIds, payments, setPayments, fixedFee, fee, fixedLabel, totalRevenue, totalDebt, showToast }} />}
        {tab === "settings" && <SettingsTab {...{ settings, setSettings, next, setNext, isOwner, amIAdmin, showToast, onBack }} />}
      </div>

      <BottomNav items={TABS.map((t) => ({ ...t, active: tab === t.id, onClick: () => setTab(t.id) }))} />
    </div>
  );
};

/* ----------------------------- Agenda ------------------------------------ */
const ScheduleTab = ({ next, setNext, players, me, showToast }) => {
  const date = new Date(next.date);
  const myResp = next.responses?.[me.uid];
  const going = Object.entries(next.responses || {}).filter(([, s]) => s === "going");
  const diffMs = date - new Date();
  const days = Math.floor(diffMs / 864e5), hrs = Math.floor((diffMs % 864e5) / 36e5);
  const setResp = (s) => { setNext((n) => ({ ...n, responses: { ...n.responses, [me.uid]: s } })); showToast(s === "going" ? "Confirmado! Bora" : "Removido da convocatoria"); };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pitch" style={{ padding: 22 }}>
        <PitchLines /><div className="stripe" />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Proxima peladinha</span>
            {diffMs > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--lime)", border: "1px solid rgba(198,242,74,.3)", background: "rgba(198,242,74,.08)", padding: "4px 10px", borderRadius: 999 }}>{days > 0 ? `faltam ${days}d ${hrs}h` : `hoje - ${hrs}h`}</span>}
          </div>
          <div className="num" style={{ fontSize: 40, lineHeight: .95, color: "var(--chalk)", marginTop: 10, textTransform: "capitalize" }}>{date.toLocaleDateString("pt-PT", { weekday: "long" })}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span className="num" style={{ fontSize: 22, color: "var(--text)" }}>{date.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 700, color: "var(--grass-bright)" }}><Clock size={14} /> {date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>
      <WeatherStrip date={next.date} />
      <button onClick={() => showToast("Abre o Google Maps no telemovel")} className="ft-card ft-btn" style={{ padding: 14, justifyContent: "center", gap: 8, color: "var(--grass-bright)", fontWeight: 700 }}><MapPin size={16} style={{ color: "var(--danger)" }} /> Ver campo no mapa</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => setResp("going")} className="ft-btn" style={{ padding: "18px", flexDirection: "column", gap: 4, border: "1px solid", borderColor: myResp === "going" ? "var(--grass-bright)" : "var(--line)", background: myResp === "going" ? "linear-gradient(135deg,var(--grass-2),var(--grass))" : "var(--raised)", color: myResp === "going" ? "#04130a" : "var(--text)" }}><span style={{ fontSize: 22 }}>?</span><span style={{ fontWeight: 800 }}>Vou jogar</span></button>
        <button onClick={() => setResp("not_going")} className="ft-btn" style={{ padding: "18px", flexDirection: "column", gap: 4, border: "1px solid", borderColor: myResp === "not_going" ? "var(--danger)" : "var(--line)", background: myResp === "not_going" ? "rgba(240,86,58,.85)" : "var(--raised)", color: myResp === "not_going" ? "#fff" : "var(--text)" }}><span style={{ fontSize: 22 }}>?</span><span style={{ fontWeight: 800 }}>Nao vou</span></button>
      </div>
      <div className="ft-card" style={{ padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Convocados - {going.length}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {going.map(([uid]) => { const p = players.find((pl) => pl.uid === uid); return p ? (
            <div key={uid} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px 5px 5px" }}><Avatar name={p.name} size={24} /><span style={{ fontSize: 12, fontWeight: 600 }}>{firstName(p.name)}</span></div>) : null; })}
          {going.length === 0 && <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>Ainda ninguem confirmou.</span>}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------- Chat ------------------------------------ */
const ChatTab = ({ messages, setMessages, me }) => {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = () => { if (!text.trim()) return; setMessages((m) => [...m, { id: "c" + Date.now(), uid: me.uid, name: me.displayName, text: text.trim(), ts: Date.now() }]); setText(""); };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 158px)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m) => {
          const mine = m.uid === me.uid;
          return (
            <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end" }}>
              {!mine && <Avatar name={m.name} size={30} />}
              <div style={{ maxWidth: "74%" }}>
                {!mine && <div style={{ fontSize: 10, color: "var(--faint)", marginBottom: 3, marginLeft: 4, fontWeight: 700 }}>{firstName(m.name)}</div>}
                <div style={{ padding: "9px 13px", borderRadius: 16, fontSize: 14, lineHeight: 1.35,
                  background: mine ? "linear-gradient(135deg,var(--grass-2),var(--grass))" : "var(--raised)",
                  color: mine ? "#04130a" : "var(--text)", border: mine ? "none" : "1px solid var(--line)",
                  borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4 }}>{m.text}</div>
                <div style={{ fontSize: 9, color: "var(--faint)", marginTop: 3, textAlign: mine ? "right" : "left", padding: "0 4px" }}>{timeStr(m.ts)}</div>
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

/* ------------------------------ Tatica ----------------------------------- */
const TACTIC_SYSTEMS = {
  "5x5": {
    defaultFormation: "2-2",
    formations: {
      "2-2": [[50, 91], [30, 70], [70, 70], [32, 50], [68, 50]],
      "Losango": [[50, 91], [50, 72], [27, 55], [73, 55], [50, 40]],
      "1-2-1": [[50, 91], [50, 74], [28, 58], [72, 58], [50, 42]],
      "3-1": [[50, 91], [27, 72], [50, 72], [73, 72], [50, 52]],
    },
  },
  "7x7": {
    defaultFormation: "2-3-1",
    formations: {
      "2-3-1": [[50,91],[30,75],[70,75],[20,58],[50,58],[80,58],[50,38]],
      "3-2-1": [[50,91],[22,76],[50,76],[78,76],[35,58],[65,58],[50,38]],
      "2-1-2-1": [[50,91],[30,76],[70,76],[50,64],[28,50],[72,50],[50,34]],
    },
  },
  "11x11": {
    defaultFormation: "4-3-3",
    formations: {
      "4-3-3": [[50,92],[18,78],[38,80],[62,80],[82,78],[28,62],[50,58],[72,62],[20,36],[50,28],[80,36]],
      "4-4-2": [[50,92],[18,78],[38,80],[62,80],[82,78],[18,56],[40,60],[60,60],[82,56],[38,34],[62,34]],
      "3-5-2": [[50,92],[24,78],[50,80],[76,78],[18,60],[36,56],[50,52],[64,56],[82,60],[40,32],[60,32]],
    },
  },
};
const buildTokens = (mode, formation, team, roster = []) => {
  const pts = TACTIC_SYSTEMS[mode].formations[formation] || [];
  return pts.map((pos, i) => ({
    id: `${team}-${i}`,
    team,
    slot: i,
    playerId: roster[i]?.id || null,
    label: i === 0 ? "GR" : String(i),
    x: pos[0],
    y: team === "black" ? 100 - pos[1] : pos[1],
  }));
};

const TacticsTab = ({ members, showToast }) => {
  const [mode, setMode] = useState("5x5");
  const [form, setForm] = useState(TACTIC_SYSTEMS["5x5"].defaultFormation);
  const [whiteRoster, setWhiteRoster] = useState([]);
  const [bench, setBench] = useState(members);
  const [tokens, setTokens] = useState(() => buildTokens("5x5", TACTIC_SYSTEMS["5x5"].defaultFormation, "white", []));
  const [hasOpp, setHasOpp] = useState(false);
  const [hasBall, setHasBall] = useState(true);
  const [ball, setBall] = useState({ x: 50, y: 50 });
  const [drawMode, setDrawMode] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    setBench((prev) => {
      const used = new Set(whiteRoster.map((p) => p.id));
      const fresh = members.filter((m) => !used.has(m.id));
      return fresh;
    });
  }, [members]);

  const pct = (e) => { const r = boardRef.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };
  const syncWhiteTokens = (roster, nextMode = mode, nextForm = form) => {
    const white = buildTokens(nextMode, nextForm, "white", roster);
    const black = hasOpp ? buildTokens(nextMode, nextForm, "black", []) : [];
    setTokens([...white, ...black]);
  };

  const switchMode = (m) => {
    const df = TACTIC_SYSTEMS[m].defaultFormation;
    const starters = whiteRoster.slice(0, TACTIC_SYSTEMS[m].formations[df].length);
    const overflow = whiteRoster.slice(TACTIC_SYSTEMS[m].formations[df].length);
    setBench((b) => [...overflow, ...b.filter((x) => !overflow.find((o) => o.id === x.id))]);
    setWhiteRoster(starters);
    setMode(m); setForm(df); syncWhiteTokens(starters, m, df);
  };
  const applyForm = (f) => { setForm(f); syncWhiteTokens(whiteRoster, mode, f); };
  const toggleOpp = () => { const n = !hasOpp; setHasOpp(n); setTokens((prev) => [...prev.filter(t=>t.team==="white"), ...(n ? buildTokens(mode, form, "black", []) : [])]); };
  const loadRoster = () => {
    const limit = TACTIC_SYSTEMS[mode].formations[form].length;
    const starters = members.slice(0, limit);
    const subs = members.slice(limit);
    setWhiteRoster(starters); setBench(subs); syncWhiteTokens(starters); showToast("Plantel aplicado à tática");
  };
  const reset = () => { setWhiteRoster([]); setBench(members); setTokens(buildTokens(mode, form, "white", [])); setHasOpp(false); setStrokes([]); setBall({ x: 50, y: 50 }); showToast("Quadro reposto"); };

  const swapBenchIn = (player, slot) => {
    const next = [...whiteRoster];
    const replaced = next[slot] || null;
    next[slot] = player;
    setWhiteRoster(next);
    setBench((b) => [...b.filter((x) => x.id !== player.id), ...(replaced ? [replaced] : [])]);
    syncWhiteTokens(next);
  };
  const removeFromField = (slot) => {
    const next = [...whiteRoster];
    const removed = next[slot];
    if (!removed) return;
    next[slot] = null;
    setWhiteRoster(next);
    setBench((b) => [...b, removed]);
    syncWhiteTokens(next);
  };

  const onTokenDown = (e, id) => { if (drawMode) return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = id; };
  const onTokenMove = (e, id) => {
    if (dragRef.current !== id) return;
    const p = pct(e); const x = Math.max(4, Math.min(96, p.x)), y = Math.max(3, Math.min(97, p.y));
    if (id === "ball") setBall({ x, y }); else setTokens((ts) => ts.map((t) => t.id === id ? { ...t, x, y } : t));
  };
  const onTokenUp = (e) => { dragRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { } };

  const onBoardDown = (e) => { if (!drawMode) return; e.currentTarget.setPointerCapture(e.pointerId); drawingRef.current = true; const p = pct(e); setStrokes((s) => [...s, [p]]); };
  const onBoardMove = (e) => { if (!drawMode || !drawingRef.current) return; const p = pct(e); setStrokes((s) => { const c = s.slice(); c[c.length - 1] = [...c[c.length - 1], p]; return c; }); };
  const onBoardUp = () => { drawingRef.current = false; };

  const Token = (t) => {
    const p = t.team === "white" ? whiteRoster[t.slot] : null;
    return (
      <div key={t.id} onPointerDown={(e) => onTokenDown(e, t.id)} onPointerMove={(e) => onTokenMove(e, t.id)} onPointerUp={onTokenUp}
        style={{ position: "absolute", left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)", touchAction: "none",
          width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, cursor: drawMode ? "crosshair" : "grab", userSelect: "none", zIndex: 5,
          background: t.team === "white" ? "var(--chalk)" : "#0c0f0e", color: t.team === "white" ? "#0b0b0b" : "#cfe8da",
          border: t.team === "white" ? "2px solid #0b0b0b" : "2px solid #3a4a43", boxShadow: "0 3px 8px rgba(0,0,0,.4)" }}>
        {p ? initials(p.name) : t.label}
      </div>
    );
  };

  const slots = TACTIC_SYSTEMS[mode].formations[form].length;
  return <div className="ft-in" style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: "flex", gap: 8, alignItems: "center" }}><TacticIcon size={18} /> Quadro tático</h2>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setDrawMode((d) => !d)} className="ft-btn" style={{ padding: 9, borderRadius: 10, background: drawMode ? "var(--lime)" : "var(--raised)", color: drawMode ? "#1a2200" : "var(--text)", border: "1px solid var(--line)" }}><Pencil size={16} /></button>
        <button onClick={reset} className="ft-btn ft-ghost" style={{ padding: 9, borderRadius: 10 }}><RotateCcw size={16} /></button>
      </div>
    </div>

    <div className="ft-card" style={{ padding: 12, display:"grid", gap:10 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Formato do jogo</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {Object.keys(TACTIC_SYSTEMS).map((m)=><button key={m} onClick={()=>switchMode(m)} className="ft-btn" style={{padding:"10px 6px", background:mode===m?"var(--grass)":"var(--raised)", color:mode===m?"#04130a":"var(--dim)", border:"1px solid var(--line)"}}>{m}</button>)}
        </div>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Formação</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {Object.keys(TACTIC_SYSTEMS[mode].formations).map((f)=><button key={f} onClick={()=>applyForm(f)} className="ft-btn" style={{padding:"9px 4px", fontSize:12, background:form===f?"var(--grass)":"var(--raised)", color:form===f?"#04130a":"var(--dim)", border:"1px solid var(--line)"}}>{f}</button>)}
        </div>
      </div>
    </div>

    <div ref={boardRef} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp}
      style={{ position: "relative", width: "100%", aspectRatio: "2 / 3", borderRadius: 18, overflow: "hidden", touchAction: "none",
        border: "1px solid var(--line)", background: "linear-gradient(180deg,#13301f,#0c2016)" }}>
      <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(245,248,246,.45)" strokeWidth="0.5" /><line x1="3" y1="75" x2="97" y2="75" stroke="rgba(245,248,246,.45)" strokeWidth="0.5" /><circle cx="50" cy="75" r="11" fill="none" stroke="rgba(245,248,246,.45)" strokeWidth="0.5" /></svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
        {strokes.map((s, i) => <polyline key={i} points={s.map((p) => f"{p['x']},{p['y']}").join(" ")} fill="none" stroke="var(--lime)" strokeWidth="2" />)}
      </svg>
      {tokens.map(Token)}
    </div>

    <div className="ft-card" style={{ padding: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Campo ({whiteRoster.filter(Boolean).length}/{slots})</div>
      <div style={{ display:"grid", gap:8 }}>
        {Array.from({length: slots}).map((_,i)=>{
          const p = whiteRoster[i];
          return <div key={i} className="ft-raised" style={{borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span className="bib bib-white">{i===0?"GR":i}</span><span style={{fontSize:13,fontWeight:700}}>{p ? p.name : "Lugar vazio"}</span></div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {bench.slice(0,4).map(b=><button key={b.id+"-"+i} onClick={()=>swapBenchIn(b,i)} className="ft-btn ft-ghost" style={{padding:"6px 8px",fontSize:11}}>+ {firstName(b.name)}</button>)}
              {p && <button onClick={()=>removeFromField(i)} className="ft-btn ft-danger" style={{padding:"6px 8px",fontSize:11}}>Remover</button>}
            </div>
          </div>
        })}
      </div>
    </div>

    <div className="ft-card" style={{ padding: 14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div className="eyebrow">Banco de suplentes - {bench.length}</div>
        <button onClick={loadRoster} className="ft-btn ft-ghost" style={{padding:"8px 10px", fontSize:12}}>Carregar plantel</button>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {bench.map((p)=><div key={p.id} className="ft-raised" style={{borderRadius:999,padding:"6px 10px",display:"flex",alignItems:"center",gap:8}}><Avatar name={p.name} size={24} /><span style={{fontSize:12,fontWeight:700}}>{firstName(p.name)}</span></div>)}
        {bench.length===0 && <span style={{fontSize:12,color:"var(--faint)"}}>Sem suplentes disponíveis.</span>}
      </div>
    </div>
  </div>;
};


/* ----------------------------- Plantel ----------------------------------- */
const PlayersTab = ({ members, guests, players, setPlayers, me, amIAdmin, isOwner, avg, showToast }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("guest");
  const [host, setHost] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [stars, setStars] = useState(3);
  const inRoster = players.some((p) => p.uid === me.uid);
  const add = () => {
    if (!name.trim()) return showToast("Nome invalido", "error");
    if (type === "guest" && !host) return showToast("Escolhe quem convidou", "error");
    let final = name;
    if (type === "guest") { const h = players.find((p) => p.id === host); if (h) final = `${name} (C - ${firstName(h.name)})`; }
    setPlayers((ps) => [...ps, { id: "n" + Date.now(), uid: null, name: final, type, hostId: type === "guest" ? host : null, stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: false, votes: {} }]);
    setName(""); showToast("Jogador adicionado!");
  };
  const rate = (p) => { setPlayers((ps) => ps.map((x) => x.id === p.id ? { ...x, votes: { ...x.votes, [me.uid]: stars } } : x)); setExpanded(null); showToast("Avaliacao registada!"); };
  const remove = (p) => { setPlayers((ps) => ps.filter((x) => x.id !== p.id)); showToast("Jogador eliminado"); };
  const Card = (p) => {
    const open = expanded === p.id; const myVote = p.votes?.[me.uid] || 0;
    return (
      <div key={p.id} onClick={() => { if (open) setExpanded(null); else { setExpanded(p.id); setStars(myVote || 3); } }} className="ft-card" style={{ padding: 12, cursor: "pointer", borderColor: open ? "rgba(34,197,94,.4)" : "var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={p.name} size={36} ring={p.isAdmin} />
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
                <button onClick={(e) => { e.stopPropagation(); rate(p); }} className="ft-btn ft-grass" style={{ width: "100%", padding: 9, fontSize: 13 }}>Confirmar</button>
              </div>
            )}
            {amIAdmin && <div style={{ display: "flex", gap: 8 }}><button onClick={(e) => { e.stopPropagation(); remove(p); }} className="ft-btn ft-danger" style={{ flex: 1, padding: 10, fontSize: 12 }}><Trash2 size={14} /> Eliminar</button></div>}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!inRoster && <button onClick={() => { setPlayers((ps) => [...ps, { id: "me-new", uid: me.uid, name: "Eu", type: "member", isAdmin: isOwner, stats: { games: 0, wins: 0, draws: 0, losses: 0 }, votes: {} }]); showToast("Entraste no plantel!"); }} className="ft-btn" style={{ background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.4)", color: "var(--grass-bright)", padding: 14, justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><UserPlus size={18} /> Entrar no plantel</span><Plus size={16} /></button>}
      <div className="ft-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><UserPlus size={16} style={{ color: "var(--grass-bright)" }} /> Novo jogador</h3>
          <div style={{ display: "flex", background: "#0a120f", borderRadius: 10, padding: 3, border: "1px solid var(--line)" }}>{["guest", "member"].map((t) => <button key={t} onClick={() => setType(t)} className="ft-btn" style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", background: type === t ? "var(--raised)" : "none", color: type === t ? "var(--text)" : "var(--faint)" }}>{t === "guest" ? "Convidado" : "Membro"}</button>)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome..." />
          {type === "guest" && <select className="ft-input" value={host} onChange={(e) => setHost(e.target.value)}><option value="">Quem convidou?</option>{members.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          <button onClick={add} className="ft-btn ft-grass" style={{ padding: 11 }}><Plus size={16} /> Adicionar</button>
        </div>
      </div>
      {members.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8, marginLeft: 4 }}>Membros - {members.length}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{members.map(Card)}</div></div>}
      {guests.length > 0 && <div><div className="eyebrow" style={{ marginBottom: 8, marginLeft: 4 }}>Convidados - {guests.length}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{guests.map(Card)}</div></div>}
    </div>
  );
};

/* ------------------------------ Equipa ----------------------------------- */
const TeamTab = ({ players, next, avg, collectsFixed, fixedIds, setMatches, setNext, showToast, setTab }) => {
  const goingIds = useMemo(() => {
    const uids = Object.entries(next.responses || {}).filter(([, s]) => s === "going").map(([u]) => u);
    return players.filter((p) => p.uid && uids.includes(p.uid)).map((p) => p.id);
  }, [next, players]);
  const [selected, setSelected] = useState(goingIds);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState(null);
  const [sa, setSa] = useState(""); const [sb, setSb] = useState("");
  const [gstats, setGstats] = useState({});
  const [showStats, setShowStats] = useState(false);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const filt = (list) => list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const members = players.filter((p) => p.type !== "guest");
  const guests = players.filter((p) => p.type === "guest");

  const generate = () => {
    if (selected.length < 2) return showToast("Minimo 2 jogadores", "error");
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
  const finish = () => {
    if (sa === "" || sb === "") return showToast("Insere o resultado", "error");
    const m = { id: "m" + Date.now(), date: new Date().toISOString(), scoreA: +sa, scoreB: +sb, teamA: teams.A.map((p) => ({ id: p.id, name: p.name })), teamB: teams.B.map((p) => ({ id: p.id, name: p.name })), mvpVotes: {}, goals: gstats, payments: {}, createdAtMs: Date.now() };
    [...teams.A, ...teams.B].forEach((p) => { if (collectsFixed ? !fixedIds.includes(p.id) : true) m.payments[p.id] = false; });
    setMatches((ms) => [m, ...ms]);
    if (next.frequency && next.frequency !== "once") { const d = new Date(next.date); d.setDate(d.getDate() + (next.frequency === "biweekly" ? 14 : 7)); setNext((n) => ({ ...n, date: d.toISOString(), responses: {} })); }
    showToast("Jogo guardado! Proxima data atualizada."); setTab("history");
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
        <button onClick={() => showToast("Equipas copiadas - cola no WhatsApp!")} className="ft-btn" style={{ background: "rgba(106,169,224,.14)", border: "1px solid rgba(106,169,224,.3)", color: "var(--blue)", padding: 11 }}><Share2 size={16} /> Partilhar equipas</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["A", "Branco", "bib-white", teams.A], ["B", "Preto", "bib-black", teams.B]].map(([k, label, bib, listv]) => (
            <div key={k} className="ft-card" style={{ padding: 12, borderTop: `3px solid ${k === "A" ? "var(--chalk)" : "#1a2620"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 8 }}><span className={`bib ${bib}`}>{listv.length}</span><span style={{ fontSize: 13, fontWeight: 800 }}>{label}</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{listv.map((p) => <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}><Avatar name={p.name} size={20} /> {firstName(p.name)}</div>)}</div>
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
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><SoccerBall size={15} color="var(--grass-bright)" /> Golos & assistencias (opcional)</span>
          <span style={{ transform: showStats ? "rotate(90deg)" : "none", transition: "transform .2s" }}><ArrowRight size={16} /></span>
        </button>
        {showStats && (
          <div className="ft-card ft-in" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 28, paddingRight: 4, marginBottom: 4 }}>
              <span className="eyebrow" style={{ color: "var(--grass-bright)" }}>Golos</span>
              <span className="eyebrow" style={{ color: "var(--blue)" }}>Assist</span>
            </div>
            {[...teams.A, ...teams.B].map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderTop: "1px solid var(--line-soft)" }}>
                <Avatar name={p.name} size={26} /><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{firstName(p.name)}</span>
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
const HistoryTab = ({ matches, setMatches, matchMVP, amIAdmin, me, showToast }) => {
  const [voting, setVoting] = useState(null);
  const [pick, setPick] = useState("");
  const vote = (m) => { if (!pick) return; setMatches((ms) => ms.map((x) => x.id === m.id ? { ...x, mvpVotes: { ...x.mvpVotes, [me.uid]: pick } } : x)); setVoting(null); setPick(""); showToast("Voto registado!"); };
  const del = (id) => { setMatches((ms) => ms.filter((m) => m.id !== id)); showToast("Jogo apagado"); };
  if (matches.length === 0) return <div style={{ textAlign: "center", color: "var(--faint)", fontStyle: "italic", padding: 40 }}>Sem jogos registados ainda.</div>;
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {matches.map((m) => {
        const d = m.createdAtMs ? new Date(m.createdAtMs) : new Date(m.date);
        const hrs = (Date.now() - d.getTime()) / 36e5;
        const open = hrs < 48; const left = Math.max(0, Math.round(48 - hrs));
        const mvp = matchMVP(m); const myVote = m.mvpVotes?.[me.uid];
        const scorers = m.goals ? Object.entries(m.goals).filter(([, v]) => v.g || v.a) : [];
        const allp = [...(m.teamA || []), ...(m.teamB || [])];
        return (
          <div key={m.id} className="ft-card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ background: "rgba(0,0,0,.25)", padding: "7px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">{d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</span>
              {amIAdmin && <button onClick={() => del(m.id)} className="ft-btn" style={{ background: "none", color: "var(--faint)", padding: 2 }}><Trash2 size={13} /></button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "18px 14px 12px" }}>
              <div style={{ textAlign: "center" }}><span className="bib bib-white" style={{ marginBottom: 6 }}>B</span><div className="num" style={{ fontSize: 44, color: m.scoreA > m.scoreB ? "var(--grass-bright)" : "var(--text)" }}>{m.scoreA}</div></div>
              <span style={{ color: "var(--faint)", fontWeight: 300, fontSize: 18 }}>x</span>
              <div style={{ textAlign: "center" }}><span className="bib bib-black" style={{ marginBottom: 6 }}>P</span><div className="num" style={{ fontSize: 44, color: m.scoreB > m.scoreA ? "var(--grass-bright)" : "var(--text)" }}>{m.scoreB}</div></div>
            </div>
            {scorers.length > 0 && (
              <div style={{ padding: "0 12px 12px", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {scorers.map(([pid, v]) => { const nm = firstName(allp.find((p) => p.id === pid)?.name || "?"); return (
                  <span key={pid} style={{ fontSize: 11, color: "var(--dim)", background: "var(--raised)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 10px" }}>{nm}{v.g ? <b style={{ color: "var(--grass-bright)" }}> {v.g}G</b> : ""}{v.a ? <b style={{ color: "var(--blue)" }}> {v.a}A</b> : ""}</span>); })}
              </div>
            )}
            <div style={{ background: "rgba(0,0,0,.2)", borderTop: "1px solid var(--line)", padding: 12, minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!open ? (mvp ? <div className="ft-pop" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gold)" }}><Trophy size={15} style={{ fill: "var(--gold)" }} /><span style={{ fontSize: 13, fontWeight: 700 }}>MVP: {firstName(mvp.name)} - {mvp.votes} votos</span></div> : <span style={{ fontSize: 11, color: "var(--faint)", fontStyle: "italic" }}>Votacao encerrada</span>)
                : myVote ? <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "var(--grass-bright)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Check size={11} /> Voto registado</div><div style={{ fontSize: 10, color: "var(--faint)" }}>Resultado em {left}h</div></div>
                  : voting === m.id ? <div style={{ display: "flex", gap: 8, width: "100%" }}><select value={pick} onChange={(e) => setPick(e.target.value)} className="ft-input" style={{ padding: 8, fontSize: 12 }}><option value="">Quem foi o craque?</option>{allp.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={() => vote(m)} className="ft-btn" style={{ background: "var(--gold)", color: "#1a1300", padding: "0 16px", fontSize: 12 }}>Votar</button></div>
                    : <button onClick={() => setVoting(m.id)} className="ft-btn" style={{ background: "none", color: "var(--gold)", fontSize: 12, fontWeight: 700 }}><Star size={13} /> Votar MVP - faltam {left}h</button>}
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
    { ok: fixedIds.includes(myProfile?.id), Icon: ShieldCheck, c: "var(--grass-bright)", t: "Membro fixo", d: "Inscrito na epoca/mes atual" },
  ];
  const Stat = ({ label, value, color }) => (<div className="ft-raised" style={{ borderRadius: 12, padding: 10, textAlign: "center" }}><div className="eyebrow" style={{ color: color || "var(--faint)" }}>{label}</div><div className="num" style={{ fontSize: 22, color: color || "var(--text)" }}>{value}</div></div>);
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ft-card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
        <Trophy size={120} style={{ position: "absolute", top: -10, right: -10, color: "var(--gold)", opacity: .06 }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ margin: "0 auto 10px", width: 84, height: 84 }}><Avatar name={myProfile?.name || "Eu"} size={84} /></div>
          <h2 className="num" style={{ fontSize: 24, color: "var(--chalk)", margin: 0 }}>{(myProfile?.name || "EU").toUpperCase()}</h2>
          <p className="eyebrow" style={{ marginTop: 4, marginBottom: 18 }}>Estatisticas de carreira</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            <Stat label="Jogos" value={s.games || 0} /><Stat label="Vitorias" value={s.wins || 0} color="var(--grass-bright)" /><Stat label="Win %" value={`${Math.round(winRate * 100)}%`} color="var(--blue)" />
            <Stat label="Golos" value={mine.g} color="var(--grass-bright)" /><Stat label="Assist." value={mine.a} color="var(--blue)" /><Stat label="MVPs" value={mvpCount(myProfile?.id)} color="var(--gold)" />
          </div>
          {amIAdmin && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(106,169,224,.1)", border: "1px solid rgba(106,169,224,.3)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "var(--blue)" }}><Star size={12} style={{ fill: "var(--blue)" }} /> Rating medio: {avg(myProfile)}</div>}
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
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--grass-bright)" }}>{p.g}G</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>{p.a}A</span>
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
const MembersTab = ({ fixedIds, setFixedIds, players, myProfile, showToast, paymentModel }) => {
  const season = paymentModel === "season";
  const inscrito = fixedIds.includes(myProfile?.id);
  return (
    <div className="ft-in ft-card" style={{ padding: 22 }}>
      <h3 style={{ textAlign: "center", fontSize: 14, fontWeight: 800, display: "flex", justifyContent: "center", gap: 8, margin: "0 0 4px" }}><ClipboardList size={18} style={{ color: "var(--grass-bright)" }} /> {season ? "Inscricoes da epoca" : "Inscricoes mensais"}</h3>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--dim)", margin: "0 0 18px" }}>{season ? "Inscreve-te como fixo desta epoca." : "Inscreve-te como fixo deste mes."}</p>
      {inscrito
        ? <button onClick={() => { setFixedIds((f) => f.filter((i) => i !== myProfile.id)); showToast("Inscricao cancelada"); }} className="ft-btn ft-danger" style={{ width: "100%", padding: 12, marginBottom: 18 }}>Cancelar inscricao</button>
        : <button onClick={() => { setFixedIds((f) => [...f, myProfile.id]); showToast("Inscrito como fixo!"); }} className="ft-btn ft-grass" style={{ width: "100%", padding: 12, marginBottom: 18 }}>Inscrever-me</button>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fixedIds.map((id) => { const p = players.find((pl) => pl.id === id); return p ? (
          <div key={id} className="ft-raised" style={{ borderRadius: 12, padding: 10, display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p.name} size={32} /><span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>{id === myProfile?.id && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "var(--grass-bright)", background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)", padding: "3px 8px", borderRadius: 8 }}>Eu</span>}</div>) : null; })}
      </div>
    </div>
  );
};

/* ----------------------------- Tesouraria -------------------------------- */
const TreasuryTab = ({ players, matches, setMatches, collectsFixed, fixedIds, payments, setPayments, fixedFee, fee, fixedLabel, totalRevenue, totalDebt, showToast }) => {
  const debtsOf = (pid) => {
    const arr = [];
    if (collectsFixed && fixedIds.includes(pid) && !payments[pid]) arr.push({ id: "fixed", desc: fixedLabel, amount: fixedFee, pay: () => { setPayments((p) => ({ ...p, [pid]: true })); showToast(`${fixedLabel} paga!`); } });
    matches.forEach((m) => { if (m.payments?.[pid] === false) arr.push({ id: m.id, desc: `Jogo ${new Date(m.date).toLocaleDateString("pt-PT", { day: "numeric", month: "numeric" })}`, amount: fee, pay: () => { setMatches((ms) => ms.map((x) => x.id === m.id ? { ...x, payments: { ...x.payments, [pid]: true } } : x)); showToast("Jogo pago!"); } }); });
    return arr;
  };
  const withDebt = players.map((p) => ({ ...p, debts: debtsOf(p.id) })).filter((p) => p.debts.length).sort((a, b) => b.debts.reduce((s, d) => s + d.amount, 0) - a.debts.reduce((s, d) => s + d.amount, 0));
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, display: "flex", gap: 8, margin: 0, alignItems: "center" }}><Wallet size={18} style={{ color: "var(--grass-bright)" }} /> Tesouraria</h2>
        <input type="month" defaultValue={new Date().toISOString().slice(0, 7)} className="ft-input" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="ft-card" style={{ padding: 16, background: "linear-gradient(135deg,rgba(34,197,94,.12),var(--card))", borderColor: "rgba(34,197,94,.25)" }}><div className="eyebrow" style={{ color: "var(--grass-bright)" }}>Recebido</div><div className="num" style={{ fontSize: 28, marginTop: 4 }}>{totalRevenue.toFixed(2)}EUR</div></div>
        <div className="ft-card" style={{ padding: 16, background: "linear-gradient(135deg,rgba(240,86,58,.12),var(--card))", borderColor: "rgba(240,86,58,.25)" }}><div className="eyebrow" style={{ color: "#ff9684" }}>Divida total</div><div className="num" style={{ fontSize: 28, marginTop: 4 }}>{totalDebt.toFixed(2)}EUR</div></div>
      </div>
      <div className="ft-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 14px", alignItems: "center" }}><AlertCircle size={17} style={{ color: "#ff9684" }} /> Dividas pendentes</h3>
        {withDebt.length === 0 ? <div style={{ textAlign: "center", color: "var(--faint)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><CheckCircle size={30} /><span>Tudo regularizado!</span></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {withDebt.map((p) => (
              <div key={p.id} className="ft-raised" style={{ borderRadius: 14, overflow: "hidden", borderColor: "rgba(240,86,58,.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "rgba(0,0,0,.2)", borderBottom: "1px solid var(--line)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p.name} size={32} /><div><div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>{p.type === "guest" && <div style={{ fontSize: 9, color: "var(--faint)" }}>Convidado</div>}</div></div><div className="num" style={{ fontSize: 18, color: "#ff9684" }}>{p.debts.reduce((s, d) => s + d.amount, 0).toFixed(2)}EUR</div></div>
                <div style={{ padding: 6 }}>{p.debts.map((d) => (<div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px" }}><span style={{ fontSize: 12, color: "var(--dim)" }}>{d.desc}</span><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 12, color: "var(--dim)" }}>{d.amount.toFixed(2)}EUR</span><button onClick={d.pay} className="ft-btn" style={{ background: "rgba(34,197,94,.15)", color: "var(--grass-bright)", padding: 7, borderRadius: 9 }}><CheckCircle size={15} /></button></div></div>))}</div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
};

/* ----------------------------- Definicoes -------------------------------- */
const SettingsTab = ({ settings, setSettings, next, setNext, isOwner, amIAdmin, showToast, onBack }) => {
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const Label = ({ children }) => <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>{children}</label>;
  const MODELS = [["pergame", "Jogo-a-jogo"], ["monthly", "Mensal"], ["season", "Epoca"]];
  return (
    <div className="ft-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 16px", alignItems: "center" }}><Wallet size={17} style={{ color: "var(--blue)" }} /> Modelo de pagamento</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, background: "#0a120f", padding: 4, borderRadius: 12, border: "1px solid var(--line)", marginBottom: 14 }}>
            {MODELS.map(([v, l]) => <button key={v} onClick={() => set("paymentModel", v)} className="ft-btn" style={{ padding: "9px 4px", fontSize: 12, background: settings.paymentModel === v ? "var(--grass)" : "none", color: settings.paymentModel === v ? "#04130a" : "var(--faint)" }}>{l}</button>)}
          </div>
          <p style={{ fontSize: 11, color: "var(--dim)", margin: "0 0 14px" }}>
            {settings.paymentModel === "pergame" && "Todos pagam um valor por cada jogo."}
            {settings.paymentModel === "monthly" && "Os fixos pagam uma mensalidade; convidados pagam por jogo."}
            {settings.paymentModel === "season" && "Os fixos pagam uma vez por toda a epoca; convidados pagam por jogo."}
          </p>
          {settings.paymentModel === "monthly" && <div style={{ marginBottom: 14 }}><Label>Valor da mensalidade (EUR)</Label><input type="number" step="0.50" className="ft-input" value={settings.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} /></div>}
          {settings.paymentModel === "season" && <div style={{ marginBottom: 14 }}><Label>Valor da epoca (EUR)</Label><input type="number" step="1" className="ft-input" value={settings.seasonFee} onChange={(e) => set("seasonFee", e.target.value)} /></div>}
          <Label>Preco por jogo ({settings.paymentModel === "pergame" ? "todos" : "convidados"}) (EUR)</Label>
          <input type="number" step="0.10" className="ft-input" value={settings.guestFee} onChange={(e) => set("guestFee", e.target.value)} />
        </div>
      )}
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 16px", alignItems: "center" }}><Clock size={17} style={{ color: "var(--blue)" }} /> Proximo jogo</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><Label>Data</Label><input type="date" className="ft-input" defaultValue={new Date(next.date).toISOString().slice(0, 10)} /></div>
            <div><Label>Hora</Label><input type="time" className="ft-input" defaultValue={new Date(next.date).toTimeString().slice(0, 5)} /></div>
          </div>
          <Label>Periodicidade</Label>
          <select className="ft-input" value={next.frequency} onChange={(e) => setNext((n) => ({ ...n, frequency: e.target.value }))}><option value="once">Apenas uma vez</option><option value="weekly">Semanalmente</option><option value="biweekly">Quinzenalmente</option></select>
        </div>
      )}
      {amIAdmin && (
        <div className="ft-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", gap: 8, margin: "0 0 12px", alignItems: "center" }}><MapIcon size={17} style={{ color: "var(--grass-bright)" }} /> Localizacao do campo</h3>
          <input className="ft-input" placeholder="Cola aqui o link do Google Maps..." />
          <p style={{ fontSize: 10, color: "var(--faint)", marginTop: 8 }}>A meteorologia e atualizada com base neste link.</p>
        </div>
      )}
      {amIAdmin && <button onClick={() => showToast("Definicoes guardadas!")} className="ft-btn" style={{ width: "100%", background: "var(--blue)", color: "#04101c", padding: 13 }}><Save size={18} /> Guardar definicoes</button>}
      <div style={{ border: "1px solid rgba(240,86,58,.3)", background: "rgba(240,86,58,.05)", borderRadius: 18, padding: 20, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ff9684", fontWeight: 800, marginBottom: 10 }}><ShieldAlert size={18} /> Zona de perigo</div>
        <p style={{ fontSize: 13, color: "#ffb3a5", margin: "0 0 14px" }}>{isOwner ? "Como dono, podes apagar este grupo permanentemente. Esta acao e irreversivel." : "Se saires do grupo, deixas de receber convocatorias. O historico e mantido."}</p>
        <button onClick={onBack} className="ft-btn ft-danger" style={{ width: "100%", padding: 13 }}>{isOwner ? <><Trash2 size={17} /> Apagar grupo</> : <><LogOut size={17} /> Sair do grupo</>}</button>
      </div>
    </div>
  );
};

/* ============================== ROOT ===================================== */
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [group, setGroup] = useState(null);
  return (
    <div className="ft" style={{ minHeight: "100vh" }}>
      <style>{STYLES}</style>
      {screen === "auth" && <AuthScreen onEnter={() => setScreen("groups")} />}
      {screen === "groups" && <GroupSelector onOpen={(g) => { setGroup(g); setScreen("group"); }} onProfile={() => setScreen("profile")} />}
      {screen === "profile" && <ProfileScreen onBack={() => setScreen("groups")} />}
      {screen === "group" && <GroupDashboard group={group} onBack={() => setScreen("groups")} />}
    </div>
  );
}
