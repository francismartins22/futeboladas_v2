import { useState, useEffect, useRef } from "react";
import { Users, CalendarCheck, Shield, Check, ArrowLeft, Crown, Copy, MessageSquare, Swords, Menu } from "lucide-react";
import { collection, addDoc, doc, updateDoc, onSnapshot, deleteDoc, serverTimestamp, query, orderBy, limitToLast, setDoc, getDoc, arrayUnion, arrayRemove, deleteField, writeBatch } from "firebase/firestore";
import { db, APP_ID } from "../firebase";
import { firstName, getCoordsFromUrl, newInviteCode, errorMessage } from "../utils";
import { Toast, SubTabs } from "../components/ui";
import { BottomNav } from "../components/BottomNav";
import { mvpWinnerId, leagueParticipants } from "../stats";
import { confirmDialog } from "../confirm";
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
  const [groupMeta, setGroupMeta] = useState({ admins: group.admins || [], inviteCode: group.inviteCode || "" });
  const [lastReadTs, setLastReadTs] = useState(() => {
    try { return parseInt(localStorage.getItem(`lastRead_${group.id}`) || "0"); } catch { return 0; }
  });
  const [leagueGames, setLeagueGames] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [chatMuted, setChatMuted] = useState(false);

  const me = currentUser;
  const groupRef = (col) => collection(db, "artifacts", APP_ID, "groups", group.id, col);
  const groupDoc = (col, id) => doc(db, "artifacts", APP_ID, "groups", group.id, col, id);
  const isOwner = group.ownerId === me.uid;
  const myProfile = players.find((p) => p.uid === me.uid);
  const amIAdmin = isOwner || (myProfile && myProfile.isAdmin);
  // um toast novo substitui o anterior e reinicia o tempo (antes o temporizador antigo fechava o novo cedo demais)
  const showToast = (msg, type = "success") => setToast({ show: true, msg, type });
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((x) => ({ ...x, show: false })), toast.type === "error" ? 4000 : 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const collectsFixed = settings.paymentModel !== "pergame";
  const fixedFee = settings.paymentModel === "season" ? Number(settings.seasonFee) || 0 : Number(settings.monthlyFee) || 0;
  const fixedLabel = settings.paymentModel === "season" ? "Inscrição da época" : "Mensalidade";
  const fee = Number(settings.guestFee) || 0;
  const periodKey = settings.paymentModel === "season" ? "season" : `month_${currentMonth}`;

  useEffect(() => {
    const unsubP = onSnapshot(groupRef("players"), (s) => setPlayers(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubM = onSnapshot(query(groupRef("matches"), orderBy("createdAt", "desc")), (s) => setMatches(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubMsg = onSnapshot(query(groupRef("messages"), orderBy("createdAt", "asc"), limitToLast(100)), (s) => setMessages(s.docs.map((d) => { const x = d.data(); return { id: d.id, ...x, ts: x.createdAt?.seconds ? x.createdAt.seconds * 1000 : Date.now() }; })));
    const unsubG = onSnapshot(groupDoc("schedule", "next"), (s) => { if (s.exists()) setNextGame(s.data()); else setNextGame({ responses: {} }); });
    const unsubGroup = onSnapshot(doc(db, "artifacts", APP_ID, "groups", group.id), (s) => {
      if (s.exists()) { const d = s.data(); const st = d.settings || {}; setSettings({ paymentModel: st.paymentModel || "monthly", monthlyFee: st.monthlyFee ?? 0, seasonFee: st.seasonFee ?? 0, guestFee: st.guestFee ?? 4.5, locationUrl: d.locationUrl || "", leagueMode: st.leagueMode === true, groupMode: st.groupMode || "casual", maxPlayers: Number(st.maxPlayers) || 0 }); setGroupMeta({ admins: d.admins || [], inviteCode: d.inviteCode || "" }); }
    });
    const unsubLG = onSnapshot(query(groupRef("leagueGames"), orderBy("date", "asc")), (s) => setLeagueGames(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubTr = onSnapshot(query(groupRef("trainings"), orderBy("date", "asc")), (s) => setTrainings(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    // notificacoes do chat silenciadas por grupo (users/{uid}.mutedChats, lido pela Cloud Function onNewMessage)
    const unsubMe = onSnapshot(doc(db, "artifacts", APP_ID, "users", me.uid), (s) => setChatMuted((s.data()?.mutedChats || []).includes(group.id)));
    return () => { unsubP(); unsubM(); unsubMsg(); unsubG(); unsubGroup(); unsubLG(); unsubTr(); unsubMe(); };
  }, [group.id]);

  // As regras do Firestore usam a lista `admins` do grupo; o dono mantem-na igual aos isAdmin dos jogadores
  // (preenche grupos antigos e acompanha o "Promover admin").
  useEffect(() => {
    if (!isOwner || players.length === 0) return;
    const want = players.filter((p) => p.isAdmin && !p.left && p.uid && p.uid !== group.ownerId).map((p) => p.uid).sort();
    if (want.join() !== [...groupMeta.admins].sort().join()) updateDoc(doc(db, "artifacts", APP_ID, "groups", group.id), { admins: want }).catch((e) => console.error("Erro a sincronizar admins:", e));
  }, [isOwner, players, groupMeta.admins, group.id, group.ownerId]);

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
      if (nd.getTime() !== gd.getTime()) setDoc(groupDoc("schedule", "next"), { date: nd.toISOString(), frequency: nextGame.frequency, responses: {}, goingAt: {} }, { merge: true }).catch((e) => console.error("Erro ao avancar a data:", e));
    }
  }, [nextGame, amIAdmin]);

  const avg = (p) => { const v = Object.values(p.votes || {}); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : 3; };
  const matchMVP = (m) => { const w = mvpWinnerId(m); const p = w && players.find((pl) => pl.id === w.id); return p ? { ...p, votes: w.votes } : null; };
  // Quem saiu do grupo (left) desaparece do plantel, equipas e convocatorias, mas fica no historico e na tesouraria
  const activePlayers = players.filter((p) => !p.left);
  const members = activePlayers.filter((p) => p.type !== "guest");
  const guests = activePlayers.filter((p) => p.type === "guest");
  const groupMode = settings.groupMode || "casual";
  const isLeague = groupMode === "league";
  const isWeekly = groupMode === "weekly";
  const effectiveFixedIds = isLeague ? members.map((p) => p.id) : fixedIds;
  // Precos congelados: cada jogo guarda o seu `fee` e cada mensalidade paga guarda o valor pago (jogos/pagamentos antigos usam o preco atual)
  const matchFee = (m) => m.fee ?? fee;
  const paidAmount = (v) => (typeof v === "number" ? v : v ? fixedFee : 0);
  const playerDebt = (pid) => { let t = 0; if (collectsFixed && effectiveFixedIds.includes(pid) && !payments[pid]) t += fixedFee; if (!isLeague) matches.forEach((m) => { if (m.payments?.[pid] === false) t += matchFee(m); }); return t; };
  const totalDebt = players.reduce((s, p) => s + playerDebt(p.id), 0);
  const guestRevenue = matches.reduce((s, m) => s + (m.payments ? Object.values(m.payments).filter((v) => v === true).length * matchFee(m) : 0), 0);
  const fixedRevenue = collectsFixed ? effectiveFixedIds.reduce((s, id) => s + paidAmount(payments[id]), 0) : 0;
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
  // Todas as acoes passam por aqui: um erro (ex: regras do Firestore) vira toast em vez de falhar em silencio.
  // Devolve false se falhou, para as tabs nao mostrarem "guardado" nem apagarem o que o utilizador escreveu.
  const safe = (fn) => async (...args) => {
    try { await fn(...args); return true; } catch (e) { console.error(e); showToast(errorMessage(e), "error"); return false; }
  };
  const toggleSchedule = safe(async (status) => {
    if (nextGame?.responses?.[me.uid] === status) return;
    // goingAt = ordem de chegada para a lista de espera (as regras exigem a hora do servidor)
    await setDoc(groupDoc("schedule", "next"), { responses: { [me.uid]: status }, goingAt: { [me.uid]: status === "going" ? serverTimestamp() : deleteField() } }, { merge: true }); showToast(status === "going" ? "Confirmado! Bora 💪" : "Removido da convocatória"); });
  const toggleChatMute = safe(async () => {
    await setDoc(doc(db, "artifacts", APP_ID, "users", me.uid), { mutedChats: chatMuted ? arrayRemove(group.id) : arrayUnion(group.id) }, { merge: true });
    showToast(chatMuted ? "Notificações do chat ativas" : "Chat silenciado neste grupo");
  });
  const sendMessage = safe(async (text) => { await addDoc(groupRef("messages"), { uid: me.uid, name: myProfile?.name || me.displayName || "Jogador", photoUrl: myProfile?.photoUrl || me.photoURL || null, text, createdAt: serverTimestamp() }); });
  const addTraining = safe(async ({ date, local }) => { await addDoc(groupRef("trainings"), { date, local, responses: {}, createdAt: serverTimestamp() }); showToast("Treino marcado!"); });
  const deleteTraining = safe(async (id) => { if (await confirmDialog({ title: "Apagar treino?", message: "As respostas a este treino também são apagadas.", confirmLabel: "Apagar", danger: true })) await deleteDoc(groupDoc("trainings", id)); });
  const toggleTraining = safe(async (id, status) => { await updateDoc(groupDoc("trainings", id), { [`responses.${me.uid}`]: status }); showToast(status === "going" ? "Confirmado!" : "Removido"); });
  const addLeagueGame = safe(async ({ opponent, date, home }) => { await addDoc(groupRef("leagueGames"), { opponent, date, home, scoreA: null, scoreB: null, lineup: null, createdAt: serverTimestamp() }); showToast("Jogo adicionado ao calendário!"); });
  const deleteLeagueGame = safe(async (id) => { if (await confirmDialog({ title: "Apagar jogo da liga?", message: "O resultado, a convocatória e os golos deste jogo são apagados e as estatísticas recalculadas.", confirmLabel: "Apagar", danger: true })) await deleteDoc(groupDoc("leagueGames", id)); });
  // Guarda tambem quem jogou (playerIds): as estatisticas sao calculadas a partir daqui (ver stats.js)
  const saveLeagueResult = safe(async (id, scoreA, scoreB, goals, mvp) => {
    const game = leagueGames.find((g) => g.id === id);
    const playerIds = leagueParticipants(game || {}, members.map((m) => m.id)); // ao corrigir mantem os ja gravados
    await updateDoc(groupDoc("leagueGames", id), { scoreA, scoreB, goals: goals || {}, mvp: mvp || null, playerIds });
    showToast("Resultado guardado!");
  });
  const saveLineup = safe(async (gameId, data) => { await updateDoc(groupDoc("leagueGames", gameId), { lineup: data }); showToast("Convocatória guardada!"); });

  const addPlayer = safe(async ({ name, type, hostId }) => { let finalName = name; if (type === "guest" && hostId) { const h = players.find((p) => p.id === hostId); if (h) finalName = `${name} (C - ${firstName(h.name)})`; } await addDoc(groupRef("players"), { name: finalName, type, hostId: hostId || null, stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: false, votes: {}, createdAt: serverTimestamp() }); showToast("Jogador adicionado!"); });
  const joinAsPlayer = safe(async () => { if (players.find((p) => p.uid === me.uid)) return showToast("Já estás no plantel!", "error"); let photo = me.photoURL; try { const ud = await getDoc(doc(db, "artifacts", APP_ID, "users", me.uid)); if (ud.exists()) photo = ud.data().photoUrl || photo; } catch (e) { /* noop */ } await addDoc(groupRef("players"), { name: me.displayName || "Eu", uid: me.uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 }, isAdmin: isOwner, photoUrl: photo, votes: {}, createdAt: serverTimestamp() }); showToast("Entraste no plantel!"); });
  const ratePlayer = safe(async (p, r) => { await updateDoc(groupDoc("players", p.id), { [`votes.${me.uid}`]: r }); showToast("Avaliação registada!"); });
  const removePlayer = safe(async (p) => { if (!amIAdmin) return; if (await confirmDialog({ title: `Eliminar ${p.name}?`, message: "O jogador sai do plantel. Os jogos em que participou mantêm-se.", confirmLabel: "Eliminar", danger: true })) await deleteDoc(groupDoc("players", p.id)); });
  const toggleAdmin = safe(async (p) => { if (!isOwner || p.uid === group.ownerId) return; await updateDoc(groupDoc("players", p.id), { isAdmin: !p.isAdmin }); showToast("Admin alterado"); });
  const editMatch = safe(async (id, { scoreA, scoreB, goals }) => { await updateDoc(groupDoc("matches", id), { scoreA, scoreB, goals }); showToast("Resultado corrigido!"); });
  const deleteMatch = safe(async (id) => { if (!amIAdmin) return; if (await confirmDialog({ title: "Apagar jogo?", message: "O resultado, os golos, os votos de MVP e os pagamentos deste jogo são apagados.", confirmLabel: "Apagar", danger: true })) await deleteDoc(groupDoc("matches", id)); });
  const submitMvp = safe(async (mid, pid) => { await updateDoc(groupDoc("matches", mid), { [`mvpVotes.${me.uid}`]: pid }); showToast("Voto registado!"); });
  const signUp = safe(async () => { if (!myProfile || fixedIds.includes(myProfile.id)) return; await setDoc(groupDoc("treasury", periodKey), { fixedIds: arrayUnion(myProfile.id) }, { merge: true }); showToast("Inscrito como fixo!"); });
  const signOutFixed = safe(async () => { if (!myProfile) return; await setDoc(groupDoc("treasury", periodKey), { fixedIds: arrayRemove(myProfile.id) }, { merge: true }); showToast("Inscrição cancelada"); });
  const payFixed = safe(async (pid) => { await setDoc(groupDoc("treasury", periodKey), { payments: { [pid]: fixedFee } }, { merge: true }); showToast(`${fixedLabel} paga!`); });
  const payMatch = safe(async (mid, pid) => { await updateDoc(groupDoc("matches", mid), { [`payments.${pid}`]: true }); showToast("Jogo pago!"); });

  const saveMatch = safe(async ({ teamA, teamB, scoreA, scoreB, goals }) => {
    if (nextGame?.frequency && nextGame.frequency !== "once" && nextGame.date) {
      const nd = new Date(nextGame.date); nd.setDate(nd.getDate() + (nextGame.frequency === "biweekly" ? 14 : 7));
      await setDoc(groupDoc("schedule", "next"), { date: nd.toISOString(), frequency: nextGame.frequency, responses: {}, goingAt: {} }, { merge: true });
    }
    const pays = {}; [...teamA, ...teamB].forEach((p) => { if (collectsFixed ? !fixedIds.includes(p.id) : true) pays[p.id] = false; });
    await addDoc(groupRef("matches"), { date: new Date().toISOString(), scoreA, scoreB, teamA: teamA.map((p) => ({ id: p.id, name: p.name })), teamB: teamB.map((p) => ({ id: p.id, name: p.name })), mvpVotes: {}, goals: goals || {}, payments: pays, fee, createdAt: serverTimestamp() });
    showToast("Jogo guardado! Próxima data atualizada."); setTab("history");
  });

  const saveSettings = safe(async ({ paymentModel, monthlyFee, seasonFee, guestFee, date, time, freq, locationUrl, maxPlayers }) => {
    const sched = {}; if (date && time) sched.date = `${date}T${time}:00`; if (freq) sched.frequency = freq;
    if (Object.keys(sched).length) await setDoc(groupDoc("schedule", "next"), sched, { merge: true });
    const gUpdate = { settings: { paymentModel, monthlyFee: parseFloat(monthlyFee) || 0, seasonFee: parseFloat(seasonFee) || 0, guestFee: parseFloat(guestFee) || 0, maxPlayers: Math.max(0, parseInt(maxPlayers, 10) || 0), groupMode: settings.groupMode || "casual", leagueMode: settings.groupMode === "league" } };
    if (locationUrl) { gUpdate.locationUrl = locationUrl; const c = getCoordsFromUrl(locationUrl); if (c) gUpdate.location = c; }
    await updateDoc(doc(db, "artifacts", APP_ID, "groups", group.id), gUpdate); showToast("Definições guardadas!");
  });
  const leaveGroup = safe(async () => {
    if (isOwner || !(await confirmDialog({ title: "Sair do grupo?", message: "Deixas de receber convocatórias. Para voltar precisas do código de convite.", confirmLabel: "Sair", danger: true }))) return;
    const batch = writeBatch(db); // o jogador fica marcado como "saiu" (mantem historico e dividas); voltar com codigo reativa-o
    if (myProfile) batch.update(groupDoc("players", myProfile.id), { left: true });
    batch.update(doc(db, "artifacts", APP_ID, "groups", group.id), { members: arrayRemove(me.uid) });
    await batch.commit(); onBack();
  });
  const deleteGroup = safe(async () => { if (await confirmDialog({ title: "Apagar o grupo para sempre?", message: "Apaga todos os jogadores, jogos, mensagens e pagamentos do grupo, para todos os membros. Não dá para desfazer.", confirmLabel: "Apagar grupo", danger: true, requireText: "APAGAR" })) { await deleteDoc(doc(db, "artifacts", APP_ID, "groups", group.id)); onBack(); } });
  const copyInvite = async () => {
    try {
      let code = groupMeta.inviteCode;
      if (!code) { code = newInviteCode(); await updateDoc(doc(db, "artifacts", APP_ID, "groups", group.id), { inviteCode: code }); } // grupos antigos
      await navigator.clipboard.writeText(code);
      setCopied(true); showToast(`Código ${code} copiado!`); setTimeout(() => setCopied(false), 1800);
    } catch (e) { console.error(e); showToast("Erro ao copiar o código", "error"); }
  };

  // 5 secoes na barra de baixo; cada uma agrupa separadores (antes eram ate 13 numa barra a deslizar)
  const SECTIONS = [
    { id: "agenda", icon: CalendarCheck, label: "Agenda", badge: pendingRsvp,
      tabs: [{ id: "schedule", label: isLeague ? "Próximo jogo" : "Próxima pelada" }, ...(isLeague ? [{ id: "training", label: "Treinos" }] : [])] },
    { id: "jogo", icon: isLeague ? Swords : Shield, label: isLeague ? "Liga" : "Jogo",
      tabs: isLeague
        ? [{ id: "leaguecal", label: "Calendário" }, { id: "lineup", label: "Convocatória" }, { id: "tactics", label: "Tática" }]
        : [{ id: "team", label: "Equipas" }, { id: "tactics", label: "Tática" }, { id: "history", label: "Resultados" }] },
    { id: "chat", icon: MessageSquare, label: "Chat", badge: tab === "chat" ? 0 : unreadChat, tabs: [{ id: "chat", label: "Chat" }] },
    { id: "plantel", icon: Users, label: "Plantel", tabs: [{ id: "players", label: "Jogadores" }, { id: "trophies", label: "Carreira" }] },
    { id: "mais", icon: Menu, label: "Mais", badge: amIAdmin ? myDebt : 0,
      tabs: [...(collectsFixed && !isLeague ? [{ id: "members", label: "Inscrições" }] : []), ...(amIAdmin ? [{ id: "treasury", label: "Tesouraria" }] : []), { id: "settings", label: "Definições" }] },
  ];
  const section = SECTIONS.find((sec) => sec.tabs.some((t) => t.id === tab)) || SECTIONS[0];
  const lastTabOf = useRef({}); // cada secao reabre no ultimo separador visitado
  const goTo = (id) => { lastTabOf.current[section.id] = id; setTab(id); };
  const openSection = (sec) => setTab(sec.tabs.find((t) => t.id === lastTabOf.current[sec.id])?.id || sec.tabs[0].id);
  useEffect(() => { if (!SECTIONS.some((sec) => sec.tabs.some((t) => t.id === tab))) setTab("schedule"); }, [collectsFixed, amIAdmin]); // eslint-disable-line

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 96 }}>
      <Toast toast={toast} />
      <div className="ft-in" style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(13,20,17,.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button onClick={onBack} aria-label="Voltar aos grupos" className="ft-btn ft-ghost" style={{ padding: 11, borderRadius: 12 }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}><Users size={17} style={{ color: "var(--grass-bright)", flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</span></h2>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {isOwner && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", border: "1px solid rgba(245,197,66,.3)", background: "rgba(245,197,66,.1)", padding: "4px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Crown size={10} /> Dono</span>}
          <button onClick={copyInvite} className="ft-btn ft-ghost" style={{ fontSize: 12, padding: "0 10px", minHeight: 32 }}>{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copiado" : "Convidar"}</button>
        </div>
      </div>

      {section.tabs.length > 1 && <div style={{ padding: "14px 16px 0", maxWidth: 480, margin: "0 auto" }}><SubTabs items={section.tabs} active={tab} onChange={goTo} /></div>}
      <div style={{ padding: tab === "chat" || tab === "tactics" ? 0 : 16, maxWidth: tab === "chat" ? 620 : 480, margin: "0 auto" }}>
        {tab === "schedule" && !isLeague && <ScheduleTab next={nextGame} players={players} me={me} locationUrl={settings.locationUrl} maxPlayers={settings.maxPlayers} onToggle={toggleSchedule} />}
        {tab === "schedule" && isLeague && <LeagueScheduleTab leagueGames={leagueGames} me={me} players={players} />}
        {tab === "chat" && <ChatTab messages={messages} me={me} muted={chatMuted} onToggleMute={toggleChatMute} onSend={sendMessage} onMarkRead={markChatRead} />}
        {tab === "leaguecal" && isLeague && <LeagueCalendarTab leagueGames={leagueGames} members={members} amIAdmin={amIAdmin} onAdd={addLeagueGame} onDelete={deleteLeagueGame} onResult={saveLeagueResult} />}
        {tab === "lineup" && isLeague && <LineupTab members={members} amIAdmin={amIAdmin} leagueGames={leagueGames} onSaveLineup={saveLineup} />}
        {tab === "training" && <TrainingTab trainings={trainings} me={me} amIAdmin={amIAdmin} onAdd={addTraining} onDelete={deleteTraining} onToggle={toggleTraining} />}
        {tab === "team" && !isLeague && <TeamTab players={activePlayers} next={nextGame} maxPlayers={settings.maxPlayers} avg={avg} amIAdmin={amIAdmin} onSaveMatch={saveMatch} showToast={showToast} />}
        {tab === "tactics" && <TacticsTab members={members} showToast={showToast} leagueGames={isLeague ? leagueGames : null} />}
        {tab === "players" && <PlayersTab members={members} guests={guests} players={activePlayers} me={me} amIAdmin={amIAdmin} isOwner={isOwner} ownerId={group.ownerId} avg={avg} onAdd={addPlayer} onJoin={joinAsPlayer} onRate={ratePlayer} onRemove={removePlayer} onToggleAdmin={toggleAdmin} />}
        {tab === "history" && !isLeague && <HistoryTab matches={matches} matchMVP={matchMVP} amIAdmin={amIAdmin} me={me} onVote={submitMvp} onEdit={editMatch} onDelete={deleteMatch} />}
        {tab === "trophies" && <TrophiesTab myProfile={myProfile} amIAdmin={amIAdmin} avg={avg} fixedIds={effectiveFixedIds} players={players} matches={matches} leagueGames={leagueGames} />}
        {tab === "members" && collectsFixed && <MembersTab fixedIds={fixedIds} players={players} myProfile={myProfile} paymentModel={settings.paymentModel} onSignUp={signUp} onSignOut={signOutFixed} />}
        {tab === "treasury" && amIAdmin && <TreasuryTab players={players} matches={isLeague ? [] : matches} collectsFixed={collectsFixed} fixedIds={effectiveFixedIds} payments={payments} fixedFee={fixedFee} fee={fee} fixedLabel={fixedLabel} totalRevenue={totalRevenue} totalDebt={totalDebt} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} paymentModel={settings.paymentModel} onPayFixed={payFixed} onPayMatch={payMatch} />}
        {tab === "settings" && <SettingsTab settings={settings} next={nextGame} isOwner={isOwner} amIAdmin={amIAdmin} onSave={saveSettings} onLeave={leaveGroup} onDelete={deleteGroup} />}
      </div>

      <BottomNav items={SECTIONS.map((sec) => ({ ...sec, active: sec.id === section.id, onClick: () => openSection(sec) }))} />
    </div>
  );
};
