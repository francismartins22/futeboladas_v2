/**
 * Cloud Functions - Futeboladas V3
 * Notificacoes push via Firebase Cloud Messaging (FCM).
 *
 * Eventos cobertos:
 *  1. Jogo/treino confirmado (criacao ou alteracao da data em schedule/next ou trainings/*)
 *  2. Lembrete 24h antes do jogo/treino (scheduled function, corre a cada hora)
 *  3. Nova mensagem no chat do grupo
 *
 * Todas as functions sao "best effort": se o FCM falhar para um token invalido
 * (utilizador desinstalou a app, etc.), o token e removido do perfil em vez de
 * rebentar a function.
 */

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { parseGameDate, formatTime, formatDate } = require("./dates");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const APP_ID = "futeboladas-v3";

/* --------------------------- Helpers comuns ------------------------------ */

// Devolve [{uid, tokens}] para os membros do grupo, exceto o uid a ignorar (opcional)
async function getMemberTokens(groupId, excludeUid) {
  const groupSnap = await db.doc(`artifacts/${APP_ID}/groups/${groupId}`).get();
  if (!groupSnap.exists) return [];
  const members = groupSnap.data().members || [];
  const targets = members.filter((uid) => uid !== excludeUid);
  if (targets.length === 0) return [];

  const userDocs = await Promise.all(targets.map((uid) => db.doc(`artifacts/${APP_ID}/users/${uid}`).get()));
  const out = [];
  userDocs.forEach((snap, i) => {
    if (!snap.exists) return;
    const d = snap.data();
    if (d.notifEnabled === false) return; // utilizador desativou notificacoes
    const tokens = Array.isArray(d.fcmTokens) ? d.fcmTokens : [];
    if (tokens.length) out.push({ uid: targets[i], tokens });
  });
  return out;
}

// Envia a mesma notificacao a varios utilizadores (cada um com os seus tokens),
// removendo tokens invalidos do Firestore quando o FCM os rejeita.
async function sendToMembers(memberTokens, notification, data = {}) {
  const allTokens = memberTokens.flatMap((m) => m.tokens);
  if (allTokens.length === 0) return;

  const message = {
    notification,
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens: allTokens,
  };

  let response;
  try {
    response = await messaging.sendEachForMulticast(message);
  } catch (e) {
    logger.error("Erro ao enviar FCM:", e);
    return;
  }

  // limpar tokens invalidos
  const invalidTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code || "";
      if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
        invalidTokens.push(allTokens[i]);
      }
    }
  });
  if (invalidTokens.length === 0) return;

  await Promise.all(
    memberTokens.map(async (m) => {
      const toRemove = m.tokens.filter((t) => invalidTokens.includes(t));
      if (toRemove.length === 0) return;
      await db.doc(`artifacts/${APP_ID}/users/${m.uid}`).update({
        fcmTokens: FieldValue.arrayRemove(...toRemove),
      });
    })
  );
}

/* ====================== 1. JOGO/TREINO CONFIRMADO ======================== */

exports.onScheduleConfirmed = onDocumentWritten(
  "artifacts/{appId}/groups/{groupId}/schedule/next",
  async (event) => {
    const { appId, groupId } = event.params;
    if (appId !== APP_ID) return;

    const before = event.data.before.exists ? event.data.before.data() : null;
    const after = event.data.after.exists ? event.data.after.data() : null;
    if (!after?.date) return;

    // so notifica se a data mudou de facto (evita disparar em cada RSVP)
    if (before?.date === after.date) return;

    const memberTokens = await getMemberTokens(groupId);
    if (memberTokens.length === 0) return;

    await sendToMembers(
      memberTokens,
      { title: "Pelada marcada! ⚽", body: `Próximo jogo: ${formatDate(after.date)}` },
      { type: "schedule", groupId, url: "/" }
    );
    logger.info(`Notificacao de jogo confirmado enviada para o grupo ${groupId}`);
  }
);

exports.onTrainingCreated = onDocumentCreated(
  "artifacts/{appId}/groups/{groupId}/trainings/{trainingId}",
  async (event) => {
    const { appId, groupId } = event.params;
    if (appId !== APP_ID) return;

    const data = event.data.data();
    if (!data?.date || !data?.local) return;

    const memberTokens = await getMemberTokens(groupId);
    if (memberTokens.length === 0) return;

    await sendToMembers(
      memberTokens,
      { title: "Treino marcado! 🏃", body: `${data.local} · ${formatDate(data.date)}` },
      { type: "training", groupId, url: "/" }
    );
    logger.info(`Notificacao de treino marcado enviada para o grupo ${groupId}`);
  }
);

/* ============================ 2. LEMBRETE 24H ============================ */

// Corre a cada hora; verifica jogos (schedule/next), jogos de liga (leagueGames)
// e treinos cuja data caia entre 23h e 24h a partir de agora, e ainda nao tenham
// sido notificados (campo reminderSent).
exports.reminder24h = onSchedule("every 60 minutes", async () => {
  const now = Date.now();
  const windowStart = now + 23 * 3600 * 1000;
  const windowEnd = now + 24 * 3600 * 1000;
  const inWindow = (iso) => {
    const t = parseGameDate(iso).getTime();
    return t >= windowStart && t <= windowEnd;
  };

  const groupsSnap = await db.collection(`artifacts/${APP_ID}/groups`).get();

  for (const groupDoc of groupsSnap.docs) {
    const groupId = groupDoc.id;

    // -- peladas internas (schedule/next) --
    const schedRef = db.doc(`artifacts/${APP_ID}/groups/${groupId}/schedule/next`);
    const schedSnap = await schedRef.get();
    if (schedSnap.exists) {
      const data = schedSnap.data();
      if (data.date && inWindow(data.date) && !data.reminderSent) {
        const memberTokens = await getMemberTokens(groupId);
        if (memberTokens.length > 0) {
          await sendToMembers(
            memberTokens,
            { title: "Falta 1 dia! ⏰", body: `A pelada é já amanhã às ${formatTime(data.date)}.` },
            { type: "reminder_schedule", groupId, url: "/" }
          );
        }
        await schedRef.update({ reminderSent: true });
      }
      // reset do flag quando a data muda para a frente (proximo ciclo recorrente)
      if (data.date && !inWindow(data.date) && data.reminderSent && parseGameDate(data.date).getTime() > now) {
        await schedRef.update({ reminderSent: false });
      }
    }

    // -- jogos oficiais da liga --
    const leagueSnap = await db.collection(`artifacts/${APP_ID}/groups/${groupId}/leagueGames`)
      .where("scoreA", "==", null).get();
    for (const gameDoc of leagueSnap.docs) {
      const data = gameDoc.data();
      if (data.date && inWindow(data.date) && !data.reminderSent) {
        const memberTokens = await getMemberTokens(groupId);
        if (memberTokens.length > 0) {
          await sendToMembers(
            memberTokens,
            { title: "Jogo oficial amanhã! 🏆", body: `vs ${data.opponent} · ${formatTime(data.date)}` },
            { type: "reminder_league", groupId, url: "/" }
          );
        }
        await gameDoc.ref.update({ reminderSent: true });
      }
    }

    // -- treinos --
    const trainSnap = await db.collection(`artifacts/${APP_ID}/groups/${groupId}/trainings`).get();
    for (const trainDoc of trainSnap.docs) {
      const data = trainDoc.data();
      if (data.date && inWindow(data.date) && !data.reminderSent) {
        const memberTokens = await getMemberTokens(groupId);
        if (memberTokens.length > 0) {
          await sendToMembers(
            memberTokens,
            { title: "Treino amanhã! 🏃", body: `${data.local} · ${formatTime(data.date)}` },
            { type: "reminder_training", groupId, url: "/" }
          );
        }
        await trainDoc.ref.update({ reminderSent: true });
      }
    }
  }

  logger.info("Verificacao de lembretes 24h concluida.");
});

/* =========================== 3. NOVA MENSAGEM ============================= */

exports.onNewMessage = onDocumentCreated(
  "artifacts/{appId}/groups/{groupId}/messages/{messageId}",
  async (event) => {
    const { appId, groupId } = event.params;
    if (appId !== APP_ID) return;

    const data = event.data.data();
    if (!data?.text || !data?.uid) return;

    const memberTokens = await getMemberTokens(groupId, data.uid); // exclui o remetente
    if (memberTokens.length === 0) return;

    const groupSnap = await db.doc(`artifacts/${APP_ID}/groups/${groupId}`).get();
    const groupName = groupSnap.exists ? groupSnap.data().name : "Grupo";

    await sendToMembers(
      memberTokens,
      { title: `${data.name || "Alguém"} · ${groupName}`, body: data.text.slice(0, 120) },
      { type: "chat", groupId, url: "/" }
    );
    logger.info(`Notificacao de chat enviada para o grupo ${groupId}`);
  }
);

/* ======================== 4. ENTRAR NUM GRUPO ============================= */

// As regras do Firestore nao deixam ninguem acrescentar-se aos membros de um grupo;
// a entrada passa por aqui, onde o codigo de convite e validado.
exports.joinGroup = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sessao necessaria.");
  const code = String(request.data?.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) throw new HttpsError("not-found", "Codigo invalido.");

  const groupsSnap = await db.collection(`artifacts/${APP_ID}/groups`).where("inviteCode", "==", code).limit(1).get();
  if (groupsSnap.empty) throw new HttpsError("not-found", "Codigo invalido.");
  const groupRef = groupsSnap.docs[0].ref;
  if ((groupsSnap.docs[0].data().members || []).includes(uid)) return { groupId: groupRef.id, alreadyMember: true };

  // mesmo perfil de jogador que a app criava antes no cliente
  const userSnap = await db.doc(`artifacts/${APP_ID}/users/${uid}`).get();
  const authUser = await getAuth().getUser(uid);
  const name = userSnap.data()?.name || authUser.displayName || "Novo Jogador";
  const photoUrl = userSnap.data()?.photoUrl || authUser.photoURL || null;

  const existing = await groupRef.collection("players").where("uid", "==", uid).limit(1).get();
  const batch = db.batch();
  batch.update(groupRef, { members: FieldValue.arrayUnion(uid) });
  if (existing.empty) {
    batch.set(groupRef.collection("players").doc(), {
      name, uid, type: "member", stats: { games: 0, wins: 0, draws: 0, losses: 0 },
      isAdmin: false, photoUrl, votes: {}, createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  logger.info(`Utilizador ${uid} entrou no grupo ${groupRef.id}`);
  return { groupId: groupRef.id, alreadyMember: false };
});
