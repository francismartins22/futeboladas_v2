import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CalendarCheck, Shield, History as HistoryIcon, UserPlus, Plus, Trash2, 
  Shuffle, Check, ArrowLeft, ArrowRight, LogOut, LayoutGrid, 
  PlusCircle, Loader2, Globe, User, Camera, Save,
  ShieldCheck, Crown, ShieldAlert, Settings, Copy, Star, Trophy, AlertCircle,
  Link as LinkIcon, Clock, Map as MapIcon, MapPin, ExternalLink,
  Wallet, ClipboardList, CheckCircle, Banknote, X, Award, Flame, Medal, Activity, RefreshCw, Eraser, Share2, TrendingUp
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile, 
  signInWithCustomToken, signInAnonymously 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, doc, updateDoc, 
  onSnapshot, deleteDoc, serverTimestamp, query, orderBy, setDoc, getDoc, where, arrayUnion, getDocs, arrayRemove 
} from 'firebase/firestore';

// =================================================================================
// === 1. ZONA DE EMERGÊNCIA (EXECUTA ANTES DE TUDO) ===
// =================================================================================
const APP_VERSION = "2.6.4"; 

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message?.toLowerCase() || '';
    if (msg.includes('loading chunk') || msg.includes('unexpected token') || msg.includes('importing a module') || msg.includes('failed to load resource')) {
      console.warn('🚨 Erro crítico de ficheiros (404). A tentar recuperar...');
      const lastRescue = sessionStorage.getItem('app_last_rescue');
      if (!lastRescue || Date.now() - parseInt(lastRescue) > 10000) {
          sessionStorage.setItem('app_last_rescue', Date.now().toString());
          if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                  regs.forEach(reg => reg.unregister());
              });
          }
          window.location.reload(); 
      }
    }
  }, true);

  try {
      const storedVersion = localStorage.getItem('app_version');
      if (storedVersion !== APP_VERSION) {
          console.log(`♻️ Nova versão ${APP_VERSION} detetada (Era: ${storedVersion}). A limpar lixo...`);
          if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(registrations => {
                  for(let registration of registrations) { registration.unregister(); }
              }).catch(err => console.warn("SW cleanup ignore:", err));
          }
          if ('caches' in window) {
              caches.keys().then(names => { names.forEach(name => caches.delete(name)); });
          }
          localStorage.setItem('app_version', APP_VERSION);
      }
  } catch (e) {
      console.warn("Erro não crítico na verificação de versão:", e);
  }
}

// --- DETEÇÃO DE AMBIENTE (Canvas vs Produção) ---
const IS_CANVAS = typeof __firebase_config !== 'undefined';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = IS_CANVAS 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCgfsrpIIj0XWp7Uc2FNGgKIibtWriHR_c",
      authDomain: "futeboladas-v2-dev.firebaseapp.com",
      projectId: "futeboladas-v2-dev",
      storageBucket: "futeboladas-v2-dev.firebasestorage.app",
      messagingSenderId: "899361657772",
      appId: "1:899361657772:web:cdd265c50fc9574119e009"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID da App e Caminhos da Base de Dados (Adaptáveis)
const APP_ID = IS_CANVAS && typeof __app_id !== 'undefined' ? __app_id : "futeboladas-v2";

const getCollectionPath = (collectionName) => {
    return IS_CANVAS 
        ? `artifacts/${APP_ID}/public/data/${collectionName}` // Caminho seguro do Canvas
        : collectionName; // Caminho normal de produção
};

const getUserDocPath = (userId) => {
    return IS_CANVAS
        ? `artifacts/${APP_ID}/public/data/users/${userId}`
        : `users/${userId}`;
};

// --- HELPERS E COMPONENTES VISUAIS ---

const SoccerBall = ({ className = "", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 17l-4.2-2.5 1.6-5.1h5.2l1.6 5.1z"/><path d="m12 17v5"/><path d="m7.8 14.5-4 2.8"/><path d="m16.2 14.5 4 2.8"/><path d="m9.4 9.4-4.2-2.6"/><path d="m14.6 9.4 4.2-2.6"/>
  </svg>
);

const getCoordsFromUrl = (url) => {
  try {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    const queryRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = url.match(queryRegex);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    return null;
  } catch (e) { return null; }
};

const StarRating = ({ value, onChange, readOnly = false, size = 14 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} onClick={(e) => { e.stopPropagation(); if (!readOnly) onChange(star); }} disabled={readOnly} className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}>
        <Star size={size} className={`${star <= value ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'}`} />
      </button>
    ))}
  </div>
);

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[64px] flex-shrink-0 ${active ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} /> 
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

// --- COMPONENTES SECUNDÁRIOS ---

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    console.error("Crash React:", error, errorInfo);
    this.setState({ errorInfo: error?.message || "Erro desconhecido" });
  }
  handleHardReset = () => {
    if ('caches' in window) { caches.keys().then((names) => { names.forEach((name) => { caches.delete(name); }); }); }
    window.location.href = window.location.href;
    window.location.reload(true);
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center animate-in fade-in">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30"><Activity size={32} className="text-red-400" /></div>
            <h1 className="text-xl font-bold mb-2">Jogo interrompido! 🤕</h1>
            <p className="text-slate-400 text-xs mb-6">Tenta recarregar a aplicação.</p>
            <button onClick={this.handleHardReset} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2"><RefreshCw size={18}/> Recarregar App</button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch(e) { setError("Erro Google (Popup bloqueado?)"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 border-2 border-white/10 group hover:rotate-6 transition-transform duration-500">
            <SoccerBall className="text-white drop-shadow-md" size={48} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Futeboladas</h1>
          <p className="text-emerald-400 font-medium text-sm uppercase tracking-widest mt-1">Gestor de Equipas V2</p>
        </div>
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl text-left mt-8">
          <h2 className="text-xl font-bold mb-6 text-white text-center">{isLogin ? "Entrar em Campo" : "Criar Conta"}</h2>
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/20">{error}</div>}
          <button onClick={handleGoogle} className="w-full bg-white text-slate-900 py-3 rounded-lg font-bold mb-4 flex justify-center gap-2 items-center hover:bg-slate-100 transition-colors"><Globe size={18}/> Continuar com Google</button>
          <div className="relative py-2 text-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-500">Ou usar email</span></div></div>
          <form onSubmit={handleAuth} className="space-y-4 mt-4">
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Email" required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Password" required />
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/20">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (isLogin ? "Entrar" : "Registar")}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-emerald-400 text-sm hover:underline text-center block">{isLogin ? "Ainda não tens conta? Cria grátis" : "Já tens conta? Faz login"}</button>
        </div>
      </div>
    </div>
  );
};

const UserProfile = ({ user, onLogout }) => {
  const [name, setName] = useState(user.displayName || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [msg, setMsg] = useState("");
  const [globalStats, setGlobalStats] = useState({ games: 0, wins: 0, mvps: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const docSnap = await getDoc(doc(db, getUserDocPath(user.uid))); // FIX: Caminho dinâmico
        if (docSnap.exists()) {
          const data = docSnap.data();
          if(data.name) setName(data.name);
          if(data.photoUrl) setPhotoUrl(data.photoUrl);
        }
        const groupsQuery = query(collection(db, getCollectionPath('groups')), where('members', 'array-contains', user.uid)); // FIX: Caminho dinâmico
        const groupsSnap = await getDocs(groupsQuery);
        let totalGames = 0, totalWins = 0, totalMvps = 0; 
        for (const groupDocSnapshot of groupsSnap.docs) {
           const groupRef = groupDocSnapshot.ref;
           const playersQuery = query(collection(groupRef, 'players'), where('uid', '==', user.uid));
           const playersSnap = await getDocs(playersQuery);
           let myPlayerIdInGroup = null;
           playersSnap.forEach(pDoc => {
              const pData = pDoc.data();
              if (pData.stats) { totalGames += (pData.stats.games || 0); totalWins += (pData.stats.wins || 0); }
              myPlayerIdInGroup = pDoc.id;
           });
           if (myPlayerIdInGroup) {
               try {
                   const matchesQuery = query(collection(groupRef, 'matches'));
                   const matchesSnap = await getDocs(matchesQuery);
                   matchesSnap.forEach(mDoc => {
                       const mData = mDoc.data();
                       if (mData.mvpVotes) {
                           const counts = {};
                           Object.values(mData.mvpVotes).forEach(pid => counts[pid] = (counts[pid] || 0) + 1);
                           let maxVotes = 0; let winnerId = null;
                           Object.entries(counts).forEach(([pid, count]) => { if (count > maxVotes) { maxVotes = count; winnerId = pid; } });
                           if (winnerId === myPlayerIdInGroup) totalMvps++;
                       }
                   });
               } catch (err) { console.error("Erro stats", err); }
           }
        }
        setGlobalStats({ games: totalGames, wins: totalWins, mvps: totalMvps });
      } catch (e) { console.error(e); } finally { setLoadingData(false); }
    };
    fetchProfileAndStats();
  }, [user.uid]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMsg("Imagem muito grande (Max 5MB)");
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 512; const MAX_HEIGHT = 512;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoUrl(compressedBase64);
        setUploading(false);
      };
    };
  };

  const handleSave = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("O nome é obrigatório.");
    try {
      setUploading(true);
      await updateProfile(auth.currentUser, { displayName: name });
      await setDoc(doc(db, getUserDocPath(user.uid)), { name: name, photoUrl: photoUrl, updatedAt: serverTimestamp() }, { merge: true }); // FIX: Caminho dinâmico
      setMsg("Perfil atualizado com sucesso!");
    } catch (e) { setMsg("Erro ao guardar perfil."); console.error(e); } finally { setUploading(false); }
  };

  if(loadingData) return <div className="p-10 text-center text-emerald-500"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="p-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><User className="text-emerald-500" /> Meu Perfil</h2>
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center shadow-lg group-hover:border-emerald-500 transition-colors">
                {photoUrl ? <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
              </div>
              <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-lg border border-slate-900 group-hover:scale-110 transition-transform">{uploading ? <Activity className="animate-spin" size={16}/> : <Camera size={16} />}</div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <p className="text-xs text-slate-500 mt-2">Toque para alterar a foto</p>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Nome de Jogador</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="O teu nome..." /></div>
          {msg && <div className={`text-sm text-center p-2 rounded ${msg.includes('sucesso') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>{msg}</div>}
          <button onClick={handleSave} disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{uploading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {uploading ? "A guardar..." : "Guardar Alterações"}</button>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Globe size={100} className="text-blue-500"/></div>
           <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><Trophy size={18} className="text-yellow-400"/> Números Globais</h3>
           <p className="text-xs text-slate-400 mb-4">O somatório da tua carreira em todos os grupos.</p>
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-center"><div className="text-xs text-slate-500 font-bold uppercase mb-1">Jogos</div><div className="text-xl font-bold text-white">{globalStats.games}</div></div>
              <div className="bg-emerald-900/20 p-3 rounded-xl border border-emerald-500/30 text-center"><div className="text-xs text-emerald-500 font-bold uppercase mb-1">Vitórias</div><div className="text-xl font-bold text-emerald-400">{globalStats.wins}</div></div>
              <div className="bg-yellow-900/20 p-3 rounded-xl border border-yellow-500/20 text-center"><div className="text-xs text-yellow-500 font-bold uppercase mb-1">MVPs</div><div className="text-xl font-bold text-yellow-400">{globalStats.mvps}</div></div>
              <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/30 text-center"><div className="text-xs text-blue-500 font-bold uppercase mb-1">Win Rate</div><div className="text-xl font-bold text-blue-400">{globalStats.games > 0 ? Math.round((globalStats.wins / globalStats.games) * 100) : 0}%</div></div>
           </div>
        </div>
        <div className="pt-4 border-t border-slate-700"><button onClick={onLogout} className="w-full py-3 text-red-400 hover:bg-red-900/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><LogOut size={16}/> Terminar Sessão</button></div>
      </div>
    </div>
  );
};

const GroupDashboard = ({ group, currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [nextGame, setNextGame] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editFreq, setEditFreq] = useState("weekly");
  const [editLocationUrl, setEditLocationUrl] = useState("");
  const [hasMonthlyFee, setHasMonthlyFee] = useState(true);
  const [guestFee, setGuestFee] = useState(4.5);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyFixedIds, setMonthlyFixedIds] = useState([]); 
  const [monthlyPayments, setMonthlyPayments] = useState({}); 
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [votingStars, setVotingStars] = useState(3);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addPlayerType, setAddPlayerType] = useState('guest'); 
  const [guestHostId, setGuestHostId] = useState(''); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [votingMatchId, setVotingMatchId] = useState(null);
  const [mvpSelectedId, setMvpSelectedId] = useState("");

  const groupRef = (col) => collection(db, getCollectionPath('groups'), group.id, col); // FIX: Caminho dinâmico
  const groupDoc = (col, id) => doc(db, getCollectionPath('groups'), group.id, col, id); // FIX: Caminho dinâmico
  
  const isOwner = group.ownerId === currentUser.uid;
  const myPlayerProfile = players.find(p => p.uid === currentUser.uid);
  const amIAdmin = isOwner || (myPlayerProfile && myPlayerProfile.isAdmin);

  useEffect(() => {
    if (nextGame && nextGame.date && nextGame.frequency && nextGame.frequency !== 'once') {
        const gameDate = new Date(nextGame.date);
        const now = new Date();
        const tolerance = 24 * 60 * 60 * 1000;
        if (now.getTime() > gameDate.getTime() + tolerance && amIAdmin) {
            const nextDate = new Date(gameDate);
            if (nextGame.frequency === 'weekly') { while (nextDate.getTime() + tolerance < now.getTime()) { nextDate.setDate(nextDate.getDate() + 7); } } 
            else if (nextGame.frequency === 'biweekly') { while (nextDate.getTime() + tolerance < now.getTime()) { nextDate.setDate(nextDate.getDate() + 14); } }
            if (nextDate.getTime() !== gameDate.getTime()) { setDoc(groupDoc('schedule', 'next'), { date: nextDate.toISOString(), frequency: nextGame.frequency, responses: {} }, { merge: true }); }
        }
    }
  }, [nextGame, amIAdmin]);

  const getMatchMVP = (m) => { 
      if (!m.mvpVotes) return null; 
      const c = {}; 
      Object.values(m.mvpVotes).forEach(id => c[id]=(c[id]||0)+1); 
      let max=0, win=null; 
      Object.entries(c).forEach(([id, n]) => { if(n>max){max=n;win=id} }); 
      const p = players.find(pl=>pl.id===win); 
      return p ? {...p, votes: max} : null; 
  };
  
  // FIX: Previne crash se 'p' for undefined e limita a 1 casa decimal
  const getAverageRating = (p) => { 
    if(!p) return 3;
    const v = Object.values(p.votes || {}); 
    return v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : 3; 
  };
  const getPlayerRatingValue = (p) => parseFloat(getAverageRating(p));

  const calculatePlayerDebt = (playerId) => { let total = 0; if (hasMonthlyFee && monthlyFixedIds.includes(playerId)) { if (!monthlyPayments[playerId]) total += monthlyFee; } matches.forEach(m => { if (m.payments && m.payments[playerId] === false) total += guestFee; }); return total; };
  const getMVPCount = (pid) => matches.filter(m => getMatchMVP(m)?.id === pid).length;
  const totalGuestRevenue = matches.reduce((sum, m) => { const payingPlayersCount = m.payments ? Object.keys(m.payments).filter(pid => m.payments[pid] === true).length : 0; return sum + (payingPlayersCount * guestFee); }, 0);
  const totalPendingDebt = players.reduce((sum, p) => sum + calculatePlayerDebt(p.id), 0);

  useEffect(() => {
    const unsubP = onSnapshot(groupRef('players'), s => setPlayers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const qMatches = query(groupRef('matches'), orderBy('createdAt', 'desc'));
    const unsubM = onSnapshot(qMatches, s => setMatches(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubG = onSnapshot(groupDoc('schedule', 'next'), s => {
      if (s.exists()) { const data = s.data(); setNextGame(data); if (data.date) { const d = new Date(data.date); setEditDate(d.toISOString().split('T')[0]); setEditTime(d.toTimeString().slice(0,5)); } if (data.frequency) setEditFreq(data.frequency); } else { setNextGame({ date: new Date().toISOString(), responses: {} }); }
    });
    return () => { unsubP(); unsubM(); unsubG(); };
  }, [group.id]);

  useEffect(() => {
    const unsubGroup = onSnapshot(doc(db, getCollectionPath('groups'), group.id), (s) => { if(s.exists()) { const data = s.data(); setEditLocationUrl(data.locationUrl || ""); if (data.settings) { setHasMonthlyFee(data.settings.hasMonthlyFee ?? true); setGuestFee(data.settings.guestFee ?? 4.5); } } }); // FIX: Caminho dinâmico
    return () => unsubGroup();
  }, [group.id]);

  useEffect(() => {
    const monthDocRef = groupDoc('treasury', `month_${currentMonth}`);
    const unsubTreasury = onSnapshot(monthDocRef, (docSnap) => { if (docSnap.exists()) { const data = docSnap.data(); setMonthlyFixedIds(Array.isArray(data.fixedIds) ? data.fixedIds : []); setMonthlyPayments(data.payments || {}); if (data.monthlyFee) setMonthlyFee(data.monthlyFee); } else { setMonthlyFixedIds([]); setMonthlyPayments({}); } });
    return () => unsubTreasury();
  }, [group.id, currentMonth]);

  useEffect(() => {
    if (players.length > 0) { const syncProfile = async () => { const myPlayer = players.find(p => p.uid === currentUser.uid); if (myPlayer) { try { const userDoc = await getDoc(doc(db, getUserDocPath(currentUser.uid))); if (userDoc.exists()) { const userData = userDoc.data(); const latestPhoto = userData.photoUrl || currentUser.photoURL; const latestName = userData.name || currentUser.displayName; const updates = {}; if (myPlayer.photoUrl !== latestPhoto) updates.photoUrl = latestPhoto; if (myPlayer.name !== latestName) updates.name = latestName; if (Object.keys(updates).length > 0) await updateDoc(groupDoc('players', myPlayer.id), updates); } } catch(e) { console.error("Erro sync:", e); } } }; syncProfile(); } // FIX: Caminho dinâmico
  }, [players.length, currentUser.uid]); 

  useEffect(() => {
    if (activeTab === 'team' && players.length > 0 && !isGenerated) { const goingUids = Object.entries(nextGame?.responses || {}).filter(([uid, status]) => status === 'going').map(([uid]) => uid); const confirmedPlayerIds = players.filter(p => p.uid && goingUids.includes(p.uid)).map(p => p.id); if (selectedIds.length === 0 && confirmedPlayerIds.length > 0) { setSelectedIds(confirmedPlayerIds); showToast("Jogadores confirmados pré-selecionados!"); } }
  }, [activeTab, players, nextGame, isGenerated]); 

  const showToast = (msg, type='success') => { setToast({show: true, msg, type}); setTimeout(() => setToast({show: false, msg: '', type: 'success'}), 3000); };
  const copyInviteCode = () => { navigator.clipboard.writeText(group.id).then(() => { setIsCopied(true); showToast("Copiado!"); setTimeout(() => setIsCopied(false), 2000); }).catch(() => showToast("Erro", "error")); };
  const toggleSchedule = async (status) => { const newResponses = { ...nextGame?.responses, [currentUser.uid]: status }; await setDoc(groupDoc('schedule', 'next'), { date: nextGame?.date || new Date().toISOString(), responses: newResponses }, { merge: true }); showToast(status === 'going' ? "Confirmado!" : "Removido"); };
  
  const addPlayer = async () => { if(!newPlayerName.trim()) return showToast("Nome inválido", "error"); if (addPlayerType === 'guest' && !guestHostId) return showToast("Selecione quem convidou.", "error"); let finalName = newPlayerName; if (addPlayerType === 'guest') { const host = players.find(p => p.id === guestHostId); if (host) { const hostFirstName = host.name.split(' ')[0]; finalName = `${newPlayerName} (C - ${hostFirstName})`; } } await addDoc(groupRef('players'), { name: finalName, type: addPlayerType, hostId: addPlayerType === 'guest' ? guestHostId : null, stats: { games: 0, wins: 0, draws: 0, losses: 0, mvps: 0 }, isAdmin: false, votes: {}, createdAt: serverTimestamp() }); setNewPlayerName(''); showToast("Adicionado!"); };
  const joinAsPlayer = async () => { const already = players.find(p => p.uid === currentUser.uid); if(already) return showToast("Já estás no plantel!", "error"); let photo = currentUser.photoURL; try { const ud = await getDoc(doc(db, getUserDocPath(currentUser.uid))); if(ud.exists()) photo = ud.data().photoUrl || photo; } catch(e){} await addDoc(groupRef('players'), { name: currentUser.displayName || "Eu", uid: currentUser.uid, type: 'member', stats: { games: 0, wins: 0, draws: 0, losses: 0, mvps: 0 }, isAdmin: isOwner, photoUrl: photo, votes: {}, createdAt: serverTimestamp() }); showToast("Entraste!"); }; // FIX: Caminho dinâmico
  const deletePlayer = async (id) => { if (!amIAdmin) return; if(window.confirm("Apagar?")) await deleteDoc(groupDoc('players', id)); };
  const deleteMatch = async (id) => { if (!amIAdmin) return; if(window.confirm("Apagar jogo?")) await deleteDoc(groupDoc('matches', id)); };
  const leaveThisGroup = async () => { if (isOwner) return showToast("Dono não sai.", "error"); if(window.confirm("Sair do grupo?")) { await updateDoc(doc(db, getCollectionPath('groups'), group.id), { members: arrayRemove(currentUser.uid) }); onBack(); } }; // FIX: Caminho dinâmico
  const deleteThisGroup = async () => { if(window.confirm("Apagar grupo para sempre?")) { await deleteDoc(doc(db, getCollectionPath('groups'), group.id)); onBack(); } }; // FIX: Caminho dinâmico
  const toggleAdmin = async (p) => { if (!isOwner || p.uid === group.ownerId) return; await updateDoc(groupDoc('players', p.id), { isAdmin: !p.isAdmin }); showToast("Admin alterado"); };
  const saveMonthlyFee = async (val) => { await setDoc(groupDoc('treasury', `month_${currentMonth}`), { monthlyFee: parseInt(val) }, { merge: true }); setMonthlyFee(val); showToast("Guardado"); };
  const toggleMonthlyPayment = async (pid) => { const newP = { ...(monthlyPayments || {}), [pid]: !(monthlyPayments || {})[pid] }; await setDoc(groupDoc('treasury', `month_${currentMonth}`), { payments: newP }, { merge: true }); };
  const selfSignUp = async () => { const mp = players.find(p => p.uid === currentUser.uid); if (!mp) return; if (monthlyFixedIds.includes(mp.id)) return; const newIds = [...monthlyFixedIds, mp.id]; await setDoc(groupDoc('treasury', `month_${currentMonth}`), { fixedIds: newIds, payments: monthlyPayments }, { merge: true }); showToast("Inscrito!"); };
  const selfSignOut = async () => { const mp = players.find(p => p.uid === currentUser.uid); if (!mp) return; const newIds = monthlyFixedIds.filter(id => id !== mp.id); await setDoc(groupDoc('treasury', `month_${currentMonth}`), { fixedIds: newIds, payments: monthlyPayments }, { merge: true }); showToast("Cancelado."); };
  const settleMatchPayment = async (mid, pid) => { const newP = { ...matches.find(m=>m.id===mid).payments, [pid]: true }; await updateDoc(groupDoc('matches', mid), { payments: newP }); showToast("Pago!"); };
  
  const getPlayerDebts = (playerId) => { const debts = []; if (hasMonthlyFee && monthlyFixedIds.includes(playerId) && !monthlyPayments[playerId]) { debts.push({ id: 'monthly', desc: 'Mensalidade', amount: monthlyFee, action: () => toggleMonthlyPayment(playerId) }); } matches.forEach(m => { if (m.payments && m.payments[playerId] === false) { debts.push({ id: m.id, desc: `Jogo ${new Date(m.date).toLocaleDateString('pt-PT', {day:'numeric', month:'numeric'})}`, amount: guestFee, action: () => settleMatchPayment(m.id, playerId) }); } }); return debts; };
  const saveGameSettings = async () => { const u = {}; if(editDate && editTime) u.date = `${editDate}T${editTime}:00`; if(editFreq) u.frequency = editFreq; if(Object.keys(u).length) await setDoc(groupDoc('schedule', 'next'), u, { merge: true }); const gu = { settings: { hasMonthlyFee, guestFee: parseFloat(guestFee) } }; if(editLocationUrl) { const c = getCoordsFromUrl(editLocationUrl); gu.locationUrl = editLocationUrl; if(c) gu.location = c; } await updateDoc(doc(db, getCollectionPath('groups'), group.id), gu); if(hasMonthlyFee) await saveMonthlyFee(monthlyFee); showToast("Guardado!"); }; // FIX: Caminho dinâmico
  const submitPlayerVote = async (p, r) => { await updateDoc(groupDoc('players', p.id), { votes: { ...p.votes, [currentUser.uid]: r } }); setExpandedPlayerId(null); showToast("Votado!"); };
  
  // FIX: Lógica de tempo MVP
  const isVoteOpen = (matchDate) => {
    if(!matchDate) return false;
    const gameTime = new Date(matchDate).getTime();
    const now = Date.now();
    const hoursDiff = (now - gameTime) / (1000 * 60 * 60);
    return hoursDiff <= 48;
  };

  const renderPlayerCard = (p) => {
     const myVote = p.votes?.[currentUser.uid] || 0;
     const isExpanded = expandedPlayerId === p.id;
     
     // FIX: Visibilidade Stats
     const showStats = true; 
     const showRating = amIAdmin || p.uid === currentUser.uid;

     return (
        <div key={p.id} onClick={() => { if (isExpanded) setExpandedPlayerId(null); else { setExpandedPlayerId(p.id); setVotingStars(myVote || 3); } }}>
            <div className={`bg-slate-800/50 p-3 rounded-lg border transition-all cursor-pointer ${isExpanded ? 'border-emerald-500/50 bg-slate-800 shadow-lg' : 'border-slate-700 hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border relative overflow-hidden ${p.isAdmin ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}{p.isAdmin && <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5"><Crown size={6} className="text-black"/></div>}</div>
                    <div className="flex-1">
                        <div className="font-bold text-sm text-white flex items-center gap-1">{p.name}{p.isAdmin && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1 rounded">Admin</span>}</div>
                        <div className="text-[10px] text-slate-500 flex gap-2 items-center">
                             {/* FIX: Stats para todos */}
                             {showStats && (
                                <span className="text-slate-400 flex gap-2">
                                   <span>🎮 {p.stats?.games || 0}</span>
                                   <span>🏆 {p.stats?.wins || 0}</span>
                                   <span>⭐ {getMVPCount(p.id)}</span>
                                </span>
                             )}
                             {/* FIX: Rating condicional */}
                             {showRating ? (
                                <span className="text-yellow-500 flex items-center gap-1 font-bold ml-2 border-l border-slate-700 pl-2"><Star size={10} fill="currentColor"/> {getAverageRating(p)}</span>
                             ) : (
                                myVote ? <span className="text-emerald-500 font-medium ml-2 border-l border-slate-700 pl-2">Avaliado</span> : <span className="ml-2 border-l border-slate-700 pl-2">Toca p/ avaliar</span>
                             )}
                        </div>
                    </div>
                    <div className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}><ArrowRight size={16}/></div>
                </div>
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 animate-in slide-in-from-top-2 fade-in duration-300">
                        {p.uid !== currentUser.uid && (<div className="mb-4 text-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50"><div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Classificar</div><div className="flex justify-center mb-3"><StarRating value={votingStars} onChange={setVotingStars} size={28} /></div><button onClick={(e) => { e.stopPropagation(); submitPlayerVote(p, votingStars); }} className="w-full bg-slate-700 hover:bg-slate-600 text-xs py-2 rounded-lg text-white font-bold transition-colors">Confirmar</button></div>)}
                        {amIAdmin && (<div className="flex gap-2 pt-2 border-t border-slate-700/50">{isOwner && p.uid !== group.ownerId && (<button onClick={(e) => { e.stopPropagation(); toggleAdmin(p); }} className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-yellow-500/30 text-yellow-400 bg-yellow-900/10 hover:bg-yellow-900/20 flex items-center justify-center gap-1">{p.isAdmin ? "Remover Admin" : "Promover Admin"}</button>)}<button onClick={(e) => { e.stopPropagation(); deletePlayer(p.id); }} className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-red-500/30 text-red-400 bg-red-900/10 hover:bg-red-900/20 flex items-center justify-center gap-1"><Trash2 size={14}/> Eliminar</button></div>)}
                    </div>
                )}
            </div>
        </div>
     );
  };

  const renderSelectionGrid = (list) => {
      if (list.length === 0) return null;
      return (
          <div className="grid grid-cols-2 gap-2">
            {list.map(p => (
                <div key={p.id} onClick={() => toggleSelection(p.id)} className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${selectedIds.includes(p.id) ? 'bg-emerald-900/30 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedIds.includes(p.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>{selectedIds.includes(p.id) && <Check size={10} className="text-white"/>}</div>
                    <div className="truncate"><span className="text-xs font-medium block">{p.name}</span>{amIAdmin && <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><Star size={8} className="fill-slate-500"/> {getAverageRating(p)}</span>}</div>
                </div>
            ))}
          </div>
      );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 animate-in fade-in duration-300 relative">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3"><button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-full text-slate-300"><ArrowLeft size={20} /></button><h2 className="font-bold text-white text-lg flex items-center gap-2"><Users size={18} className="text-emerald-400"/> {group.name}</h2></div>
        <div className="flex gap-2">{isOwner && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30 flex items-center gap-1"><Crown size={10}/> Dono</span>}<button onClick={copyInviteCode} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1">{isCopied ? <Check size={10}/> : <Copy size={10}/>} {isCopied ? "Copiado" : "Convidar"}</button></div>
      </div>
      {toast.show && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-bold flex items-center gap-2 ${toast.type==='error'?'bg-red-500':'bg-emerald-500'} text-white`}>{toast.msg}</div>}
      
      <div className="flex-1 overflow-y-auto p-4 pb-28 no-scrollbar">
        {activeTab === 'schedule' && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center shadow-lg max-w-md mx-auto">
                <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Próxima Peladinha</h3>
                <div className="text-2xl font-bold text-white mb-4">{nextGame?.date ? new Date(nextGame.date).toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long', hour:'2-digit', minute:'2-digit'}) : 'A definir'}</div>
                {editLocationUrl && <div className="flex justify-center mb-6"><div className="rounded-xl overflow-hidden border border-slate-700 relative h-32 w-full bg-slate-800 group cursor-pointer" onClick={() => window.open(editLocationUrl, '_blank')}><div className="absolute inset-0 bg-slate-800 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]"><div className="bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform shadow-lg"><MapPin size={16} className="text-red-500 fill-red-500/20" /> Ver no Mapa</div></div></div></div>}
                <div className="grid grid-cols-2 gap-4"><button onClick={()=>toggleSchedule('going')} className={`p-4 rounded-xl border ${nextGame?.responses?.[currentUser.uid]==='going'?'bg-emerald-600 border-emerald-400':'bg-slate-700 border-slate-600'} text-white font-bold`}>👍 Vou</button><button onClick={()=>toggleSchedule('not_going')} className={`p-4 rounded-xl border ${nextGame?.responses?.[currentUser.uid]==='not_going'?'bg-red-600 border-red-400':'bg-slate-700 border-slate-600'} text-white font-bold`}>👎 Não Vou</button></div>
                <div className="mt-4 pt-4 border-t border-slate-700 text-left"><div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Confirmados ({Object.values(nextGame?.responses||{}).filter(s=>s==='going').length})</div><div className="flex flex-wrap gap-2">{Object.entries(nextGame?.responses||{}).filter(([_,s])=>s==='going').map(([uid]) => { const p = players.find(pl=>pl.uid===uid); return p ? <div key={uid} className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 pr-4 rounded-full border border-slate-600"><div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden border border-slate-500 shadow-sm">{p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}</div><span className="text-xs text-white font-medium">{p.name}</span></div> : null; })}</div></div>
            </div>
        )}
        
        {/* FIX: Aba Membros condicional */}
        {activeTab === 'members' && hasMonthlyFee && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center max-w-md mx-auto">
                <h3 className="text-white font-bold mb-4 flex justify-center gap-2 text-sm"><ClipboardList size={18} className="text-emerald-400"/> Inscrições Mensais</h3>
                <div className="flex justify-center gap-4 mb-6">{monthlyFixedIds.includes(myPlayerProfile?.id) ? <button onClick={selfSignOut} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold w-full">Cancelar</button> : <button onClick={selfSignUp} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold w-full">Inscrever</button>}</div>
                <div className="text-left space-y-2">{monthlyFixedIds.map(pid => { const p = players.find(pl=>pl.id===pid); return p ? <div key={pid} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden border border-slate-600">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}</div><span className="text-sm text-white font-medium">{p.name}</span>{pid === myPlayerProfile?.id && <span className="ml-auto text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Eu</span>}</div> : null; })}</div>
            </div>
        )}
        
        {activeTab === 'players' && (
          <div className="space-y-6 max-w-md mx-auto">
            {!players.find(p => p.uid === currentUser.uid) && (<div onClick={joinAsPlayer} className="bg-emerald-900/30 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-900/50 transition-colors mb-4 animate-pulse"><div className="flex items-center gap-3"><div className="bg-emerald-600 p-2 rounded-full text-white"><UserPlus size={16}/></div><div><div className="font-bold text-emerald-400 text-sm">Entrar no Plantel</div><div className="text-[10px] text-emerald-200">Adiciona-te como jogador</div></div></div><Plus size={16} className="text-emerald-400"/></div>)}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm"><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-white text-sm flex items-center gap-2"><UserPlus size={16} className="text-emerald-400"/> Novo Jogador</h3><div className="flex bg-slate-900 p-1 rounded-lg border border-slate-600"><button onClick={() => setAddPlayerType('guest')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${addPlayerType === 'guest' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Convidado</button><button onClick={() => setAddPlayerType('member')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${addPlayerType === 'member' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Membro</button></div></div><div className="space-y-3"><input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />{addPlayerType === 'guest' && <select value={guestHostId} onChange={e => setGuestHostId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"><option value="">Quem convidou?</option>{players.filter(p => p.type !== 'guest').map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>}<button onClick={addPlayer} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"><Plus size={16}/> Adicionar</button></div></div>
            {memberPlayers.length > 0 && (<div><h3 className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Membros ({memberPlayers.length})</h3><div className="space-y-2">{memberPlayers.map(p => renderPlayerCard(p))}</div></div>)}
            {guestPlayers.length > 0 && (<div><h3 className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1 mt-4">Convidados ({guestPlayers.length})</h3><div className="space-y-2">{guestPlayers.map(p => renderPlayerCard(p))}</div></div>)}
          </div>
        )}
        {activeTab === 'team' && (
          <div className="space-y-6 max-w-md mx-auto">
            {!isGenerated ? (
              <>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 sticky top-0 z-10 shadow-lg"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-sm">Selecionar ({selectedIds.length})</h3><button onClick={generateTeams} className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"><Shuffle size={14}/> Criar Equipas</button></div><input type="text" placeholder="Procurar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"/></div>
                <div className="space-y-4">
                    {getFilteredSelectionList(memberPlayers).length > 0 && (<div><div className="text-xs font-bold text-slate-500 uppercase mb-2">Membros</div>{renderSelectionGrid(getFilteredSelectionList(memberPlayers))}</div>)}
                    {getFilteredSelectionList(guestPlayers).length > 0 && (<div><div className="text-xs font-bold text-slate-500 uppercase mb-2">Convidados</div>{renderSelectionGrid(getFilteredSelectionList(guestPlayers))}</div>)}
                </div>
              </>
            ) : (
              <div className="animate-in zoom-in duration-300 space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-white text-lg flex items-center gap-2"><SoccerBall size={20} className="text-yellow-500"/> Jogo a Decorrer</h3><button onClick={() => setIsGenerated(false)} className="text-xs text-red-400 hover:underline font-medium">Cancelar</button></div>
                <button onClick={shareTeams} className="w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors mb-2"><Share2 size={16} /> Partilhar Equipas</button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-3 rounded-xl border-t-4 border-t-white shadow-lg"><div className="font-bold text-center text-white mb-3 text-sm border-b border-slate-700 pb-2">Equipa Branco ({teamA.length})</div><ul className="text-xs text-slate-300 space-y-1.5">{teamA.map(p => (<li key={p.id} className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-500 overflow-hidden flex items-center justify-center text-[8px] font-bold text-white">{p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}</div>{p.name}</li>))}</ul></div>
                  <div className="bg-slate-800 p-3 rounded-xl border-t-4 border-t-slate-950 shadow-lg"><div className="font-bold text-center text-slate-400 mb-3 text-sm border-b border-slate-700 pb-2">Equipa Preto ({teamB.length})</div><ul className="text-xs text-slate-300 space-y-1.5">{teamB.map(p => (<li key={p.id} className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-500 overflow-hidden flex items-center justify-center text-[8px] font-bold text-white">{p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}</div>{p.name}</li>))}</ul></div>
                </div>
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mt-4 shadow-lg"><div className="text-center text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">Resultado Final</div><div className="flex justify-center items-center gap-4 mb-4"><input type="number" min="0" value={scoreA} onChange={e=>setScoreA(e.target.value)} className="w-16 h-16 text-center text-3xl font-bold bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-emerald-500 outline-none" placeholder="0"/><span className="text-slate-500 font-light text-2xl">X</span><input type="number" min="0" value={scoreB} onChange={e=>setScoreB(e.target.value)} className="w-16 h-16 text-center text-3xl font-bold bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-emerald-500 outline-none" placeholder="0"/></div><button onClick={saveMatch} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">Terminar Jogo</button></div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="space-y-4 max-w-md mx-auto">
            {matches.length === 0 && <div className="text-center text-slate-500 text-sm py-10 italic">Sem jogos registados ainda.</div>}
            {matches.map(m => {
              const mvp = getMatchMVP(m);
              const open = isVoteOpen(m.date);
              return (
                <div key={m.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm hover:border-slate-600 transition-colors">
                  <div className="bg-slate-900/50 p-2 text-center text-[10px] text-slate-500 border-b border-slate-700 font-medium uppercase tracking-wider relative">{new Date(m.date).toLocaleDateString()}{amIAdmin && (<button onClick={(e) => { e.stopPropagation(); deleteMatch(m.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 p-1" title="Apagar Jogo"><Trash2 size={12} /></button>)}</div>
                  <div className="flex items-center justify-between p-4"><div className="text-center w-1/3"><div className={`text-3xl font-bold ${m.scoreA > m.scoreB ? 'text-emerald-400' : 'text-slate-300'}`}>{m.scoreA}</div><div className="text-[10px] text-slate-500 truncate mt-1">Branco</div></div><div className="text-slate-600 text-sm font-light">X</div><div className="text-center w-1/3"><div className={`text-3xl font-bold ${m.scoreB > m.scoreA ? 'text-emerald-400' : 'text-slate-300'}`}>{m.scoreB}</div><div className="text-[10px] text-slate-500 truncate mt-1">Preto</div></div></div>
                  
                  {/* FIX: Lógica de voto MVP atualizada (fechada) */}
                  <div className="bg-slate-900/30 p-2 border-t border-slate-700/50">
                    {mvp ? (
                        <div className="flex items-center justify-center gap-2 text-yellow-500">
                           <Trophy size={14} className="fill-yellow-500" />
                           <span className="text-xs font-bold text-yellow-200">MVP: {mvp.name} ({mvp.votes})</span>
                        </div>
                    ) : (
                        open ? (
                           votingMatchId === m.id ? (
                               <div className="flex gap-2 animate-in fade-in">
                                  <select value={mvpSelectedId} onChange={(e) => setMvpSelectedId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 rounded text-xs p-1.5 text-white outline-none">
                                      <option value="">Quem foi o Craque?</option>
                                      {[...(m.teamA || []), ...(m.teamB || [])].map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                  </select>
                                  <button onClick={() => submitMvpVote(m)} className="bg-yellow-600 text-white px-3 rounded text-xs font-bold">Votar</button>
                               </div>
                           ) : (!m.mvpVotes?.[currentUser.uid] && (
                               <button onClick={() => setVotingMatchId(m.id)} className="w-full text-center text-xs text-yellow-500/80 hover:text-yellow-400 font-medium flex items-center justify-center gap-1">
                                  <Star size={12} /> Votar Melhor em Campo
                               </button>
                           ))
                        ) : (
                           <div className="text-center text-[10px] text-slate-600 italic">Votação encerrada</div>
                        )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {activeTab === 'trophies' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120} className="text-yellow-500"/></div>
                <div className="relative z-10">
                   <div className="w-20 h-20 mx-auto rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center mb-3 overflow-hidden shadow-xl">{myPlayerProfile?.photoUrl ? <img src={myPlayerProfile.photoUrl} className="w-full h-full object-cover"/> : <User size={40} className="text-slate-400"/>}</div>
                   <h2 className="text-xl font-bold text-white">{myPlayerProfile?.name || "Eu"}</h2>
                   <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">Estatísticas de Carreira</p>
                   {totalGuestDebt > 0 && (<div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-6 animate-pulse"><h3 className="text-red-400 font-bold text-sm mb-2 flex items-center justify-center gap-2"><AlertCircle size={16}/> Dívidas de Convidados ({totalGuestDebt.toFixed(2)}€)</h3><div className="space-y-1">{myGuestsWithDebt.map(g => (<div key={g.id} className="flex justify-between text-xs text-red-200 border-b border-red-500/20 pb-1 last:border-0"><span>{g.name}</span><span className="font-bold">{g.currentDebt.toFixed(2)}€</span></div>))}</div></div>)}
                   <div className={`grid ${amIAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-6`}>
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700"><div className="text-[10px] text-slate-500 font-bold uppercase">Jogos</div><div className="text-lg font-bold text-white">{myPlayerProfile?.stats?.games || 0}</div></div>
                      <div className="bg-emerald-900/20 p-2 rounded-lg border border-emerald-500/20"><div className="text-[10px] text-emerald-500 font-bold uppercase">Vitórias</div><div className="text-lg font-bold text-emerald-400">{myPlayerProfile?.stats?.wins || 0}</div></div>
                      <div className="bg-yellow-900/20 p-3 rounded-xl border border-yellow-500/20 text-center"><div className="text-xs text-yellow-500 font-bold uppercase mb-1">MVPs</div><div className="text-xl font-bold text-yellow-400">{getMVPCount(myPlayerProfile?.id)}</div></div>
                      {amIAdmin && <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-500/20"><div className="text-[10px] text-blue-500 font-bold uppercase">Rating</div><div className="text-lg font-bold text-blue-400">{getAverageRating(myPlayerProfile)}</div></div>}
                   </div>
                   <h3 className="text-left text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><Award size={16}/> Conquistas</h3>
                   <div className="grid grid-cols-1 gap-2">
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${myPlayerProfile?.stats?.games >= 50 ? 'bg-gradient-to-r from-yellow-900/40 to-slate-800 border-yellow-600/50' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}><div className="p-2 bg-slate-900 rounded-full border border-slate-700"><Trophy size={18} className="text-yellow-500"/></div><div className="text-left"><div className="text-sm font-bold text-white">Lenda do Clube</div><div className="text-[10px] text-slate-400">+50 Jogos realizados</div></div></div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${myPlayerProfile?.stats?.games >= 10 ? 'bg-gradient-to-r from-blue-900/40 to-slate-800 border-blue-600/50' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}><div className="p-2 bg-slate-900 rounded-full border border-slate-700"><Medal size={18} className="text-blue-500"/></div><div className="text-left"><div className="text-sm font-bold text-white">Veterano</div><div className="text-[10px] text-slate-400">+10 Jogos realizados</div></div></div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${(myPlayerProfile?.stats?.wins / myPlayerProfile?.stats?.games > 0.6 && myPlayerProfile?.stats?.games >= 5) ? 'bg-gradient-to-r from-orange-900/40 to-slate-800 border-orange-600/50' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}><div className="p-2 bg-slate-900 rounded-full border border-slate-700"><Flame size={18} className="text-orange-500"/></div><div className="text-left"><div className="text-sm font-bold text-white">Imparável</div><div className="text-[10px] text-slate-400">+60% Vitórias (min. 5 jogos)</div></div></div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${monthlyFixedIds.includes(myPlayerProfile?.id) ? 'bg-gradient-to-r from-emerald-900/40 to-slate-800 border-emerald-600/50' : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'}`}><div className="p-2 bg-slate-900 rounded-full border border-slate-700"><ShieldCheck size={18} className="text-emerald-500"/></div><div className="text-left"><div className="text-sm font-bold text-white">Membro Fixo</div><div className="text-[10px] text-slate-400">Inscrito na mensalidade atual</div></div></div>
                   </div>
                </div>
             </div>
          </div>
        )}
        {activeTab === 'treasury' && amIAdmin && (
          <div className="space-y-6">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Wallet size={18}/> Tesouraria</h2><input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none"/></div>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between"><div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Receita de Jogos (Convidados)</div><div className="text-xl font-bold text-white">{totalGuestRevenue.toFixed(2)}€</div></div>
                     <div className="bg-gradient-to-r from-red-900/40 to-slate-900 p-4 rounded-xl border border-red-500/20 flex flex-col justify-between"><div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Dívida Total</div><div className="text-xl font-bold text-white">{totalPendingDebt.toFixed(2)}€</div></div>
                 </div>
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg mb-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-red-400"/> Dívidas Pendentes</h3>
                    <div className="space-y-4">
                        {players.map(p => ({ ...p, debts: getPlayerDebts(p.id) })).filter(p => p.debts.length > 0).sort((a, b) => b.debts.reduce((s,d)=>s+d.amount,0) - a.debts.reduce((s,d)=>s+d.amount,0)).map(p => (
                                <div key={p.id} className="bg-slate-900/50 rounded-lg border border-red-500/20 overflow-hidden">
                                    <div className="p-3 flex justify-between items-center bg-slate-900/80 border-b border-white/5"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs overflow-hidden">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : p.name.substring(0,2)}</div><div><div className="text-sm font-bold text-white">{p.name}</div>{p.type === 'guest' && <div className="text-[9px] text-slate-500">Convidado</div>}</div></div><div className="text-red-400 font-bold text-sm">{p.debts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}€</div></div>
                                    <div className="p-2 space-y-1">{p.debts.map((debt) => (<div key={`${p.id}-${debt.id}`} className="flex justify-between items-center p-2 hover:bg-white/5 rounded transition-colors group"><span className="text-xs text-slate-300 group-hover:text-white transition-colors">{debt.desc}</span><div className="flex items-center gap-3"><span className="text-xs text-slate-400">{debt.amount}€</span><button onClick={debt.action} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white p-1.5 rounded transition-all shadow-sm" title="Marcar como Pago"><CheckCircle size={14} /></button></div></div>))}</div>
                                </div>
                            ))
                        }
                        {players.every(p => getPlayerDebts(p.id).length === 0) && (<div className="text-center text-slate-500 py-6 italic flex flex-col items-center gap-2"><CheckCircle size={32} className="text-slate-600"/><span>Tudo regularizado! 🎉</span></div>)}
                    </div>
                 </div>
                 {hasMonthlyFee && (
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 opacity-80 hover:opacity-100 transition-opacity">
                       <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between cursor-pointer select-none" onClick={(e) => e.currentTarget.nextSibling.classList.toggle('hidden')}><span>Gestão Mensalidades (Checklist)</span><span className="text-[10px]">▼</span></h3>
                       <div className="space-y-2 hidden animate-in slide-in-from-top-2">{monthlyFixedIds.map(pid => { const p = players.find(pl => pl.id === pid); if(!p) return null; const isPaid = monthlyPayments[pid]; return (<div key={pid} className="flex justify-between items-center bg-slate-700/30 p-2 rounded border border-slate-700"><span className="text-sm text-white">{p.name}</span><button onClick={() => toggleMonthlyPayment(pid)} className={`text-[10px] font-bold px-3 py-1 rounded border ${isPaid ? 'bg-emerald-900/30 text-emerald-400 border-emerald-600' : 'bg-red-900/30 text-red-400 border-red-600'}`}>{isPaid ? 'PAGO' : 'FALTA'}</button></div>); })}</div>
                    </div>
                 )}
             </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-30">
        <div className="flex justify-around items-center p-2 max-w-md mx-auto">
            <div className="flex overflow-x-auto items-center p-2 gap-4 px-6 no-scrollbar w-full max-w-3xl md:justify-center">
                <NavButton active={activeTab==='schedule'} onClick={()=>setActiveTab('schedule')} icon={CalendarCheck} label="Agenda" />
                {hasMonthlyFee && <NavButton active={activeTab==='members'} onClick={()=>setActiveTab('members')} icon={ClipboardList} label="Inscrições" />}
                <NavButton active={activeTab==='team'} onClick={()=>setActiveTab('team')} icon={Shield} label="Equipa" />
                <NavButton active={activeTab==='players'} onClick={()=>setActiveTab('players')} icon={Users} label="Plantel" />
                <NavButton active={activeTab==='history'} onClick={()=>setActiveTab('history')} icon={HistoryIcon} label="Jogos" />
                <NavButton active={activeTab==='trophies'} onClick={()=>setActiveTab('trophies')} icon={Trophy} label="Carreira" />
                {amIAdmin && <NavButton active={activeTab==='treasury'} onClick={()=>setActiveTab('treasury')} icon={Wallet} label="Tesouraria" />}
                <NavButton active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} icon={Settings} label="Definições" />
            </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: GROUP SELECTOR ---
const GroupSelector = ({ user, onLogout }) => {
  const [view, setView] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [msg, setMsg] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    // 1. Inicializar Auth com Token (MANDATORY IN CANVAS)
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    // 2. Query Firestore
    if (!user) return;
    
    // FIX PATH: public/data/groups
    const q = query(
      collection(db, getCollectionPath('groups')), 
      where('members', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (s) => {
      const list = s.docs.map(d => ({id: d.id, ...d.data()}));
      list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setGroups(list);
    }, (error) => {
        console.error("Erro ao ler grupos:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // --- NOVA FUNÇÃO CREATE GROUP (COM ID PERSONALIZADO) ---
  const createGroup = async (e) => {
    e.preventDefault();
    if(!newGroup.trim()) return;
    setCreateError("");

    // Normalizar ID (ex: "Futebol de 4ª" -> "futebol-de-4a")
    const customId = newGroup.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, '-') 
      .replace(/[^a-z0-9-]/g, '');

    if (!customId) return setCreateError("Nome inválido para criar ID.");

    try {
      // FIX PATH: public/data/groups
      const docRef = doc(db, getCollectionPath('groups'), customId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCreateError("Já existe um grupo com esse nome/ID. Tenta outro.");
        return;
      }

      await setDoc(docRef, {
        name: newGroup,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp()
      });
      
      const newGroupData = { 
        id: customId, 
        name: newGroup, 
        ownerId: user.uid, 
        members: [user.uid],
        createdAt: { seconds: Date.now() / 1000 }
      };
      
      setGroups(prev => {
          if (prev.find(g => g.id === customId)) return prev;
          return [newGroupData, ...prev];
      });
      setNewGroup('');
    } catch (err) {
      console.error(err);
      setCreateError("Erro de permissão ou rede.");
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    if(!joinCode.trim()) return;
    setMsg("");
    try {
      // FIX PATH: public/data/groups
      const docRef = doc(db, getCollectionPath('groups'), joinCode.trim());
      const docSnap = await getDoc(docRef);
      if(!docSnap.exists()) {
         setMsg("Grupo não encontrado. Verifica o código.");
         return;
      }
      
      const groupData = docSnap.data();
      if (groupData.members && groupData.members.includes(user.uid)) {
          setMsg("Já pertences a este grupo!");
          return;
      }

      await updateDoc(docRef, {
        members: arrayUnion(user.uid)
      });
      
      const newGroup = { id: docSnap.id, ...groupData, members: [...(groupData.members || []), user.uid] };
      setGroups(prev => {
          if (prev.find(g => g.id === newGroup.id)) return prev;
          return [newGroup, ...prev].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });

      setMsg("Entraste no grupo!");
      setJoinCode("");
    } catch(err) {
      console.error(err);
      setMsg("Erro ao entrar.");
    }
  };

  if (selectedGroup) {
    return <GroupDashboard group={selectedGroup} currentUser={user} onBack={() => setSelectedGroup(null)} />;
  }

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-slate-900 pb-20">
         <UserProfile user={user} onLogout={onLogout} />
         <div className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-30">
          <div className="flex justify-around items-center p-2 max-w-md mx-auto">
            <NavButton active={view==='groups'} onClick={()=>setView('groups')} icon={LayoutGrid} label="Grupos" />
            <NavButton active={view==='profile'} onClick={()=>setView('profile')} icon={User} label="Perfil" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 animate-in fade-in duration-300 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LayoutGrid className="text-emerald-500"/> Meus Grupos</h1>
            <p className="text-slate-400 text-sm">Olá, <span className="text-white font-medium">{user.displayName || "Jogador"}</span></p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700" onClick={() => setView('profile')}>
             {user.photoURL ? <img src={user.photoURL} alt="Eu" className="w-full h-full object-cover" /> : <User className="p-2 text-slate-400 w-full h-full"/>}
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
           <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 shadow-lg">
             <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><PlusCircle className="text-emerald-400" size={18}/> Criar Novo Grupo</h2>
             <form onSubmit={createGroup} className="flex flex-col sm:flex-row gap-3">
               <input type="text" value={newGroup} onChange={e=>setNewGroup(e.target.value)} placeholder="Nome do grupo..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 sm:py-2 text-white focus:border-emerald-500 outline-none transition-colors"/>
               <button type="submit" disabled={!newGroup.trim()} className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-3 sm:py-2 rounded-lg font-bold hover:bg-emerald-500 disabled:opacity-50 transition-colors">Criar</button>
             </form>
             {createError && <div className="mt-3 text-xs bg-red-900/30 text-red-400 p-2 rounded border border-red-500/30 flex items-center gap-2"><AlertCircle size={12}/> {createError}</div>}
           </div>

           <div className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 shadow-lg">
             <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><UserPlus className="text-blue-400" size={18}/> Entrar com Código</h2>
             <form onSubmit={joinGroup} className="flex flex-col sm:flex-row gap-3">
               <input type="text" value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="Código do convite..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 sm:py-2 text-white focus:border-blue-500 outline-none transition-colors"/>
               <button type="submit" disabled={!joinCode.trim()} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors">Entrar</button>
             </form>
             {msg && <p className="text-xs text-emerald-400 mt-2">{msg}</p>}
           </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl"><Users size={48} className="mx-auto text-slate-700 mb-4"/><p className="text-slate-500">Cria um grupo ou pede um código a um amigo!</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} onClick={() => setSelectedGroup(g)} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all hover:translate-y-[-2px] group relative shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-900 rounded-lg text-emerald-500 group-hover:text-emerald-400 transition-colors"><Users size={24}/></div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 truncate">{g.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">Entrar no grupo <ArrowRight size={12}/></p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-30">
        <div className="flex justify-around items-center p-2 max-w-md mx-auto">
          <NavButton active={view==='groups'} onClick={()=>setView('groups')} icon={LayoutGrid} label="Grupos" />
          <NavButton active={view==='profile'} onClick={()=>setView('profile')} icon={User} label="Perfil" />
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     // MANDATORY IN CANVAS: Custom Token Auth
     const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
     const unsubscribe = onAuthStateChanged(auth, u => { 
         setUser(u); 
         setLoading(false); 
     });
     return () => unsubscribe();
  }, []);

  if(loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={40}/></div>;
  if(!user) return <AuthScreen />;
  return <GroupSelector user={user} onLogout={() => signOut(auth)} />;
};

export default function App() {
  return (
    <ErrorBoundary>
        <MainApp />
    </ErrorBoundary>
  );
}