import { useState, useEffect } from "react";
import { Users, CalendarCheck, Shield, History as HistoryIcon, Check, ArrowLeft, Crown, Settings, Copy, Trophy, Wallet, ClipboardList, MessageSquare, ListOrdered, Swords, Dumbbell } from "lucide-react";
import { collection, addDoc, doc, updateDoc, onSnapshot, deleteDoc, serverTimestamp, query, orderBy, limitToLast, setDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, APP_ID } from "../firebase";
import { firstName, getCoordsFromUrl } from "../utils";
import { TacticIcon } from "../components/icons";
import { Toast } from "../components/ui";
import { BottomNav } from "../components/BottomNav";
import { ChatTab } from "../tabs/ChatTab";
import { TrainingTab } from "../tabs/TrainingTab";
import { LeagueScheduleTab } from "../tabs/LeagueScheduleTab";
import { LeagueCalendarTab } from "../tabs/LeagueCalendarTab";
import { LineupTab } from "../tabs/LineupTab";
import { TacticsTab } from "../tabs/TacticsTab";
import { ScheduleTab } from "../tabs/ScheduleTab";
import { PlayersTab } from "../tabs/PlayersTab";
import { TeamTab } from "../tabs/TeamTab";
import { HistoryTab } from "../tabs/HistoryTab";
import { TrophiesTab } from "../tabs/TrophiesTab";
import { MembersTab } from "../tabs/MembersTab";
import { TreasuryTab } from "../tabs/TreasuryTab";
import { SettingsTab } from "../tabs/SettingsTab";

/* ============================ DASHBOARD ================================== */
export const GroupDashboard = ({ group, currentUser, onBack }) => {
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
    const unsubMsg = onSnapshot(query(groupRef("messages"), orderBy("createdAt", "asc"), limitToLast(100)), (s) => setMessages(s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, ts: x.createdAt?.seconds ? x.createdAt.seconds * 1000 : Date.now() }; })));
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
  }, [players, me.uid]);

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
  const mvpCount = (pid) => matches.filter((m) => matchMVP(m)?.id === pid).length + leagueGames.filter((g) => g.mvp === pid).length;
  const members = players.filter((p) => p.type !== "guest");
  const guests = players.filter((p) => p.type === "guest");
  const groupMode = settings.groupMode || "casual";
  const isLeague = groupMode === "league";
  const isWeekly = groupMode === "weekly";
  const effectiveFixedIds = isLeague ? members.map((p) => p.id) : fixedIds;
  const playerDebt = (pid) => { let t = 0; if (collectsFixed && effectiveFixedIds.includes(pid) && !payments[pid]) t += fixedFee; if (!isLeague) matches.forEach((m) => { if (m.payments?.[pid] === false) t += fee; }); return t; };
  const totalDebt = players.reduce((s, p) => s + playerDebt(p.id), 0);
  const guestRevenue = matches.reduce((s, m) => s + (m.payments ? Object.values(m.payments).filter((v) => v === true).length * fee : 0), 0);
  const fixedRevenue = collectsFixed ? effectiveFixedIds.filter((id) => payments[id]).length * fixedFee : 0;
  const totalRevenue = guestRevenue + fixedRevenue;

  // badges de notificacao in-app
  const unreadChat = messages.filter((m) => m.uid !== me.uid && (m.ts || 0) > lastReadTs).length;
  const pendingRsvp = nextGame?.date && !nextGame?.responses?.[me.uid] ? 1 : 0;
  const myDebt = playerDebt(myProfile?.id || "") > 0 ? 1 : 0;
  const markChatRead = () => {
    const now = Date.now();
    setLastReadTs(now);
    try { localStorage.setItem(`lastRead_${group.id}`, String(now)); } catch { /* noop */ }
  };

  // Escritas so com a chave do proprio utilizador: set+merge e caminhos "a.b" fundem no servidor, sem apagar respostas concorrentes
  const toggleSchedule = async (status) => { await setDoc(groupDoc("schedule", "next"), { responses: { [me.uid]: status } }, { merge: true }); showToast(status === "going" ? "Confirmado! Bora 💪" : "Removido da convocatória"); };
  const sendMessage = async (text) => { await addDoc(groupRef("messages"), { uid: me.uid, name: myProfile?.name || me.displayName || "Jogador", photoUrl: myProfile?.photoUrl || me.photoURL || null, text, createdAt: serverTimestamp() }); };
  const addTraining = async ({ date, local }) => { await addDoc(groupRef("trainings"), { date, local, responses: {}, createdAt: serverTimestamp() }); showToast("Treino marcado!"); };
  const deleteTraining = async (id) => { if (window.confirm("Apagar treino?")) await deleteDoc(groupDoc("trainings", id)); };
  const toggleTraining = async (id, status) => { await updateDoc(groupDoc("trainings", id), { [`responses.${me.uid}`]: status }); showToast(status === "going" ? "Confirmado!" : "Removido"); };
  const addLeagueGame = async ({ opponent, date, home }) => { await addDoc(groupRef("leagueGames"), { opponent, date, home, scoreA: null, scoreB: null, lineup: null, createdAt: serverTimestamp() }); showToast("Jogo adicionado ao calendário!"); };
  const deleteLeagueGame = async (id) => { if (window.confirm("Apagar jogo da liga?")) await deleteDoc(groupDoc("leagueGames", id)); };
  const saveLeagueResult = async (id, scoreA, scoreB, goals, mvp) => {
    await updateDoc(groupDoc("leagueGames", id), { scoreA, scoreB, goals: goals || {}, mvp: mvp || null });
    const game = leagueGames.find((g) => g.id === id);
    const calledIds = game?.lineup?.lineup ? Object.keys(game.lineup.lineup) : members.map((m) => m.id);
    const result = scoreA > scoreB ? "win" : scoreA < scoreB ? "loss" : "draw";
    await Promise.all(calledIds.map((pid) => {
      const p = players.find((pl) => pl.id === pid); if (!p) return Promise.resolve();
      const s = { games: 0, wins: 0, draws: 0, losses: 0, ...(p.stats || {}) };
      s.games++; if (result === "win") s.wins++; else if (result === "draw") s.draws++; else s.losses++;
      return updateDoc(groupDoc("players", pid), { stats: s });
    }));
    showToast("Resultado guardado!");
  };
  const saveLineup = async (gameId, data) => { await updateDoc(groupDoc("leagueGames", gameId), { lineup: data }); showToast("Convocatoria guardada!"); };

  const addPlayer = async ({ name, type, hostId }) => { let finalName = name; if (type === "guest" && hostId) { const h = players.find((p) => p.id === hostId); if (h) finalName = `${name} (C - ${firstName(h.name)})`; } await addDoc(groupRef("players"), { name: finalName, type, hostId: hostId || null, stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: false, votes: {}, createdAt: serverTimestamp() }); showToast("Jogador adicionado!"); };
  const joinAsPlayer = async () => { if (players.find((p) => p.uid === me.uid)) return showToast("Já estás no plantel!", "error"); let photo = me.photoURL; try { const ud = await getDoc(doc(db, "artifacts", APP_ID, "users", me.uid)); if (ud.exists()) photo = ud.data().photoUrl || photo; } catch (e) { /* noop */ } await addDoc(groupRef("players"), { name: me.displayName || "Eu", uid: me.uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: isOwner, photoUrl: photo, votes: {}, createdAt: serverTimestamp() }); showToast("Entraste no plantel!"); };
  const ratePlayer = async (p, r) => { await updateDoc(groupDoc("players", p.id), { [`votes.${me.uid}`]: r }); showToast("Avaliação registada!"); };
  const removePlayer = async (p) => { if (!amIAdmin) return; if (window.confirm(`Eliminar ${p.name}?`)) await deleteDoc(groupDoc("players", p.id)); };
  const toggleAdmin = async (p) => { if (!isOwner || p.uid === group.ownerId) return; await updateDoc(groupDoc("players", p.id), { isAdmin: !p.isAdmin }); showToast("Admin alterado"); };
  const deleteMatch = async (id) => { if (!amIAdmin) return; if (window.confirm("Apagar jogo?")) await deleteDoc(groupDoc("matches", id)); };
  const submitMvp = async (mid, pid) => { await updateDoc(groupDoc("matches", mid), { [`mvpVotes.${me.uid}`]: pid }); showToast("Voto registado!"); };
  const signUp = async () => { if (!myProfile || fixedIds.includes(myProfile.id)) return; await setDoc(groupDoc("treasury", periodKey), { fixedIds: arrayUnion(myProfile.id) }, { merge: true }); showToast("Inscrito como fixo!"); };
  const signOutFixed = async () => { if (!myProfile) return; await setDoc(groupDoc("treasury", periodKey), { fixedIds: arrayRemove(myProfile.id) }, { merge: true }); showToast("Inscrição cancelada"); };
  const payFixed = async (pid) => { await setDoc(groupDoc("treasury", periodKey), { payments: { [pid]: true } }, { merge: true }); showToast(`${fixedLabel} paga!`); };
  const payMatch = async (mid, pid) => { await updateDoc(groupDoc("matches", mid), { [`payments.${pid}`]: true }); showToast("Jogo pago!"); };

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

  const saveSettings = async ({ paymentModel, monthlyFee, seasonFee, guestFee, date, time, freq, locationUrl }) => {
    const sched = {}; if (date && time) sched.date = `${date}T${time}:00`; if (freq) sched.frequency = freq;
    if (Object.keys(sched).length) await setDoc(groupDoc("schedule", "next"), sched, { merge: true });
    const gUpdate = { settings: { paymentModel, monthlyFee: parseFloat(monthlyFee) || 0, seasonFee: parseFloat(seasonFee) || 0, guestFee: parseFloat(guestFee) || 0, groupMode: settings.groupMode || "casual", leagueMode: settings.groupMode === "league" } };
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
    ...(!isLeague ? [{ id: "history", icon: HistoryIcon, label: "Jogos" }] : []),
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
    <div style={{ minHeight: "100vh", paddingBottom: 96 }}>
      <Toast toast={toast} />
      <div className="ft-in" style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(13,20,17,.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        {tab === "tactics" && <TacticsTab members={members} showToast={showToast} leagueGames={isLeague ? leagueGames : null} />}
        {tab === "players" && <PlayersTab members={members} guests={guests} players={players} me={me} amIAdmin={amIAdmin} isOwner={isOwner} ownerId={group.ownerId} avg={avg} onAdd={addPlayer} onJoin={joinAsPlayer} onRate={ratePlayer} onRemove={removePlayer} onToggleAdmin={toggleAdmin} />}
        {tab === "history" && !isLeague && <HistoryTab matches={matches} matchMVP={matchMVP} amIAdmin={amIAdmin} me={me} onVote={submitMvp} onDelete={deleteMatch} />}
        {tab === "trophies" && <TrophiesTab myProfile={myProfile} amIAdmin={amIAdmin} avg={avg} mvpCount={mvpCount} fixedIds={effectiveFixedIds} players={players} matches={matches} leagueGames={leagueGames} />}
        {tab === "members" && collectsFixed && <MembersTab fixedIds={fixedIds} players={players} myProfile={myProfile} paymentModel={settings.paymentModel} onSignUp={signUp} onSignOut={signOutFixed} />}
        {tab === "treasury" && amIAdmin && <TreasuryTab players={players} matches={isLeague ? [] : matches} collectsFixed={collectsFixed} fixedIds={effectiveFixedIds} payments={payments} fixedFee={fixedFee} fee={fee} fixedLabel={fixedLabel} totalRevenue={totalRevenue} totalDebt={totalDebt} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} paymentModel={settings.paymentModel} onPayFixed={payFixed} onPayMatch={payMatch} />}
        {tab === "settings" && <SettingsTab settings={settings} next={nextGame} isOwner={isOwner} amIAdmin={amIAdmin} onSave={saveSettings} onLeave={leaveGroup} onDelete={deleteGroup} />}
      </div>

      <BottomNav items={TABS.map((t) => ({ ...t, active: tab === t.id, onClick: () => setTab(t.id) }))} />
    </div>
  );
};
