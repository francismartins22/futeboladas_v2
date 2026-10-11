import { useState, useEffect, useRef } from "react";
import { LogOut, Loader2, User, Camera, Save, Trophy, Bell, BellOff, Trash2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { collection, doc, serverTimestamp, query, setDoc, getDoc, where, getDocs } from "firebase/firestore";
import { auth, db, APP_ID, uploadAvatar, enablePushNotifications, disablePushNotifications, deleteAccountFn } from "../firebase";
import { Avatar } from "../components/ui";
import { playerStats } from "../stats";
import { confirmDialog } from "../confirm";

/* ============================== PROFILE ================================== */
export const UserProfile = ({ user, onLogout }) => {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // RGPD: apaga perfil, foto, mensagens e conta; nos grupos dos outros o nome passa a "Ex-jogador" (ver functions/index.js)
  const deleteAccount = async () => {
    setDeleteError("");
    if (!(await confirmDialog({ title: "Apagar a tua conta?", message: "Apaga a tua conta, foto, mensagens e os grupos onde és o único membro. Nos outros grupos o teu nome passa a \"Ex-jogador\". Não dá para desfazer.", confirmLabel: "Apagar conta", danger: true, requireText: "APAGAR" }))) return;
    setDeleting(true);
    try { await deleteAccountFn(); onLogout(); }
    catch (e) { console.error(e); setDeleteError(e.code === "functions/failed-precondition" ? e.message : "Não foi possível apagar a conta. Tenta novamente."); }
    finally { setDeleting(false); }
  };
  const [name, setName] = useState(user.displayName || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoURL || "");
  const [photoBlob, setPhotoBlob] = useState(null); // foto nova por enviar; photoUrl fica com a pre-visualizacao local
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState({ games: 0, wins: 0, mvps: 0, goals: 0, assists: 0 });
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const fileRef = useRef(null);

  const toggleNotifications = async () => {
    setNotifLoading(true);
    try {
      if (notifEnabled) { await disablePushNotifications(user.uid); setNotifEnabled(false); }
      else {
        if (typeof Notification !== "undefined" && Notification.permission === "denied") { setNotifBlocked(true); setNotifLoading(false); return; }
        const ok = await enablePushNotifications(user.uid);
        setNotifEnabled(ok); if (!ok) setNotifBlocked(true);
      }
    } finally { setNotifLoading(false); }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, "artifacts", APP_ID, "users", user.uid));
        if (snap.exists()) { const d = snap.data(); if (d.name) setName(d.name); if (d.photoUrl) setPhotoUrl(d.photoUrl); setNotifEnabled(!!d.notifEnabled); }
        const gq = query(collection(db, "artifacts", APP_ID, "groups"), where("members", "array-contains", user.uid));
        const gs = await getDocs(gq);
        // Somatorio de todos os grupos, calculado a partir dos jogos (ver stats.js); grupos lidos em paralelo
        const perGroup = await Promise.all(gs.docs.map(async (gdoc) => {
          const [ps, ms, ls] = await Promise.all(["players", "matches", "leagueGames"].map((c) => getDocs(collection(gdoc.ref, c))));
          const players = ps.docs.map((d) => ({ id: d.id, ...d.data() }));
          const mine = players.find((p) => p.uid === user.uid);
          if (!mine) return null;
          const memberIds = players.filter((p) => p.type !== "guest").map((p) => p.id);
          return playerStats(mine.id, ms.docs.map((d) => d.data()), ls.docs.map((d) => d.data()), memberIds);
        }));
        const total = { games: 0, wins: 0, mvps: 0, goals: 0, assists: 0 };
        perGroup.filter(Boolean).forEach((st) => Object.keys(total).forEach((k) => (total[k] += st[k])));
        setStats(total);
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
        canvas.toBlob((blob) => {
          setUploading(false);
          if (!blob) return setMsg("Erro ao processar a imagem.");
          setPhotoBlob(blob); setPhotoUrl(URL.createObjectURL(blob));
        }, "image/jpeg", 0.8);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setMsg(""); if (!name.trim()) return setMsg("O nome é obrigatório.");
    try {
      setUploading(true);
      let url = photoUrl;
      const legacy = url?.startsWith("data:"); // foto antiga em base64 ainda nao migrada
      if (photoBlob || legacy) { url = await uploadAvatar(user.uid, photoBlob || await (await fetch(url)).blob()); setPhotoUrl(url); setPhotoBlob(null); }
      await updateProfile(auth.currentUser, { displayName: name, photoURL: url || null });
      await setDoc(doc(db, "artifacts", APP_ID, "users", user.uid), { name, photoUrl: url, updatedAt: serverTimestamp() }, { merge: true });
      setMsg("Perfil atualizado com sucesso!");
    }
    catch (e) { console.error(e); setMsg("Erro ao guardar perfil."); } finally { setUploading(false); }
  };

  const Stat = ({ label, value, color }) => (<div className="ft-raised" style={{ borderRadius: 14, padding: 12, textAlign: "center" }}><div className="eyebrow" style={{ color: color || "var(--faint)" }}>{label}</div><div className="num" style={{ fontSize: 24, color: color || "var(--text)", marginTop: 2 }}>{value}</div></div>);

  if (loadingData) return <div style={{ padding: 60, textAlign: "center", color: "var(--grass-bright)" }}><Loader2 size={28} style={{ animation: "ftspin 1s linear infinite" }} /></div>;
  return (
    <div className="ft-in" style={{ padding: "20px 16px 110px", maxWidth: 440, margin: "0 auto" }}>
      <h2 className="num" style={{ fontSize: 24, color: "var(--chalk)", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 10 }}><User size={22} style={{ color: "var(--grass-bright)" }} /> O MEU PERFIL</h2>
      <div className="ft-card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div role="button" tabIndex={0} aria-label="Alterar foto de perfil" style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}>
            <Avatar name={name || "Eu"} photo={photoUrl} size={92} />
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--grass)", padding: 8, borderRadius: "50%", border: "2px solid var(--card)" }}>{uploading ? <Loader2 size={15} color="#04130a" style={{ animation: "ftspin 1s linear infinite" }} /> : <Camera size={15} color="#04130a" />}</div>
          </div>
          <input type="file" ref={fileRef} onChange={handleImageUpload} accept="image/*" style={{ display: "none" }} />
          <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 10 }}>Toca para alterar a foto</p>
        </div>
        <div style={{ marginTop: 16 }}><label className="eyebrow">Nome de jogador</label><input className="ft-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="O teu nome..." style={{ marginTop: 6 }} /></div>
        {msg && <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, padding: 8, borderRadius: 10, background: msg.includes("sucesso") ? "rgba(34,197,94,.12)" : "rgba(240,86,58,.12)", color: msg.includes("sucesso") ? "var(--grass-bright)" : "#ff9684" }}>{msg}</div>}
        <button onClick={save} disabled={uploading} className="ft-btn ft-grass" style={{ width: "100%", padding: 13, marginTop: 16 }}><Save size={18} /> Guardar alterações</button>
      </div>
      <div className="ft-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px" }}><Trophy size={16} style={{ color: "var(--gold)" }} /> Números globais</h3>
        <p style={{ fontSize: 12, color: "var(--dim)", margin: "0 0 14px" }}>O somatório da tua carreira em todos os grupos.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          <Stat label="Jogos" value={stats.games} /><Stat label="Vitórias" value={stats.wins} color="var(--grass-bright)" /><Stat label="Win %" value={`${stats.games ? Math.round((stats.wins / stats.games) * 100) : 0}%`} color="var(--blue)" />
          <Stat label="Golos" value={stats.goals} color="var(--grass-bright)" /><Stat label="Assist." value={stats.assists} color="var(--blue)" /><Stat label="MVPs" value={stats.mvps} color="var(--gold)" />
        </div>
      </div>
      <div className="ft-card" style={{ padding: 22, marginTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px" }}>{notifEnabled ? <Bell size={16} style={{ color: "var(--grass-bright)" }} /> : <BellOff size={16} style={{ color: "var(--faint)" }} />} Notificações</h3>
        <p style={{ fontSize: 12, color: "var(--dim)", margin: "0 0 14px" }}>Recebe um aviso quando o jogo e confirmado, 24h antes de jogar, e quando chegam mensagens novas no chat.</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a120f", border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
          <div><div style={{ fontSize: 13, fontWeight: 700 }}>Notificações push</div><div style={{ fontSize: 12, color: notifEnabled ? "var(--grass-bright)" : "var(--faint)" }}>{notifEnabled ? "Ativas" : "Inativas"}</div></div>
          <button onClick={toggleNotifications} disabled={notifLoading} className="ft-btn" style={{ fontSize: 12, padding: "7px 14px", background: notifEnabled ? "var(--grass)" : "var(--raised)", color: notifEnabled ? "#04130a" : "var(--faint)", border: "1px solid var(--line)" }}>
            {notifLoading ? <Loader2 size={14} style={{ animation: "ftspin 1s linear infinite" }} /> : (notifEnabled ? "Ativas" : "Ativar")}
          </button>
        </div>
        {notifBlocked && <p style={{ fontSize: 12, color: "#ff9684", marginTop: 10 }}>As notificações estão bloqueadas no browser. Ativa-as nas definições do site (ícone de cadeado junto ao URL) e tenta novamente.</p>}
      </div>
      <button onClick={onLogout} className="ft-btn" style={{ width: "100%", background: "none", color: "#ff9684", padding: 14, marginTop: 18 }}><LogOut size={16} /> Terminar sessão</button>
      <div style={{ border: "1px solid rgba(240,86,58,.3)", background: "rgba(240,86,58,.05)", borderRadius: 18, padding: 18, marginTop: 8 }}>
        <p style={{ fontSize: 12, color: "#ffb3a5", margin: "0 0 12px" }}>Apagar a conta remove os teus dados pessoais de todos os grupos. Os resultados dos jogos ficam, com o nome "Ex-jogador".</p>
        {deleteError && <p role="alert" style={{ fontSize: 12, color: "#ff9684", margin: "0 0 12px" }}>{deleteError}</p>}
        <button onClick={deleteAccount} disabled={deleting} className="ft-btn ft-danger" style={{ width: "100%", padding: 12 }}>{deleting ? <Loader2 size={16} style={{ animation: "ftspin 1s linear infinite" }} /> : <Trash2 size={16} />} Apagar conta</button>
      </div>
    </div>
  );
};
