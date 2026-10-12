import { useState, useEffect } from "react";
import { Users, CalendarCheck, UserPlus, ArrowRight, LayoutGrid, User, Crown, Trophy, AlertCircle, PlusCircle, Zap } from "lucide-react";
import { collection, doc, onSnapshot, serverTimestamp, query, getDoc, getDocs, where, writeBatch } from "firebase/firestore";
import { db, APP_ID, joinGroupFn } from "../firebase";
import { newInviteCode } from "../utils";
import { rsvpLists } from "../rsvp";
import { Avatar } from "../components/ui";
import { BottomNav } from "../components/BottomNav";
import { UserProfile } from "./UserProfile";
import { GroupDashboard } from "./GroupDashboard";

/* ============================ GROUP SELECTOR ============================= */
const MODES = {
  casual: { Icon: Zap, color: "var(--blue)", bg: "rgba(106,169,224,.15)", label: "Casual" },
  weekly: { Icon: CalendarCheck, color: "var(--grass-bright)", bg: "rgba(34,197,94,.15)", label: "Semanal" },
  league: { Icon: Trophy, color: "var(--gold)", bg: "rgba(245,197,66,.15)", label: "Liga" },
};
const when = (iso) => { const d = new Date(iso); return `${d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`; };

// "Proximo jogo" no cartao do grupo (uma leitura por grupo; a cache local do Firestore torna as seguintes instantaneas)
const GroupNextLine = ({ group }) => {
  const [line, setLine] = useState(null);
  useEffect(() => {
    const base = ["artifacts", APP_ID, "groups", group.id];
    const now = Date.now();
    const load = group.settings?.groupMode === "league"
      ? getDocs(query(collection(db, ...base, "leagueGames"), where("scoreA", "==", null))).then((s) => {
        const g = s.docs.map((d) => d.data()).filter((x) => new Date(x.date).getTime() > now).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        return g ? `vs ${g.opponent} · ${when(g.date)}` : "Sem jogos marcados";
      })
      : getDoc(doc(db, ...base, "schedule", "next")).then((s) => {
        const n = s.data();
        if (!n?.date || new Date(n.date).getTime() < now - 3 * 36e5) return "Sem jogo marcado";
        const max = Number(group.settings?.maxPlayers) || 0;
        const going = rsvpLists(n, max).confirmed.length;
        return `${when(n.date)} · ${going}${max ? `/${max}` : ""} confirmados`;
      });
    load.then(setLine).catch(() => setLine(""));
  }, [group.id, group.settings?.groupMode, group.settings?.maxPlayers]);
  const mode = MODES[group.settings?.groupMode] || MODES.casual;
  return <p style={{ fontSize: 12, color: "var(--dim)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: mode.color, fontWeight: 700 }}>{mode.label}</span>{line ? ` · ${line}` : ""}</p>;
};

export const GroupSelector = ({ user, onLogout }) => {
  const [view, setView] = useState("groups");
  const [panel, setPanel] = useState(null); // "create" | "join" | null
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
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed var(--line)", borderRadius: 18, marginBottom: 16 }}><Users size={40} style={{ color: "var(--faint)", marginBottom: 10 }} /><p style={{ color: "var(--dim)", fontSize: 14, margin: 0 }}>Cria um grupo ou pede um código a um amigo!</p></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 16 }}>
          {groups.map((g) => {
            const mode = MODES[g.settings?.groupMode] || MODES.casual;
            return (
              <button key={g.id} onClick={() => setSelected(g)} className="ft-card ft-btn" style={{ padding: 14, textAlign: "left", justifyContent: "flex-start", gap: 14, borderRadius: 18 }}>
                <div style={{ padding: 11, borderRadius: 14, background: mode.bg, color: mode.color, flexShrink: 0 }}><mode.Icon size={22} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</h3>
                    {g.ownerId === user.uid && <Crown size={13} aria-label="Dono" style={{ color: "var(--gold)", flexShrink: 0 }} />}
                  </div>
                  <GroupNextLine group={g} />
                </div>
                <ArrowRight size={16} style={{ color: "var(--faint)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => setPanel(panel === "create" ? null : "create")} aria-expanded={panel === "create"} className="ft-btn ft-ghost" style={{ padding: 13, fontSize: 13, borderColor: panel === "create" ? "var(--grass)" : undefined }}><PlusCircle size={16} style={{ color: "var(--grass-bright)" }} /> Criar grupo</button>
        <button onClick={() => setPanel(panel === "join" ? null : "join")} aria-expanded={panel === "join"} className="ft-btn ft-ghost" style={{ padding: 13, fontSize: 13, borderColor: panel === "join" ? "var(--blue)" : undefined }}><UserPlus size={16} style={{ color: "var(--blue)" }} /> Usar código</button>
      </div>
      {panel && <div className="ft-in" style={{ marginTop: 10 }}>
        {panel === "create" && <div className="ft-card" style={{ padding: 18 }}>
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
        </div>}
        {panel === "join" && <div className="ft-card" style={{ padding: 18 }}>
          <form onSubmit={joinGroup} style={{ display: "flex", gap: 10 }}><input className="ft-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código do convite..." /><button type="submit" disabled={!joinCode.trim()} className="ft-btn ft-ghost" style={{ padding: "0 18px", color: "var(--blue)" }}>Entrar</button></form>
          {msg && <p style={{ fontSize: 12, color: "var(--grass-bright)", marginTop: 8 }}>{msg}</p>}
        </div>}
      </div>}
      <BottomNav items={[{ id: "groups", icon: LayoutGrid, label: "Grupos", active: true, onClick: () => setView("groups") }, { id: "profile", icon: User, label: "Perfil", active: false, onClick: () => setView("profile") }]} />
    </div>
  );
};
