import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CalendarCheck, Shield, History as HistoryIcon, UserPlus, Plus, Trash2, 
  Shuffle, Check, ArrowLeft, ArrowRight, LogOut, LayoutGrid, 
  PlusCircle, Loader2, Globe, User, Camera, Save,
  ShieldCheck, Crown, ShieldAlert, Settings, Copy, Star, Trophy, AlertCircle,
  Link as LinkIcon, Clock, Map as MapIcon, MapPin, ExternalLink,
  Wallet, ClipboardList, CheckCircle, Banknote, X, Award, Flame, Medal, Activity
} from 'lucide-react';

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

// --- CUSTOM ICONS ---
const SoccerBall = ({ className = "", size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 17l-4.2-2.5 1.6-5.1h5.2l1.6 5.1z"/><path d="m12 17v5"/><path d="m7.8 14.5-4 2.8"/><path d="m16.2 14.5 4 2.8"/><path d="m9.4 9.4-4.2-2.6"/><path d="m14.6 9.4 4.2-2.6"/>
  </svg>
);

// --- HELPER: EXTRAIR COORDENADAS DO GOOGLE MAPS ---
const getCoordsFromUrl = (url) => {
  try {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    
    const queryRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = url.match(queryRegex);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

    return null;
  } catch (e) {
    return null;
  }
};

// --- COMPONENTE ESTRELAS (VOTAÇÃO) ---
const StarRating = ({ value, onChange, readOnly = false, size = 14 }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); if (!readOnly) onChange(star); }}
          disabled={readOnly}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star 
            size={size} 
            className={`${star <= value ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'}`} 
          />
        </button>
      ))}
    </div>
  );
};

// --- COMPONENTE NAV BUTTON ---
const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[64px] flex-shrink-0 ${active ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} /> 
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

// --- CONFIGURAÇÃO FIREBASE (V2 PROD) ---
const firebaseConfig = {
  apiKey: "AIzaSyCgfsrpIIj0XWp7Uc2FNGgKIibtWriHR_c",
  authDomain: "futeboladas-v2-dev.firebaseapp.com",
  projectId: "futeboladas-v2-dev",
  storageBucket: "futeboladas-v2-dev.firebasestorage.app",
  messagingSenderId: "899361657772",
  appId: "1:899361657772:web:cdd265c50fc9574119e009"
};

// Inicialização da Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = "futeboladas-v2";

// --- LOGIN SCREEN ---
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
          
          <button onClick={handleGoogle} className="w-full bg-white text-slate-900 py-3 rounded-lg font-bold mb-4 flex justify-center gap-2 items-center hover:bg-slate-100 transition-colors">
            <Globe size={18}/> Continuar com Google
          </button>
          
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

// --- USER PROFILE (GLOBAL) ---
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
        const docSnap = await getDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if(data.name) setName(data.name);
          if(data.photoUrl) setPhotoUrl(data.photoUrl);
        }

        const groupsQuery = query(collection(db, 'artifacts', APP_ID, 'groups'), where('members', 'array-contains', user.uid));
        const groupsSnap = await getDocs(groupsQuery);
        
        let totalGames = 0;
        let totalWins = 0;
        let totalMvps = 0; 

        for (const groupDocSnapshot of groupsSnap.docs) {
           const groupRef = groupDocSnapshot.ref;
           
           const playersQuery = query(
             collection(groupRef, 'players'), 
             where('uid', '==', user.uid)
           );
           const playersSnap = await getDocs(playersQuery);
           let myPlayerIdInGroup = null;
           
           playersSnap.forEach(pDoc => {
              const pData = pDoc.data();
              if (pData.stats) {
                 totalGames += (pData.stats.games || 0);
                 totalWins += (pData.stats.wins || 0);
              }
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
                           let maxVotes = 0; 
                           let winnerId = null;
                           Object.entries(counts).forEach(([pid, count]) => { 
                               if (count > maxVotes) { maxVotes = count; winnerId = pid; } 
                           });
                           if (winnerId === myPlayerIdInGroup) totalMvps++;
                       }
                   });
               } catch (err) { console.error("Erro ao calcular MVPs globais", err); }
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
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid), {
        name: name, photoUrl: photoUrl, updatedAt: serverTimestamp()
      }, { merge: true });
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
              <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-lg border border-slate-900 group-hover:scale-110 transition-transform">
                {uploading ? <Activity className="animate-spin" size={16}/> : <Camera size={16} />}
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <p className="text-xs text-slate-500 mt-2">Toque para alterar a foto</p>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Nome de Jogador</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="O teu nome..." /></div>
          {msg && <div className={`text-sm text-center p-2 rounded ${msg.includes('sucesso') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>{msg}</div>}
          <button onClick={handleSave} disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {uploading ? "A guardar..." : "Guardar Alterações"}
          </button>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Globe size={100} className="text-blue-500"/></div>
           <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><Trophy size={18} className="text-yellow-400"/> Números Globais</h3>
           <p className="text-xs text-slate-400 mb-4">O somatório da tua carreira em todos os grupos.</p>
           
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-center">
                 <div className="text-xs text-slate-500 font-bold uppercase mb-1">Jogos</div>
                 <div className="text-xl font-bold text-white">{globalStats.games}</div>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-xl border border-emerald-500/30 text-center">
                 <div className="text-xs text-emerald-500 font-bold uppercase mb-1">Vitórias</div>
                 <div className="text-xl font-bold text-emerald-400">{globalStats.wins}</div>
              </div>
              <div className="bg-yellow-900/20 p-3 rounded-xl border border-yellow-500/30 text-center">
                 <div className="text-xs text-yellow-500 font-bold uppercase mb-1">MVPs</div>
                 <div className="text-xl font-bold text-yellow-400">{globalStats.mvps}</div>
              </div>
              <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/30 text-center">
                 <div className="text-xs text-blue-500 font-bold uppercase mb-1">Win Rate</div>
                 <div className="text-xl font-bold text-blue-400">
                    {globalStats.games > 0 ? Math.round((globalStats.wins / globalStats.games) * 100) : 0}%
                 </div>
              </div>
           </div>
        </div>

        <div className="pt-4 border-t border-slate-700"><button onClick={onLogout} className="w-full py-3 text-red-400 hover:bg-red-900/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><LogOut size={16}/> Terminar Sessão</button></div>
      </div>
    </div>
  );
};

// =================================================================================
// === COMPONENTE: GROUP DASHBOARD ===
// =================================================================================
const GroupDashboard = ({ group, currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [nextGame, setNextGame] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [weather, setWeather] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editFreq, setEditFreq] = useState("weekly");
  const [editLocationUrl, setEditLocationUrl] = useState("");
  const [groupLocation, setGroupLocation] = useState(null);
  const [hasMonthlyFee, setHasMonthlyFee] = useState(true);
  const [guestFee, setGuestFee] = useState(4.5);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
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

  const groupRef = (col) => collection(db, 'artifacts', APP_ID, 'groups', group.id, col);
  const groupDoc = (col, id) => doc(db, 'artifacts', APP_ID, 'groups', group.id, col, id);

  const isOwner = group.ownerId === currentUser.uid;
  const myPlayerProfile = players.find(p => p.uid === currentUser.uid);
  const amIAdmin = isOwner || (myPlayerProfile && myPlayerProfile.isAdmin);

  useEffect(() => {
    const unsubP = onSnapshot(groupRef('players'), s => setPlayers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const qMatches = query(groupRef('matches'), orderBy('createdAt', 'desc'));
    const unsubM = onSnapshot(qMatches, s => setMatches(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubG = onSnapshot(groupDoc('schedule', 'next'), s => {
      if (s.exists()) {
        const data = s.data();
        setNextGame(data);
        if (data.date) {
            const d = new Date(data.date);
            setEditDate(d.toISOString().split('T')[0]);
            setEditTime(d.toTimeString().slice(0,5));
        }
        if (data.frequency) setEditFreq(data.frequency);
      } else {
        setNextGame({ date: new Date().toISOString(), responses: {} });
      }
    });
    return () => { unsubP(); unsubM(); unsubG(); };
  }, [group.id]);

  useEffect(() => {
    const unsubGroup = onSnapshot(doc(db, 'artifacts', APP_ID, 'groups', group.id), (s) => {
        if(s.exists()) {
            const data = s.data();
            setEditLocationUrl(data.locationUrl || "");
            if (data.location) setGroupLocation(data.location); 
            if (data.settings) {
                setHasMonthlyFee(data.settings.hasMonthlyFee ?? true);
                setGuestFee(data.settings.guestFee ?? 4.5);
            }
        }
    });
    return () => unsubGroup();
  }, [group.id]);

  useEffect(() => {
    const monthDocRef = groupDoc('treasury', `month_${currentMonth}`);
    const unsubTreasury = onSnapshot(monthDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMonthlyFixedIds(Array.isArray(data.fixedIds) ? data.fixedIds : []);
        setMonthlyPayments(data.payments || {});
        if (data.monthlyFee) setMonthlyFee(data.monthlyFee); 
      } else {
        setMonthlyFixedIds([]);
        setMonthlyPayments({});
      }
    });
    return () => unsubTreasury();
  }, [group.id, currentMonth]);

  useEffect(() => {
    if (players.length > 0) {
        const syncProfile = async () => {
            const myPlayer = players.find(p => p.uid === currentUser.uid);
            if (myPlayer) {
                try {
                    const userDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const latestPhoto = userData.photoUrl || currentUser.photoURL;
                        const latestName = userData.name || currentUser.displayName;
                        
                        const updates = {};
                        if (myPlayer.photoUrl !== latestPhoto) updates.photoUrl = latestPhoto;
                        if (myPlayer.name !== latestName) updates.name = latestName;

                        if (Object.keys(updates).length > 0) {
                            await updateDoc(groupDoc('players', myPlayer.id), updates);
                        }
                    }
                } catch(e) { console.error("Erro sync:", e); }
            }
        };
        syncProfile();
    }
  }, [players.length, currentUser.uid]); 

  useEffect(() => {
    if (activeTab === 'team' && players.length > 0 && !isGenerated) {
        const goingUids = Object.entries(nextGame?.responses || {})
            .filter(([uid, status]) => status === 'going')
            .map(([uid]) => uid);
        const confirmedPlayerIds = players.filter(p => p.uid && goingUids.includes(p.uid)).map(p => p.id);
        if (selectedIds.length === 0 && confirmedPlayerIds.length > 0) {
            setSelectedIds(confirmedPlayerIds);
            showToast("Jogadores confirmados pré-selecionados!");
        }
    }
  }, [activeTab, players, nextGame, isGenerated]); 

  const showToast = (msg, type='success') => {
    setToast({show: true, msg, type});
    setTimeout(() => setToast({show: false, msg: '', type: 'success'}), 3000);
  };

  const copyInviteCode = () => {
    const text = group.id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
                setIsCopied(true); showToast("Código copiado! Partilha com amigos."); setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => fallbackCopyText(text));
    } else fallbackCopyText(text);
  };

  const fallbackCopyText = (text) => {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus(); textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if(successful) { setIsCopied(true); showToast("Código copiado! Partilha com amigos."); setTimeout(() => setIsCopied(false), 2000); } 
        else showToast("Erro ao copiar.", "error");
    } catch (err) { showToast("Erro ao copiar.", "error"); }
  };

  const toggleSchedule = async (status) => {
    const currentResponses = nextGame?.responses || {};
    const newResponses = { ...currentResponses, [currentUser.uid]: status };
    await setDoc(groupDoc('schedule', 'next'), { date: nextGame?.date || new Date().toISOString(), responses: newResponses }, { merge: true });
    showToast(status === 'going' ? "Confirmado!" : "Removido");
  };

  const addPlayer = async () => {
    if(!newPlayerName.trim()) return showToast("Nome inválido", "error");
    if (addPlayerType === 'guest' && !guestHostId) return showToast("Selecione quem convidou.", "error");
    await addDoc(groupRef('players'), {
      name: newPlayerName + (addPlayerType === 'guest' ? ' (C)' : ''),
      type: addPlayerType,
      hostId: addPlayerType === 'guest' ? guestHostId : null,
      stats: { games: 0, wins: 0, draws: 0, losses: 0, mvps: 0 },
      isAdmin: false, votes: {}, createdAt: serverTimestamp()
    });
    setNewPlayerName('');
    showToast(addPlayerType === 'guest' ? "Convidado adicionado!" : "Membro adicionado!");
  };

  const joinAsPlayer = async () => {
    const alreadyExists = players.find(p => p.uid === currentUser.uid);
    if(alreadyExists) return showToast("Já estás no plantel!", "error");
    let photo = currentUser.photoURL;
    try {
        const userDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'users', currentUser.uid));
        if (userDoc.exists()) photo = userDoc.data().photoUrl || photo;
    } catch(e) {}
    await addDoc(groupRef('players'), {
      name: currentUser.displayName || "Eu", uid: currentUser.uid, type: 'member', 
      stats: { games: 0, wins: 0, draws: 0, losses: 0, mvps: 0 },
      isAdmin: isOwner, photoUrl: photo, votes: {}, createdAt: serverTimestamp()
    });
    showToast("Entraste no plantel!");
  };

  const deletePlayer = async (id) => {
    if (!amIAdmin) return showToast("Apenas Admins podem apagar.", "error");
    if(window.confirm("Apagar jogador?")) await deleteDoc(groupDoc('players', id));
  };
  
  const deleteMatch = async (id) => {
    if (!amIAdmin) return showToast("Apenas Admins podem apagar jogos.", "error");
    if(window.confirm("Tem a certeza que deseja apagar este jogo do histórico?")) {
        try { await deleteDoc(groupDoc('matches', id)); showToast("Jogo apagado."); } 
        catch (e) { console.error("Erro apagar jogo:", e); showToast("Erro ao apagar.", "error"); }
    }
  };

  const leaveThisGroup = async () => {
     if (isOwner) return showToast("O dono não pode sair. Apaga o grupo ou transfere a posse.", "error");
     if (window.confirm("Tens a certeza que queres sair deste grupo?")) {
         try {
             await updateDoc(doc(db, 'artifacts', APP_ID, 'groups', group.id), { members: arrayRemove(currentUser.uid) });
             onBack();
         } catch(e) { console.error(e); showToast("Erro ao sair do grupo.", "error"); }
     }
  };

  const deleteThisGroup = async () => {
    if(window.confirm("ATENÇÃO: Isto apagará o grupo para TODOS. Continuar?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'groups', group.id));
      onBack(); 
    }
  };

  const toggleAdmin = async (player) => {
    if (!isOwner) return showToast("Apenas o Dono do grupo pode gerir admins.", "error");
    if (player.uid === group.ownerId) return showToast("O Dono é sempre Admin.", "error");
    await updateDoc(groupDoc('players', player.id), { isAdmin: !player.isAdmin });
    showToast(player.isAdmin ? "Admin removido." : "Novo Admin promovido!");
  };

  const saveMonthlyFee = async (newFee) => {
    await setDoc(groupDoc('treasury', `month_${currentMonth}`), { monthlyFee: parseInt(newFee) }, { merge: true });
    setMonthlyFee(newFee); showToast("Valor atualizado!");
  };

  const toggleMonthlyPayment = async (playerId) => {
    const newPayments = { ...(monthlyPayments || {}), [playerId]: !(monthlyPayments || {})[playerId] };
    await setDoc(groupDoc('treasury', `month_${currentMonth}`), { payments: newPayments }, { merge: true });
  };

  const selfSignUp = async () => {
    const myPlayer = players.find(p => p.uid === currentUser.uid);
    if (!myPlayer) return showToast("Entra no plantel primeiro!", "error");
    if (monthlyFixedIds.length >= 18) return showToast("Lista cheia (Máx 18)!", "error");
    if (monthlyFixedIds.includes(myPlayer.id)) return showToast("Já estás inscrito!");
    const newIds = [...monthlyFixedIds, myPlayer.id];
    await setDoc(groupDoc('treasury', `month_${currentMonth}`), { fixedIds: newIds, payments: monthlyPayments }, { merge: true });
    showToast("Inscrito como Fixo!");
  };

  const selfSignOut = async () => {
    const myPlayer = players.find(p => p.uid === currentUser.uid);
    if (!myPlayer) return;
    const newIds = monthlyFixedIds.filter(id => id !== myPlayer.id);
    await setDoc(groupDoc('treasury', `month_${currentMonth}`), { fixedIds: newIds, payments: monthlyPayments }, { merge: true });
    showToast("Inscrição cancelada.");
  };

  const settleMatchPayment = async (matchId, playerId) => {
     const match = matches.find(m => m.id === matchId);
     if(!match || !match.payments) return;
     const newPayments = { ...match.payments, [playerId]: true };
     await updateDoc(groupDoc('matches', matchId), { payments: newPayments });
     showToast("Dívida regularizada!");
  };
  
  const calculatePlayerDebt = (playerId) => {
    let total = 0;
    if (hasMonthlyFee && monthlyFixedIds.includes(playerId)) {
        if (!monthlyPayments[playerId]) total += monthlyFee;
    }
    matches.forEach(m => {
        if (m.payments && m.payments[playerId] === false) total += guestFee;
    });
    return total;
  };
  
  const getMVPCount = (playerId) => {
     let count = 0;
     matches.forEach(m => {
        const mvp = getMatchMVP(m);
        if (mvp && mvp.id === playerId) count++;
     });
     return count;
  };

  const saveGameSettings = async () => {
      try {
          const updates = {};
          if (editDate && editTime) updates.date = `${editDate}T${editTime}:00`;
          if (editFreq) updates.frequency = editFreq;
          if (Object.keys(updates).length > 0) await setDoc(groupDoc('schedule', 'next'), updates, { merge: true });

          const groupUpdates = { settings: { hasMonthlyFee: hasMonthlyFee, guestFee: parseFloat(guestFee) } };
          if (editLocationUrl) {
              const coords = getCoordsFromUrl(editLocationUrl);
              groupUpdates.locationUrl = editLocationUrl;
              if (coords) groupUpdates.location = coords; 
          }
          await updateDoc(doc(db, 'artifacts', APP_ID, 'groups', group.id), groupUpdates);
          if (hasMonthlyFee) await saveMonthlyFee(monthlyFee);
          showToast("Definições guardadas!");
      } catch (err) { console.error(err); showToast("Erro ao guardar.", "error"); }
  };

  const submitPlayerVote = async (targetPlayer, rating) => {
    const newVotes = { ...targetPlayer.votes, [currentUser.uid]: rating };
    await updateDoc(groupDoc('players', targetPlayer.id), { votes: newVotes });
    setExpandedPlayerId(null); showToast("Classificação guardada!");
  };

  const getAverageRating = (player) => {
    if (!player.votes) return 3;
    const values = Object.values(player.votes);
    if (values.length === 0) return 3;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getPlayerRatingValue = (p) => parseFloat(getAverageRating(p));

  const generateTeams = () => {
    if(selectedIds.length < 2) return showToast("Mínimo 2 jogadores", "error");
    const selectedPlayers = players.filter(p => selectedIds.includes(p.id));
    const groupsMap = {}; const selectedIdsSet = new Set(selectedIds);
    selectedPlayers.forEach(p => {
        let leaderId = p.id;
        if (p.type === 'guest' && p.hostId && selectedIdsSet.has(p.hostId)) leaderId = p.hostId;
        if (!groupsMap[leaderId]) groupsMap[leaderId] = [];
        groupsMap[leaderId].push(p);
    });
    const blocks = Object.values(groupsMap).map(blockMembers => {
        const totalRating = blockMembers.reduce((sum, p) => sum + getPlayerRatingValue(p), 0);
        return { members: blockMembers, rating: totalRating };
    });
    blocks.sort((a, b) => b.rating - a.rating + (Math.random() - 0.5));
    let tA = [], tB = []; let sumA = 0, sumB = 0;
    blocks.forEach(block => {
      if (sumA <= sumB) { tA = [...tA, ...block.members]; sumA += block.rating; } else { tB = [...tB, ...block.members]; sumB += block.rating; }
    });
    setTeamA(tA); setTeamB(tB); setIsGenerated(true);
    showToast(`Equipas geradas! (${tA.length} vs ${tB.length})`);
  };

  const saveMatch = async () => {
    if(!scoreA || !scoreB) return showToast("Insere o resultado", "error");
    const gamePayments = {};
    [...teamA, ...teamB].forEach(p => {
        const needsToPay = hasMonthlyFee ? !monthlyFixedIds.includes(p.id) : true;
        if (needsToPay) gamePayments[p.id] = false; 
    });
    await addDoc(groupRef('matches'), {
      date: new Date().toISOString(), scoreA: parseInt(scoreA), scoreB: parseInt(scoreB),
      teamA: teamA.map(p => ({id: p.id, name: p.name})), teamB: teamB.map(p => ({id: p.id, name: p.name})),
      mvpVotes: {}, payments: gamePayments, createdAt: serverTimestamp()
    });
    const winner = parseInt(scoreA) > parseInt(scoreB) ? 'A' : (parseInt(scoreB) > parseInt(scoreA) ? 'B' : 'draw');
    const updateStats = (p, result) => {
      const stats = p.stats || { games: 0, wins: 0, draws: 0, losses: 0 };
      stats.games += 1;
      if(result === 'win') stats.wins += 1; if(result === 'draw') stats.draws += 1; if(result === 'loss') stats.losses += 1;
      updateDoc(groupDoc('players', p.id), { stats });
    };
    teamA.forEach(p => updateStats(p, winner === 'A' ? 'win' : (winner === 'draw' ? 'draw' : 'loss')));
    teamB.forEach(p => updateStats(p, winner === 'B' ? 'win' : (winner === 'draw' ? 'draw' : 'loss')));
    setIsGenerated(false); setSelectedIds([]); setScoreA(''); setScoreB(''); setActiveTab('history');
    showToast("Jogo guardado!");
  };

  const submitMvpVote = async (match) => {
    if(!mvpSelectedId) return showToast("Escolhe um jogador", "error");
    const newVotes = { ...match.mvpVotes, [currentUser.uid]: mvpSelectedId };
    await updateDoc(groupDoc('matches', match.id), { mvpVotes: newVotes });
    setVotingMatchId(null); setMvpSelectedId(""); showToast("Voto registado!");
  };

  const getMatchMVP = (match) => {
    if (!match.mvpVotes || Object.keys(match.mvpVotes).length === 0) return null;
    const counts = {};
    Object.values(match.mvpVotes).forEach(pid => counts[pid] = (counts[pid] || 0) + 1);
    let maxVotes = 0; let winnerId = null;
    Object.entries(counts).forEach(([pid, count]) => { if (count > maxVotes) { maxVotes = count; winnerId = pid; } });
    const player = players.find(p => p.id === winnerId);
    return player ? { ...player, votes: maxVotes } : null;
  };

  const toggleSelection = (pid) => {
    if (selectedIds.includes(pid)) setSelectedIds(selectedIds.filter(id => id !== pid));
    else setSelectedIds([...selectedIds, pid]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 animate-in fade-in duration-300 relative">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <Users size={18} className="text-emerald-400"/> {group.name}
            </h2>
            <div className="flex items-center gap-2">
               {isOwner && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 flex items-center gap-1"><Crown size={10}/> Dono</span>}
               <button onClick={copyInviteCode} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 transition-colors">
                  {isCopied ? <Check size={10} className="text-emerald-400"/> : <Copy size={10}/>} {isCopied ? "Copiado!" : "Convidar"}
               </button>
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-5 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
           {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-28 no-scrollbar">
        {activeTab === 'schedule' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center shadow-lg">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Próxima Peladinha</h3>
              <div className="text-2xl font-bold text-white mb-4 bg-slate-900/50 py-2 rounded-lg border border-slate-700/50">
                {nextGame?.date ? new Date(nextGame.date).toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'}) : 'A definir'}
              </div>
              
              {editLocationUrl && (
                  <div className="flex justify-center mb-6">
                     <div className="rounded-xl overflow-hidden border border-slate-700 relative h-32 w-full bg-slate-800 group cursor-pointer" onClick={() => window.open(editLocationUrl, '_blank')}>
                        {/* MAPA PLACEHOLDER SIMPLES */}
                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]">
                             <div className="bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform shadow-lg">
                                <MapPin size={16} className="text-red-500 fill-red-500/20" /> Ver no Mapa
                             </div>
                        </div>
                     </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => toggleSchedule('going')} className={`p-4 rounded-xl border transition-all active:scale-95 ${nextGame?.responses?.[currentUser.uid] === 'going' ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700'}`}>
                  <div className="text-2xl mb-1">👍</div><div className="font-bold text-sm text-white">Vou a Jogo</div>
                </button>
                <button onClick={() => toggleSchedule('not_going')} className={`p-4 rounded-xl border transition-all active:scale-95 ${nextGame?.responses?.[currentUser.uid] === 'not_going' ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700'}`}>
                  <div className="text-2xl mb-1">👎</div><div className="font-bold text-sm text-white">Não Vou</div>
                </button>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700 text-left">
                <div className="text-[10px] text-slate-500 mb-3 uppercase tracking-widest font-bold">Jogadores Confirmados</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(nextGame?.responses || {}).filter(([_, status]) => status === 'going').map(([uid]) => {
                        const p = players.find(player => player.uid === uid);
                        if (!p) return null;
                        return (
                            <div key={uid} className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 pr-4 rounded-full border border-slate-600">
                                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden border border-slate-500 shadow-sm">
                                    {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}
                                </div>
                                <span className="text-xs text-white font-medium">{p.name}</span>
                            </div>
                        );
                    })
                  }
                  {Object.values(nextGame?.responses || {}).filter(v => v === 'going').length === 0 && <span className="text-slate-600 italic text-sm w-full text-center py-2">Ainda ninguém confirmou</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB INSCRIÇÕES */}
        {activeTab === 'members' && (
          <div className="space-y-6 max-w-md mx-auto">
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center">
                <h3 className="text-white font-bold mb-4 flex items-center justify-center gap-2 text-sm"><ClipboardList size={18} className="text-emerald-400"/> Inscrições Mensais</h3>
                <p className="text-xs text-slate-400 mb-6">Gere a tua inscrição como membro fixo para este mês ({new Date().toLocaleDateString('pt-PT', { month: 'long' })}).</p>
                <div className="flex justify-center gap-4 mb-6">
                   {monthlyFixedIds.includes(myPlayerProfile?.id) ? (
                      <button onClick={selfSignOut} className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20 w-full">Cancelar Inscrição</button>
                   ) : (
                      <button onClick={selfSignUp} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20 w-full">Inscrever como Fixo</button>
                   )}
                </div>
                <div className="text-left">
                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest border-b border-slate-700 pb-1 flex justify-between">
                      <span>Membros Fixos</span><span>{monthlyFixedIds.length}/18</span>
                   </div>
                   <div className="space-y-2">
                      {monthlyFixedIds.map(pid => {
                         const p = players.find(pl => pl.id === pid);
                         if (!p) return null;
                         return (
                            <div key={pid} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden border border-slate-600">
                                  {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}
                               </div>
                               <span className="text-sm text-white font-medium">{p.name}</span>
                               {pid === myPlayerProfile?.id && <span className="ml-auto text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Eu</span>}
                            </div>
                         );
                      })}
                      {monthlyFixedIds.length === 0 && <div className="text-center text-slate-500 text-xs italic py-4">Ainda sem inscrições.</div>}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB PLANTEL */}
        {activeTab === 'players' && (
          <div className="space-y-4 max-w-md mx-auto">
            {!players.find(p => p.uid === currentUser.uid) && (
              <div onClick={joinAsPlayer} className="bg-emerald-900/30 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-900/50 transition-colors mb-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2 rounded-full text-white"><UserPlus size={16}/></div>
                  <div><div className="font-bold text-emerald-400 text-sm">Entrar no Plantel</div><div className="text-[10px] text-emerald-200">Adiciona-te como jogador para te convocarem</div></div>
                </div>
                <Plus size={16} className="text-emerald-400"/>
              </div>
            )}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold text-white text-sm flex items-center gap-2"><UserPlus size={16} className="text-emerald-400"/> Novo Jogador</h3>
                 <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-600">
                    <button onClick={() => setAddPlayerType('guest')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${addPlayerType === 'guest' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Convidado</button>
                    <button onClick={() => setAddPlayerType('member')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${addPlayerType === 'member' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Membro</button>
                 </div>
              </div>
              <div className="space-y-3">
                <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder={addPlayerType === 'guest' ? "Nome do convidado..." : "Nome do membro..."} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-colors" />
                {addPlayerType === 'guest' && (
                   <select value={guestHostId} onChange={e => setGuestHostId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none">
                      <option value="">Quem convidou? (Obrigatório)</option>
                      {players.filter(p => p.type !== 'guest').map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                   </select>
                )}
                <button onClick={addPlayer} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"><Plus size={16}/> Adicionar {addPlayerType === 'guest' ? 'Convidado' : 'Membro'}</button>
              </div>
            </div>
            <div className="space-y-2">
              {players.map(p => {
                const stats = p.stats || { games: 0, wins: 0, draws: 0, losses: 0 };
                const myVote = p.votes?.[currentUser.uid] || 0;
                const hostName = p.type === 'guest' && p.hostId ? players.find(h => h.id === p.hostId)?.name : null;
                return (
                  <div key={p.id} onClick={() => { if (expandedPlayerId === p.id) { setExpandedPlayerId(null); } else { setExpandedPlayerId(p.id); setVotingStars(myVote || 3); } }}>
                    <div className={`bg-slate-800/50 p-3 rounded-lg border transition-all cursor-pointer ${expandedPlayerId === p.id ? 'border-emerald-500/50 bg-slate-800 shadow-lg' : 'border-slate-700 hover:border-slate-600'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border relative overflow-hidden ${p.isAdmin ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                            {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : p.name.substring(0,2).toUpperCase()}
                            {p.isAdmin && <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5"><Crown size={6} className="text-black"/></div>}
                          </div>
                          <div className="flex-1">
                             <div className="font-bold text-sm text-white flex items-center gap-1">{p.name}{p.isAdmin && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1 rounded">Admin</span>}</div>
                             <div className="text-[10px] text-slate-500 flex gap-2 items-center">
                                {p.type === 'guest' ? (<span className="flex items-center gap-1 text-slate-400"><LinkIcon size={8}/> de {hostName || '?'}</span>) : (<span className="text-blue-400">Membro</span>)}
                                <span className="text-slate-700">|</span>
                                {amIAdmin ? (<span className="text-yellow-500 flex items-center gap-1 font-bold"><Star size={10} fill="currentColor"/> {getAverageRating(p)}</span>) : (myVote ? <span className="text-emerald-500 font-medium">Avaliado</span> : <span>Toca para avaliar</span>)}
                             </div>
                          </div>
                          <div className={`text-slate-600 transition-transform ${expandedPlayerId === p.id ? 'rotate-90' : ''}`}><ArrowRight size={16}/></div>
                       </div>
                       {expandedPlayerId === p.id && (
                         <div className="mt-4 pt-4 border-t border-slate-700/50 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              <div className="bg-slate-800/80 p-2 rounded text-center border border-slate-600"><div className="text-[10px] text-slate-400 font-bold">J</div><div className="font-bold text-white text-sm">{stats.games}</div></div>
                              <div className="bg-emerald-900/20 p-2 rounded text-center border border-emerald-500/30"><div className="text-[10px] text-emerald-400 font-bold">V</div><div className="font-bold text-emerald-100 text-sm">{stats.wins}</div></div>
                              <div className="bg-yellow-900/20 p-2 rounded text-center border border-yellow-500/30"><div className="text-[10px] text-yellow-400 font-bold">E</div><div className="font-bold text-yellow-100 text-sm">{stats.draws}</div></div>
                              <div className="bg-red-900/20 p-2 rounded text-center border border-red-500/30"><div className="text-[10px] text-red-400 font-bold">D</div><div className="font-bold text-red-100 text-sm">{stats.losses}</div></div>
                            </div>
                            {p.uid !== currentUser.uid && (<div className="mb-4 text-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50"><div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Classificar Jogador</div><div className="flex justify-center mb-3"><StarRating value={votingStars} onChange={setVotingStars} size={28} /></div><button onClick={(e) => { e.stopPropagation(); submitPlayerVote(p, votingStars); }} className="w-full bg-slate-700 hover:bg-slate-600 text-xs py-2 rounded-lg text-white font-bold transition-colors">Confirmar Classificação</button></div>)}
                            {amIAdmin && (<div className="flex gap-2 pt-2 border-t border-slate-700/50">{isOwner && p.uid !== group.ownerId && (<button onClick={(e) => { e.stopPropagation(); toggleAdmin(p); }} className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${p.isAdmin ? 'border-red-500/30 text-red-400 bg-red-900/10 hover:bg-red-900/20' : 'border-yellow-500/30 text-yellow-400 bg-yellow-900/10 hover:bg-yellow-900/20'}`}>{p.isAdmin ? <><ShieldAlert size={14}/> Remover Admin</> : <><ShieldCheck size={14}/> Promover Admin</>}</button>)}<button onClick={(e) => { e.stopPropagation(); deletePlayer(p.id); }} className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-red-500/30 text-red-400 bg-red-900/10 hover:bg-red-900/20 flex items-center justify-center gap-1"><Trash2 size={14}/> Eliminar</button></div>)}
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB TEAM */}
        {activeTab === 'team' && (
          <div className="space-y-6 max-w-md mx-auto">
            {!isGenerated ? (
              <>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 sticky top-0 z-10 shadow-lg">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-sm">Selecionar ({selectedIds.length})</h3><button onClick={generateTeams} className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"><Shuffle size={14}/> Criar Equipas</button></div>
                  <input type="text" placeholder="Procurar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => toggleSelection(p.id)} className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${selectedIds.includes(p.id) ? 'bg-emerald-900/30 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedIds.includes(p.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>{selectedIds.includes(p.id) && <Check size={10} className="text-white"/>}</div>
                      <div className="truncate"><span className="text-xs font-medium block">{p.name}</span>{amIAdmin && <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><Star size={8} className="fill-slate-500"/> {getAverageRating(p)}</span>}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-in zoom-in duration-300 space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-white text-lg flex items-center gap-2"><SoccerBall size={20} className="text-yellow-500"/> Jogo a Decorrer</h3><button onClick={() => setIsGenerated(false)} className="text-xs text-red-400 hover:underline font-medium">Cancelar</button></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-3 rounded-xl border-t-4 border-t-white shadow-lg"><div className="font-bold text-center text-white mb-3 text-sm border-b border-slate-700 pb-2">Equipa Branco ({teamA.length})</div><ul className="text-xs text-slate-300 space-y-1.5">{teamA.map(p => <li key={p.id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> {p.name}</li>)}</ul></div>
                  <div className="bg-slate-800 p-3 rounded-xl border-t-4 border-t-slate-950 shadow-lg"><div className="font-bold text-center text-slate-400 mb-3 text-sm border-b border-slate-700 pb-2">Equipa Preto ({teamB.length})</div><ul className="text-xs text-slate-300 space-y-1.5">{teamB.map(p => <li key={p.id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-black border border-slate-600 rounded-full"></div> {p.name}</li>)}</ul></div>
                </div>
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mt-4 shadow-lg">
                  <div className="text-center text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">Resultado Final</div>
                  <div className="flex justify-center items-center gap-4 mb-4"><input type="number" min="0" value={scoreA} onChange={e=>setScoreA(e.target.value)} className="w-16 h-16 text-center text-3xl font-bold bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-emerald-500 outline-none" placeholder="0"/><span className="text-slate-500 font-light text-2xl">X</span><input type="number" min="0" value={scoreB} onChange={e=>setScoreB(e.target.value)} className="w-16 h-16 text-center text-3xl font-bold bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-emerald-500 outline-none" placeholder="0"/></div>
                  <button onClick={saveMatch} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">Terminar Jogo</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4 max-w-md mx-auto">
            {matches.length === 0 && <div className="text-center text-slate-500 text-sm py-10 italic">Sem jogos registados ainda.</div>}
            {matches.map(m => {
              const mvp = getMatchMVP(m);
              return (
                <div key={m.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm hover:border-slate-600 transition-colors">
                  <div className="bg-slate-900/50 p-2 text-center text-[10px] text-slate-500 border-b border-slate-700 font-medium uppercase tracking-wider relative">
                    {new Date(m.date).toLocaleDateString()}
                    {amIAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); deleteMatch(m.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 p-1" title="Apagar Jogo"><Trash2 size={12} /></button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4"><div className="text-center w-1/3"><div className={`text-3xl font-bold ${m.scoreA > m.scoreB ? 'text-emerald-400' : 'text-slate-300'}`}>{m.scoreA}</div><div className="text-[10px] text-slate-500 truncate mt-1">Branco</div></div><div className="text-slate-600 text-sm font-light">X</div><div className="text-center w-1/3"><div className={`text-3xl font-bold ${m.scoreB > m.scoreA ? 'text-emerald-400' : 'text-slate-300'}`}>{m.scoreB}</div><div className="text-[10px] text-slate-500 truncate mt-1">Preto</div></div></div>
                  <div className="bg-slate-900/30 p-2 border-t border-slate-700/50">{mvp ? (<div className="flex items-center justify-center gap-2 text-yellow-500"><Trophy size={14} className="fill-yellow-500" /><span className="text-xs font-bold text-yellow-200">MVP: {mvp.name} ({mvp.votes})</span></div>) : (votingMatchId === m.id ? (<div className="flex gap-2 animate-in fade-in"><select value={mvpSelectedId} onChange={(e) => setMvpSelectedId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 rounded text-xs p-1.5 text-white outline-none"><option value="">Quem foi o Craque?</option>{[...(m.teamA || []), ...(m.teamB || [])].map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select><button onClick={() => submitMvpVote(m)} className="bg-yellow-600 text-white px-3 rounded text-xs font-bold">Votar</button></div>) : (!m.mvpVotes?.[currentUser.uid] && (<button onClick={() => setVotingMatchId(m.id)} className="w-full text-center text-xs text-yellow-500/80 hover:text-yellow-400 font-medium flex items-center justify-center gap-1"><Star size={12} /> Votar Melhor em Campo</button>)))}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB TROPHIES */}
        {activeTab === 'trophies' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120} className="text-yellow-500"/></div>
                <div className="relative z-10">
                   <div className="w-20 h-20 mx-auto rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center mb-3 overflow-hidden shadow-xl">
                      {myPlayerProfile?.photoUrl ? <img src={myPlayerProfile.photoUrl} className="w-full h-full object-cover"/> : <User size={40} className="text-slate-400"/>}
                   </div>
                   <h2 className="text-xl font-bold text-white">{myPlayerProfile?.name || "Eu"}</h2>
                   <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">Estatísticas de Carreira</p>
                   <div className={`grid ${amIAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-6`}>
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700"><div className="text-[10px] text-slate-500 font-bold uppercase">Jogos</div><div className="text-lg font-bold text-white">{myPlayerProfile?.stats?.games || 0}</div></div>
                      <div className="bg-emerald-900/20 p-2 rounded-lg border border-emerald-500/20"><div className="text-[10px] text-emerald-500 font-bold uppercase">Vitórias</div><div className="text-lg font-bold text-emerald-400">{myPlayerProfile?.stats?.wins || 0}</div></div>
                      <div className="bg-yellow-900/20 p-2 rounded-lg border border-yellow-500/20"><div className="text-[10px] text-yellow-500 font-bold uppercase">MVPs</div><div className="text-lg font-bold text-yellow-400">{getMVPCount(myPlayerProfile?.id)}</div></div>
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

        {/* TAB TREASURY */}
        {activeTab === 'treasury' && amIAdmin && (
          <div className="space-y-6">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Wallet size={18}/> Tesouraria</h2><input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none"/></div>
                 <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><AlertCircle size={18} className="text-red-400"/> Resumo de Dívidas</h3>
                        <div className="space-y-2">
                            {players.map(p => ({ ...p, debt: calculatePlayerDebt(p.id) })).filter(p => p.debt > 0).sort((a, b) => b.debt - a.debt).map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-red-900/30">
                                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs overflow-hidden">{p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : p.name.substring(0,2)}</div><span className="text-sm text-slate-200">{p.name}</span></div><span className="text-sm font-bold text-red-400">{p.debt.toFixed(2)}€</span>
                                </div>
                            ))}
                            {players.every(p => calculatePlayerDebt(p.id) === 0) && <div className="text-center text-slate-500 text-xs py-2 italic">Ninguém deve nada! 🎉</div>}
                        </div>
                    </div>
                 </div>
                {hasMonthlyFee && (
                    <div className="space-y-2 mb-6">
                       <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Mensalidades ({monthlyFixedIds.length})</h3>
                       {monthlyFixedIds.map(pid => {
                          const p = players.find(pl => pl.id === pid);
                          if(!p) return null;
                          const isPaid = monthlyPayments[pid];
                          return (
                             <div key={pid} className="flex justify-between items-center bg-slate-700/30 p-2 rounded border border-slate-700">
                                <span className="text-sm text-white">{p.name}</span>
                                <button onClick={() => toggleMonthlyPayment(pid)} className={`text-[10px] font-bold px-3 py-1 rounded border ${isPaid ? 'bg-emerald-900/30 text-emerald-400 border-emerald-600' : 'bg-red-900/30 text-red-400 border-red-600'}`}>{isPaid ? 'PAGO' : 'FALTA'}</button>
                             </div>
                          );
                       })}
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Banknote size={16} className="text-orange-400"/> Detalhe Jogos ({guestFee}€)</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                       {matches.map(m => {
                          const unpaid = Object.entries(m.payments || {}).filter(([_, paid]) => !paid);
                          if(unpaid.length === 0) return null;
                          return unpaid.map(([pid]) => {
                             const p = players.find(pl => pl.id === pid);
                             return (
                                <div key={`${m.id}-${pid}`} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-red-900/30">
                                   <div><div className="text-[10px] text-slate-500">{new Date(m.date).toLocaleDateString()}</div><div className="text-sm font-bold text-white">{p ? p.name : 'Desconhecido'}</div></div>
                                   <button onClick={() => settleMatchPayment(m.id, pid)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">Regularizar</button>
                                </div>
                             );
                          });
                       })}
                       {matches.every(m => !m.payments || Object.values(m.payments).every(p => p)) && <div className="text-center text-xs text-slate-500 italic py-2">Tudo pago!</div>}
                    </div>
                 </div>
             </div>
          </div>
        )}

        {/* TAB SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-md mx-auto">
             {amIAdmin && (
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><Settings size={18} className="text-blue-400"/> Definições do Grupo</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-600"><div><div className="text-xs font-bold text-white">Mensalidades (Fixos)</div><div className="text-[10px] text-slate-500">Ativa gestão de membros mensais</div></div><button onClick={() => setHasMonthlyFee(!hasMonthlyFee)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${hasMonthlyFee ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{hasMonthlyFee ? "Ativo" : "Inativo"}</button></div>
                   {hasMonthlyFee && (<div><label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Valor Mensalidade (€)</label><div className="flex gap-2"><input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"/></div></div>)}
                   <div><label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Preço por Jogo ({hasMonthlyFee ? 'Convidados' : 'Todos'}) (€)</label><input type="number" value={guestFee} onChange={e=>setGuestFee(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"/></div>
                </div>
             </div>
             )}
             {amIAdmin && (
             <>
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><Clock size={18} className="text-blue-400"/> Próximo Jogo</h3>
                <div className="space-y-3">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Data</label><input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"/></div>
                      <div><label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Hora</label><input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"/></div>
                   </div>
                   <div><label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Periodicidade</label><select value={editFreq} onChange={e=>setEditFreq(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"><option value="once">Apenas uma vez</option><option value="weekly">Semanalmente</option><option value="biweekly">Quinzenalmente</option></select></div>
                </div>
             </div>
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><MapIcon size={18} className="text-emerald-400"/> Localização do Campo</h3>
                <div className="space-y-3"><input type="text" value={editLocationUrl} onChange={e=>setEditLocationUrl(e.target.value)} placeholder="Cola aqui o link do Google Maps..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"/><p className="text-[10px] text-slate-500">A meteorologia será atualizada automaticamente com base neste link.</p></div>
             </div>
             <button onClick={saveGameSettings} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"><Save size={18} /> Guardar Definições</button>
             </>
             )}
             <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl space-y-4 mt-8">
                <div className="flex items-center gap-2 text-red-500 font-bold mb-2"><ShieldAlert size={20} /> Zona de Perigo</div>
                {isOwner ? (
                    <>
                      <p className="text-sm text-red-300">Como dono, podes apagar este grupo permanentemente. Esta ação é irreversível.</p>
                      <button onClick={deleteThisGroup} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"><Trash2 size={18} /> Apagar Grupo</button>
                    </>
                ) : (
                    <>
                      <p className="text-sm text-red-300">Se saíres do grupo, deixarás de receber notificações e convocatórias. O teu histórico de jogos neste grupo será mantido.</p>
                      <button onClick={leaveThisGroup} className="w-full bg-red-600/80 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"><LogOut size={18} /> Sair do Grupo</button>
                    </>
                )}
             </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-30">
        <div className="flex items-center justify-center">
            <div className="flex overflow-x-auto items-center p-2 gap-4 px-6 no-scrollbar w-full max-w-3xl md:justify-center">
                <NavButton active={activeTab==='schedule'} onClick={()=>setActiveTab('schedule')} icon={CalendarCheck} label="Agenda" />
                <NavButton active={activeTab==='team'} onClick={()=>setActiveTab('team')} icon={Shield} label="Convocatória" />
                {hasMonthlyFee && <NavButton active={activeTab==='members'} onClick={()=>setActiveTab('members')} icon={ClipboardList} label="Inscrições" />}
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
    const q = query(
      collection(db, 'artifacts', APP_ID, 'groups'), 
      where('members', 'array-contains', user.uid)
    );
    return onSnapshot(q, s => {
      const list = s.docs.map(d => ({id: d.id, ...d.data()}));
      list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setGroups(list);
    });
  }, [user]);

  const createGroup = async (e) => {
    e.preventDefault();
    if(!newGroup.trim()) return;
    setCreateError("");
    try {
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'groups'), {
        name: newGroup,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp()
      });
      
      const newGroupData = { 
        id: docRef.id, 
        name: newGroup, 
        ownerId: user.uid, 
        members: [user.uid],
        createdAt: { seconds: Date.now() / 1000 }
      };
      
      setGroups(prev => {
          if (prev.find(g => g.id === docRef.id)) return prev;
          return [newGroupData, ...prev];
      });
      setNewGroup('');
    } catch (err) {
      console.error(err);
      setCreateError("Erro de permissão. Verifica as Regras na Firebase.");
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    if(!joinCode.trim()) return;
    setMsg("");
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'groups', joinCode.trim());
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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }); }, []);
  if(loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={40}/></div>;
  if(!user) return <AuthScreen />;
  return <GroupSelector user={user} onLogout={() => signOut(auth)} />;
}