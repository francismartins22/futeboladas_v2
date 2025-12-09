import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CalendarCheck, Shield, History, UserPlus, Plus, Trash2, 
  Shuffle, Check, ArrowLeft, ArrowRight, LogOut, LayoutGrid, 
  PlusCircle, Loader2, Gamepad2, Globe, Calendar, User, Camera, Save,
  ShieldCheck, Crown, ShieldAlert, Settings
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, doc, updateDoc, 
  onSnapshot, deleteDoc, serverTimestamp, query, orderBy, setDoc, getDoc 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO FIREBASE (V2 PROD) ---
const firebaseConfig = {
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
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg rotate-3 border border-white/10">
            <Gamepad2 className="text-white w-10 h-10" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">Futeboladas V2</h1>
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl text-left">
          <h2 className="text-xl font-bold mb-6 text-white text-center">{isLogin ? "Entrar" : "Criar Conta"}</h2>
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/20">{error}</div>}
          <button onClick={handleGoogle} className="w-full bg-white text-slate-900 py-3 rounded-lg font-bold mb-4 flex justify-center gap-2 items-center hover:bg-slate-100 transition-colors">
            <Globe size={18}/> Google
          </button>
          <div className="relative py-2 text-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-500">Ou email</span></div></div>
          <form onSubmit={handleAuth} className="space-y-4 mt-4">
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Email" required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Password" required />
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (isLogin ? "Entrar" : "Registar")}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-emerald-400 text-sm hover:underline text-center block">{isLogin ? "Criar conta grátis" : "Já tenho conta"}</button>
        </div>
      </div>
    </div>
  );
};

// --- USER PROFILE ---
const UserProfile = ({ user, onLogout }) => {
  const [name, setName] = useState(user.displayName || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if(data.name) setName(data.name);
          if(data.photoUrl) setPhotoUrl(data.photoUrl);
        }
      } catch (e) { console.error(e); } finally { setLoadingData(false); }
    };
    fetchProfile();
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
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center shadow-lg group-hover:border-emerald-500 transition-colors">
              {photoUrl ? <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400" />}
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-lg border border-slate-900 group-hover:scale-110 transition-transform"><Camera size={16} /></div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          <p className="text-xs text-slate-500 mt-2">Toque para alterar a foto</p>
        </div>
        <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Nome de Jogador</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="O teu nome..." /></div>
        {msg && <div className={`text-sm text-center p-2 rounded ${msg.includes('sucesso') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>{msg}</div>}
        <button onClick={handleSave} disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {uploading ? "A guardar..." : "Guardar Alterações"}
        </button>
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
  
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Equipas
  const [selectedIds, setSelectedIds] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  const groupRef = (col) => collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'groups', group.id, col);
  const groupDoc = (col, id) => doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'groups', group.id, col, id);

  // Verificar se o utilizador atual é o OWNER do grupo
  const isOwner = group.ownerId === currentUser.uid;

  useEffect(() => {
    const unsubP = onSnapshot(groupRef('players'), s => setPlayers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const qMatches = query(groupRef('matches'), orderBy('createdAt', 'desc'));
    const unsubM = onSnapshot(qMatches, s => setMatches(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubG = onSnapshot(groupDoc('schedule', 'next'), s => {
      if (s.exists()) setNextGame(s.data());
      else setNextGame({ date: new Date().toISOString(), responses: {} });
    });
    return () => { unsubP(); unsubM(); unsubG(); };
  }, [group.id, currentUser.uid]); 

  const showToast = (msg, type='success') => {
    setToast({show: true, msg, type});
    setTimeout(() => setToast({show: false, msg: '', type: 'success'}), 3000);
  };

  const toggleSchedule = async (status) => {
    const currentResponses = nextGame?.responses || {};
    const newResponses = { ...currentResponses, [currentUser.uid]: status };
    await setDoc(groupDoc('schedule', 'next'), { date: nextGame?.date || new Date().toISOString(), responses: newResponses }, { merge: true });
    showToast(status === 'going' ? "Confirmado!" : "Removido");
  };

  const addPlayer = async () => {
    if(!newPlayerName.trim()) return;
    await addDoc(groupRef('players'), {
      name: newPlayerName,
      stats: { games: 0, wins: 0, draws: 0, losses: 0 },
      isAdmin: false, // Por defeito não é admin
      rating: 3,
      createdAt: serverTimestamp()
    });
    setNewPlayerName('');
    showToast("Jogador adicionado");
  };

  const joinAsPlayer = async () => {
    const alreadyExists = players.find(p => p.uid === currentUser.uid);
    if(alreadyExists) return showToast("Já estás no plantel!", "error");

    await addDoc(groupRef('players'), {
      name: currentUser.displayName || "Eu",
      uid: currentUser.uid, // Link para o user real
      stats: { games: 0, wins: 0, draws: 0, losses: 0 },
      isAdmin: isOwner, // Se for Owner, entra logo como Admin
      rating: 3,
      createdAt: serverTimestamp()
    });
    showToast("Entraste no plantel!");
  };

  const deletePlayer = async (id) => {
    if(window.confirm("Apagar jogador?")) await deleteDoc(groupDoc('players', id));
  };

  const deleteThisGroup = async () => {
    if(window.confirm("ATENÇÃO: Isto apagará o grupo e todos os jogadores/jogos para sempre. Continuar?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'groups', group.id));
      onBack(); // Voltar à lista
    }
  };

  const toggleAdmin = async (player) => {
    if (!isOwner) return showToast("Apenas o Dono pode promover admins.", "error");
    await updateDoc(groupDoc('players', player.id), { isAdmin: !player.isAdmin });
    showToast(player.isAdmin ? "Admin removido." : "Novo Admin adicionado!");
  };

  const generateTeams = () => {
    if(selectedIds.length < 2) return showToast("Mínimo 2 jogadores", "error");
    const pool = players.filter(p => selectedIds.includes(p.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    setTeamA(shuffled.slice(0, mid));
    setTeamB(shuffled.slice(mid));
    setIsGenerated(true);
  };

  const saveMatch = async () => {
    if(!scoreA || !scoreB) return showToast("Insere o resultado", "error");
    await addDoc(groupRef('matches'), {
      date: new Date().toISOString(), scoreA: parseInt(scoreA), scoreB: parseInt(scoreB),
      teamA: teamA.map(p => ({id: p.id, name: p.name})), teamB: teamB.map(p => ({id: p.id, name: p.name})),
      createdAt: serverTimestamp()
    });
    const winner = parseInt(scoreA) > parseInt(scoreB) ? 'A' : (parseInt(scoreB) > parseInt(scoreA) ? 'B' : 'draw');
    const updateStats = (p, result) => {
      const stats = p.stats || { games: 0, wins: 0, draws: 0, losses: 0 };
      stats.games += 1;
      if(result === 'win') stats.wins += 1;
      if(result === 'draw') stats.draws += 1;
      if(result === 'loss') stats.losses += 1;
      updateDoc(groupDoc('players', p.id), { stats });
    };
    teamA.forEach(p => updateStats(p, winner === 'A' ? 'win' : (winner === 'draw' ? 'draw' : 'loss')));
    teamB.forEach(p => updateStats(p, winner === 'B' ? 'win' : (winner === 'draw' ? 'draw' : 'loss')));
    setIsGenerated(false); setSelectedIds([]); setScoreA(''); setScoreB(''); setActiveTab('history');
    showToast("Jogo guardado!");
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
               <p className="text-xs text-slate-400">{players.length} Jogadores</p>
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
              <div className="text-2xl font-bold text-white mb-6 bg-slate-900/50 py-2 rounded-lg border border-slate-700/50">
                {nextGame?.date ? new Date(nextGame.date).toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long'}) : 'A definir'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => toggleSchedule('going')} className={`p-4 rounded-xl border transition-all active:scale-95 ${nextGame?.responses?.[currentUser.uid] === 'going' ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700'}`}>
                  <div className="text-2xl mb-1">👍</div><div className="font-bold text-sm text-white">Vou Jogo</div>
                </button>
                <button onClick={() => toggleSchedule('not_going')} className={`p-4 rounded-xl border transition-all active:scale-95 ${nextGame?.responses?.[currentUser.uid] === 'not_going' ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700'}`}>
                  <div className="text-2xl mb-1">👎</div><div className="font-bold text-sm text-white">Não Vou</div>
                </button>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-bold">Confirmados</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(nextGame?.responses || {}).filter(([k,v]) => v === 'going').length > 0 ? 
                    <span className="text-emerald-400 font-bold bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/50 text-sm">{Object.entries(nextGame?.responses || {}).filter(([k,v]) => v === 'going').length} jogadores</span>
                    : <span className="text-slate-600 italic text-sm">Ainda ninguém confirmou</span>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-4 max-w-md mx-auto">
            {!players.find(p => p.uid === currentUser.uid) && (
              <div onClick={joinAsPlayer} className="bg-emerald-900/30 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-900/50 transition-colors mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 p-2 rounded-full text-white"><UserPlus size={16}/></div>
                  <div><div className="font-bold text-emerald-400 text-sm">Entrar no Plantel</div><div className="text-[10px] text-emerald-200">Adiciona-te como jogador</div></div>
                </div>
                <Plus size={16} className="text-emerald-400"/>
              </div>
            )}

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm"><UserPlus size={16} className="text-emerald-400"/> Adicionar Convidado</h3>
              <div className="flex gap-2">
                <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome do craque..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors"/>
                <button onClick={addPlayer} className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-500 transition-colors"><Plus size={18}/></button>
              </div>
            </div>

            <div className="space-y-2">
              {players.map(p => (
                <div key={p.id} className={`bg-slate-800/50 p-3 rounded-lg border flex items-center justify-between transition-colors ${p.isAdmin ? 'border-yellow-500/30' : 'border-slate-700 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border relative ${p.isAdmin ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                      {p.name.substring(0,2).toUpperCase()}
                      {p.isAdmin && <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5"><Crown size={6} className="text-black"/></div>}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1">
                        {p.name}
                        {p.isAdmin && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1 rounded">Admin</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 flex gap-2">
                        <span>J: {p.stats?.games || 0}</span> • <span>V: {p.stats?.wins || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOwner && p.uid !== currentUser.uid && (
                      <button onClick={() => toggleAdmin(p)} className={`p-2 rounded-lg transition-colors ${p.isAdmin ? 'text-yellow-500 hover:bg-yellow-900/20' : 'text-slate-600 hover:text-yellow-500 hover:bg-slate-700'}`}>
                        {p.isAdmin ? <ShieldCheck size={16}/> : <Shield size={16}/>}
                      </button>
                    )}
                    <button onClick={() => deletePlayer(p.id)} className="text-slate-600 hover:text-red-400 p-2 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {players.length === 0 && <div className="text-center text-slate-500 text-sm py-4 italic">Adiciona jogadores para começar.</div>}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6 max-w-md mx-auto">
            {!isGenerated ? (
              <>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 sticky top-0 z-10 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-sm">Selecionar ({selectedIds.length})</h3>
                    <button onClick={generateTeams} className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"><Shuffle size={14}/> Gerar Equipas</button>
                  </div>
                  <input type="text" placeholder="Procurar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => toggleSelection(p.id)} className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${selectedIds.includes(p.id) ? 'bg-emerald-900/30 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedIds.includes(p.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>{selectedIds.includes(p.id) && <Check size={10} className="text-white"/>}</div>
                      <span className="text-xs font-medium truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-in zoom-in duration-300 space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-bold text-white text-lg flex items-center gap-2"><Gamepad2 size={20} className="text-yellow-500"/> Jogo a Decorrer</h3><button onClick={() => setIsGenerated(false)} className="text-xs text-red-400 hover:underline font-medium">Cancelar</button></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-3 rounded-xl border-t-4 border-t-white shadow-lg"><div className="font-bold text-center text-white mb-3 text-sm border-b border-slate-700 pb-2">Equipa Branco ({teamA.length})</div><ul className="text-xs text-slate-300 space-y-1.5">{teamA.map(p => <li key={p.id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> {p.name}</li>)}</ul></div>
                  <div className="bg-slate-800 p-3 rounded-xl border-t-4 border-t-slate-950 shadow-lg"><div className="font-bold text-center text-slate-400 mb-3 text-sm border-b border-slate-700 pb-2">Equipa Preto ({teamB.length})</div><ul className="text-xs text-slate-300 space-y-1.5">{teamB.map(p => <li key={p.id} className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-black border border-slate-600 rounded-full"></div> {p.name}</li>)}</ul></div>
                </div>
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mt-4 shadow-lg">
                  <div className="text-center text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-widest">Resultado Final</div>
                  <div className="flex justify-center items-center gap-4 mb-4">
                    <input type="number" value={scoreA} onChange={e=>setScoreA(e.target.value)} className="w-16 h-16 text-center text-3xl font-bold bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-emerald-500 outline-none" placeholder="0"/>
                    <span className="text-slate-500 font-light text-2xl">X</span>
                    <input type="number" value={scoreB} onChange={e=>setScoreB(e.target.value)} className="w-16 h-16 text-center text-3xl font-bold bg-slate-900 border border-slate-600 rounded-xl text-white focus:border-emerald-500 outline-none" placeholder="0"/>
                  </div>
                  <button onClick={saveMatch} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">Terminar Jogo</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 max-w-md mx-auto">
            {matches.length === 0 && <div className="text-center text-slate-500 text-sm py-10 italic">Sem jogos registados ainda.</div>}
            {matches.map(m => (
              <div key={m.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm hover:border-slate-600 transition-colors">
                <div className="bg-slate-900/50 p-2 text-center text-[10px] text-slate-500 border-b border-slate-700 font-medium uppercase tracking-wider">{new Date(m.date).toLocaleDateString()}</div>
                <div className="flex items-center justify-between p-4">
                  <div className="text-center w-1/3"><div className={`text-3xl font-bold ${m.scoreA > m.scoreB ? 'text-emerald-400' : 'text-slate-300'}`}>{m.scoreA}</div><div className="text-[10px] text-slate-500 truncate mt-1">Branco</div></div>
                  <div className="text-slate-600 text-sm font-light">X</div>
                  <div className="text-center w-1/3"><div className={`text-3xl font-bold ${m.scoreB > m.scoreA ? 'text-emerald-400' : 'text-slate-300'}`}>{m.scoreB}</div><div className="text-[10px] text-slate-500 truncate mt-1">Preto</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- NOVO SEPARADOR: DEFINIÇÕES --- */}
        {activeTab === 'settings' && isOwner && (
          <div className="space-y-6 max-w-md mx-auto">
             <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl space-y-4">
               <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                 <ShieldAlert size={20} /> Zona de Perigo
               </div>
               <p className="text-sm text-red-300">Apagar este grupo irá remover permanentemente todo o histórico de jogos, plantel e agenda. Esta ação não pode ser desfeita.</p>
               <button onClick={deleteThisGroup} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                 <Trash2 size={18} /> Apagar Grupo Definitivamente
               </button>
             </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-30">
        <div className="flex justify-around items-center p-2 max-w-md mx-auto">
          <NavButton active={activeTab==='schedule'} onClick={()=>setActiveTab('schedule')} icon={CalendarCheck} label="Agenda" />
          <NavButton active={activeTab==='team'} onClick={()=>setActiveTab('team')} icon={Shield} label="Convocatória" />
          <NavButton active={activeTab==='players'} onClick={()=>setActiveTab('players')} icon={Users} label="Plantel" />
          <NavButton active={activeTab==='history'} onClick={()=>setActiveTab('history')} icon={History} label="Jogos" />
          {isOwner && <NavButton active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} icon={Settings} label="Definições" />}
        </div>
      </div>
    </div>
  );
};

// --- GROUP SELECTOR ---
const GroupSelector = ({ user, onLogout }) => {
  const [view, setView] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'groups'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, s => setGroups(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  const createGroup = async (e) => {
    e.preventDefault();
    if(!newGroup.trim()) return;
    await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'groups'), {
      name: newGroup,
      ownerId: user.uid, // Regista quem criou o grupo
      createdAt: serverTimestamp()
    });
    setNewGroup('');
  };

  const deleteGroup = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Eliminar grupo e TODOS os dados associados?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'groups', id));
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
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2 text-sm"><PlusCircle className="text-emerald-400" size={18}/> Criar Novo Grupo</h2>
          <form onSubmit={createGroup} className="flex gap-3">
            <input type="text" value={newGroup} onChange={e=>setNewGroup(e.target.value)} placeholder="Ex: Pelada de Terça" className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 text-white focus:border-emerald-500 outline-none transition-colors"/>
            <button type="submit" disabled={!newGroup.trim()} className="bg-emerald-600 text-white px-6 rounded-lg font-bold hover:bg-emerald-500 disabled:opacity-50 transition-colors">Criar</button>
          </form>
        </div>
        {groups.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl"><Users size={48} className="mx-auto text-slate-700 mb-4"/><p className="text-slate-500">Cria o teu primeiro grupo para começar!</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} onClick={() => setSelectedGroup(g)} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all hover:translate-y-[-2px] group relative shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-900 rounded-lg text-emerald-500 group-hover:text-emerald-400 transition-colors"><Users size={24}/></div>
                  <button onClick={(e) => deleteGroup(e, g.id)} className="text-slate-600 hover:text-red-400 p-2 rounded-full hover:bg-slate-700 transition-colors"><Trash2 size={16}/></button>
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

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[60px] ${active ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} /> 
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }); }, []);
  if(loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={40}/></div>;
  if(!user) return <AuthScreen />;
  return <GroupSelector user={user} onLogout={() => signOut(auth)} />;
}