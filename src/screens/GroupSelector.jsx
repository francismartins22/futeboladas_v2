import { useState, useEffect } from "react";
import { Users, CalendarCheck, UserPlus, ArrowRight, LayoutGrid, User, Crown, Trophy, AlertCircle, PlusCircle, Zap } from "lucide-react";
import { collection, doc, onSnapshot, serverTimestamp, query, getDoc, where, writeBatch } from "firebase/firestore";
import { db, APP_ID, joinGroupFn } from "../firebase";
import { newInviteCode } from "../utils";
import { Avatar } from "../components/ui";
import { BottomNav } from "../components/BottomNav";
import { UserProfile } from "./UserProfile";
import { GroupDashboard } from "./GroupDashboard";

/* ============================ GROUP SELECTOR ============================= */
export const GroupSelector = ({ user, onLogout }) => {
  const [view, setView] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState("");
  const [groupMode, setGroupMode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const [createError, setCreateError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(user.photoURL || "");
  const [profileName, setProfileName] = useState(user.displayName || "");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "artifacts", APP_ID, "users", user.uid), (s) => {
      if (s.exists()) { const d = s.data(); if (d.photoUrl) setProfilePhoto(d.photoUrl); if (d.name) setProfileName(d.name); }
    });
    return () => unsub();
  }, [user.uid]);

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
      // sem permissao = o grupo existe e nao sou membro (as regras so deixam ler ids livres ou grupos meus)
      const taken = await getDoc(groupRef).then((s) => s.exists(), (err) => { if (err.code === "permission-denied") return true; throw err; });
      if (taken) return setCreateError("Já existe um grupo com esse nome. Tenta outro.");
      const batch = writeBatch(db);
      batch.set(groupRef, { name: newGroup, ownerId: user.uid, members: [user.uid], inviteCode: newInviteCode(), settings: { paymentModel: groupMode === "casual" ? "pergame" : "monthly", monthlyFee: 0, seasonFee: 0, guestFee: 4.5, groupMode: groupMode || "casual", leagueMode: groupMode === "league" }, createdAt: serverTimestamp() });
      const playerRef = doc(collection(db, "artifacts", APP_ID, "groups", customId, "players"));
      batch.set(playerRef, { name: user.displayName || "Eu", uid: user.uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: true, photoUrl: user.photoURL || null, votes: {}, createdAt: serverTimestamp() });
      await batch.commit();
      setNewGroup("");
    } catch (err) { console.error(err); setCreateError("Erro ao criar grupo: " + err.message); }
  };

  const joinGroup = async (e) => {
    e.preventDefault(); if (!joinCode.trim()) return; setMsg("");
    try {
      // a entrada e validada na Cloud Function joinGroup (as regras nao deixam ninguem acrescentar-se a um grupo)
      const { data } = await joinGroupFn({ code: joinCode.trim().toUpperCase() });
      setMsg(data.alreadyMember ? "Já pertences a este grupo!" : "Entraste no grupo!"); if (!data.alreadyMember) setJoinCode("");
    } catch (err) { console.error(err); setMsg(err.code === "functions/not-found" ? "Código inválido. Pede o código atual a um admin do grupo." : "Erro ao entrar."); }
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
    <div style={{ minHeight: "100vh", padding: "20px 16px 110px", maxWidth: 880, margin: "0 auto" }}>
      <header className="ft-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--grass-bright)" }}>Balneário</div>
          <h1 className="num" style={{ fontSize: 30, margin: "2px 0 0", color: "var(--chalk)" }}>OS TEUS GRUPOS</h1>
          <p style={{ fontSize: 13, color: "var(--dim)", margin: "4px 0 0" }}>Olá, <b style={{ color: "var(--text)" }}>{profileName || "Jogador"}</b></p>
        </div>
        <button onClick={() => setView("profile")} className="ft-btn" style={{ background: "none", padding: 0 }}><Avatar name={profileName || "Eu"} photo={profilePhoto} size={44} /></button>
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
                  <div style={{ textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 12, color: "var(--dim)" }}>{sub}</div></div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--raised)", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>Modo:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: groupMode === "league" ? "var(--gold)" : groupMode === "weekly" ? "var(--grass-bright)" : "var(--blue)" }}>{groupMode === "league" ? "Liga" : groupMode === "weekly" ? "Semanal" : "Casual"}</span>
                <button onClick={() => { setGroupMode(null); setNewGroup(""); setCreateError(""); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: 12 }}>Mudar</button>
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
                {g.ownerId === user.uid && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", padding: "3px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Crown size={10} /> Dono</span>}
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
