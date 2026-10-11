// Testes das regras do Firestore (firestore.rules) contra o emulador local. Corre com:
//   npm run test:rules   (precisa de Java 21+ no PATH; o projeto "demo-" nunca toca no Firebase real)
import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, writeBatch, serverTimestamp, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-futeboladas",
  firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 },
});

const R = "artifacts/futeboladas-v3";
const G = `${R}/groups/g1`;
const zero = { games: 0, wins: 0, draws: 0, losses: 0 };

async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, G), { name: "G1", ownerId: "O", members: ["O", "A", "M"], admins: ["A"], inviteCode: "ABCDEFGH", settings: { paymentModel: "monthly" } });
    await setDoc(doc(db, `${R}/groups/g2`), { name: "G2", ownerId: "O", members: ["O", "M"], settings: {} }); // grupo antigo: sem admins nem inviteCode
    await setDoc(doc(db, `${G}/players/pO`), { name: "Dono", uid: "O", type: "member", isAdmin: true, stats: zero, votes: {} });
    await setDoc(doc(db, `${G}/players/pA`), { name: "Admin", uid: "A", type: "member", isAdmin: true, stats: zero, votes: {} });
    await setDoc(doc(db, `${G}/players/pM`), { name: "Membro", uid: "M", type: "member", isAdmin: false, stats: zero, votes: {} });
    await setDoc(doc(db, `${G}/players/pG`), { name: "Convidado", type: "guest", hostId: "pM", isAdmin: false, stats: zero, votes: {} });
    await setDoc(doc(db, `${G}/schedule/next`), { date: "2026-10-20T21:00:00", frequency: "weekly", responses: { O: "going" } });
    await setDoc(doc(db, `${G}/matches/m1`), { scoreA: 1, scoreB: 0, mvpVotes: {}, payments: { pG: false }, createdAt: Timestamp.now() });
    await setDoc(doc(db, `${G}/matches/old`), { scoreA: 1, scoreB: 0, mvpVotes: {}, createdAt: Timestamp.fromMillis(Date.now() - 49 * 3600e3) });
    await setDoc(doc(db, `${G}/treasury/month_2026-10`), { fixedIds: ["pO"], payments: {} });
    await setDoc(doc(db, `${G}/trainings/t1`), { date: "2026-10-21T19:00:00", local: "Campo", responses: {} });
    await setDoc(doc(db, `${G}/leagueGames/l1`), { opponent: "X", scoreA: null });
    await setDoc(doc(db, `${R}/users/M`), { name: "Membro" });
    await setDoc(doc(db, `artifacts/futeboladas-v2/groups/old`), { members: ["M"] });
  });
}

const as = (uid) => env.authenticatedContext(uid).firestore();
let passed = 0; const failures = [];
async function t(name, fn) {
  await seed();
  try { await fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message.split("\n")[0]}`); }
}
const ok = assertSucceeds, no = assertFails;

// --- grupos ---
await t("nao-membro nao le o grupo", () => no(getDoc(doc(as("X"), G))));
await t("nao-membro pode verificar id livre (criar grupo)", () => ok(getDoc(doc(as("X"), `${R}/groups/livre`))));
await t("anonimo nao le nada", () => no(getDoc(doc(env.unauthenticatedContext().firestore(), G))));
await t("membro lista os seus grupos", () => ok(getDocs(query(collection(as("M"), `${R}/groups`), where("members", "array-contains", "M")))));
await t("nao-membro nao se acrescenta aos membros", () => no(updateDoc(doc(as("X"), G), { members: arrayUnion("X") })));
await t("membro nao acrescenta outra pessoa", () => no(updateDoc(doc(as("M"), G), { members: arrayUnion("X") })));
await t("membro sai do grupo", () => ok(updateDoc(doc(as("M"), G), { members: arrayRemove("M") })));
await t("membro nao remove outro membro", () => no(updateDoc(doc(as("M"), G), { members: arrayRemove("A") })));
await t("dono nao sai", () => no(updateDoc(doc(as("O"), G), { members: arrayRemove("O") })));
await t("membro nao muda definicoes", () => no(updateDoc(doc(as("M"), G), { settings: { paymentModel: "season" } })));
await t("admin muda definicoes", () => ok(updateDoc(doc(as("A"), G), { settings: { paymentModel: "season" }, locationUrl: "x" })));
await t("membro nao se faz admin", () => no(updateDoc(doc(as("M"), G), { admins: arrayUnion("M") })));
await t("admin nao mexe em admins", () => no(updateDoc(doc(as("A"), G), { admins: arrayUnion("M") })));
await t("dono mexe em admins", () => ok(updateDoc(doc(as("O"), G), { admins: ["A", "M"] })));
await t("dono nao troca o dono", () => no(updateDoc(doc(as("O"), G), { ownerId: "M" })));
await t("membro nao muda o codigo existente", () => no(updateDoc(doc(as("M"), G), { inviteCode: "ZZZZZZZZ" })));
await t("membro gera codigo em grupo antigo", () => ok(updateDoc(doc(as("M"), `${R}/groups/g2`), { inviteCode: "QWERTYUP" })));
await t("admin apaga? nao", () => no(deleteDoc(doc(as("A"), G))));
await t("dono apaga o grupo", () => ok(deleteDoc(doc(as("O"), G))));
await t("criar grupo (batch grupo + jogador admin)", async () => {
  const db = as("X"); const b = writeBatch(db);
  b.set(doc(db, `${R}/groups/novo`), { name: "Novo", ownerId: "X", members: ["X"], inviteCode: "NEWCODE2", settings: {}, createdAt: serverTimestamp() });
  b.set(doc(db, `${R}/groups/novo/players/p1`), { name: "X", uid: "X", type: "member", isAdmin: true, stats: zero, votes: {}, createdAt: serverTimestamp() });
  await ok(b.commit());
});
await t("criar grupo com outros membros falha", () => no(setDoc(doc(as("X"), `${R}/groups/novo`), { ownerId: "X", members: ["X", "M"], inviteCode: "NEWCODE2" })));
await t("dados da V2 fechados", () => no(getDoc(doc(as("M"), `artifacts/futeboladas-v2/groups/old`))));

// --- jogadores ---
await t("membro avalia jogador", () => ok(updateDoc(doc(as("M"), `${G}/players/pA`), { "votes.M": 4 })));
await t("membro nao vota por outro", () => no(updateDoc(doc(as("M"), `${G}/players/pA`), { "votes.O": 1 })));
await t("membro nao se promove", () => no(updateDoc(doc(as("M"), `${G}/players/pM`), { isAdmin: true })));
await t("membro sincroniza o seu nome/foto", () => ok(updateDoc(doc(as("M"), `${G}/players/pM`), { name: "Novo", photoUrl: "https://x" })));
await t("membro nao muda nome de outro", () => no(updateDoc(doc(as("M"), `${G}/players/pA`), { name: "Hack" })));
await t("membro nao mexe nas suas stats", () => no(updateDoc(doc(as("M"), `${G}/players/pM`), { stats: { ...zero, wins: 99 } })));
await t("admin atualiza stats", () => ok(updateDoc(doc(as("A"), `${G}/players/pM`), { stats: { ...zero, games: 1 } })));
await t("admin nao promove", () => no(updateDoc(doc(as("A"), `${G}/players/pM`), { isAdmin: true })));
await t("dono promove", () => ok(updateDoc(doc(as("O"), `${G}/players/pM`), { isAdmin: true })));
await t("membro adiciona convidado", () => ok(addDoc(collection(as("M"), `${G}/players`), { name: "Amigo", type: "guest", hostId: "pM", isAdmin: false, stats: zero, votes: {}, createdAt: serverTimestamp() })));
await t("membro nao cria convidado com stats", () => no(addDoc(collection(as("M"), `${G}/players`), { name: "Amigo", type: "guest", isAdmin: false, stats: { ...zero, wins: 9 }, votes: {} })));
await t("membro nao cria jogador de outra conta", () => no(addDoc(collection(as("M"), `${G}/players`), { name: "O", uid: "O", type: "member", isAdmin: false, stats: zero, votes: {} })));
await t("membro entra no plantel (proprio)", () => ok(addDoc(collection(as("M"), `${G}/players`), { name: "M", uid: "M", type: "member", isAdmin: false, stats: zero, votes: {} })));
await t("membro nao entra como admin", () => no(addDoc(collection(as("M"), `${G}/players`), { name: "M", uid: "M", type: "member", isAdmin: true, stats: zero, votes: {} })));
await t("membro nao apaga jogador", () => no(deleteDoc(doc(as("M"), `${G}/players/pG`))));
await t("admin apaga jogador", () => ok(deleteDoc(doc(as("A"), `${G}/players/pG`))));
await t("nao-membro nao le jogadores", () => no(getDocs(collection(as("X"), `${G}/players`))));

// --- peladas ---
await t("membro nao regista resultado", () => no(addDoc(collection(as("M"), `${G}/matches`), { scoreA: 9, scoreB: 0, createdAt: serverTimestamp() })));
await t("admin regista resultado", () => ok(addDoc(collection(as("A"), `${G}/matches`), { scoreA: 2, scoreB: 1, createdAt: serverTimestamp() })));
await t("membro vota MVP", () => ok(updateDoc(doc(as("M"), `${G}/matches/m1`), { "mvpVotes.M": "pA" })));
await t("membro nao vota por outro", () => no(updateDoc(doc(as("M"), `${G}/matches/m1`), { "mvpVotes.O": "pM" })));
await t("voto MVP fecha as 48h", () => no(updateDoc(doc(as("M"), `${G}/matches/old`), { "mvpVotes.M": "pA" })));
await t("membro nao marca pagamento", () => no(updateDoc(doc(as("M"), `${G}/matches/m1`), { "payments.pG": true })));
await t("admin marca pagamento", () => ok(updateDoc(doc(as("A"), `${G}/matches/m1`), { "payments.pG": true })));
await t("membro nao apaga pelada", () => no(deleteDoc(doc(as("M"), `${G}/matches/m1`))));

// --- chat ---
await t("membro escreve no chat", () => ok(addDoc(collection(as("M"), `${G}/messages`), { uid: "M", name: "M", text: "ola", createdAt: serverTimestamp() })));
await t("membro nao escreve como outro", () => no(addDoc(collection(as("M"), `${G}/messages`), { uid: "O", name: "O", text: "ola", createdAt: serverTimestamp() })));
await t("nao-membro nao escreve", () => no(addDoc(collection(as("X"), `${G}/messages`), { uid: "X", text: "spam", createdAt: serverTimestamp() })));

// --- agenda ---
await t("membro confirma presenca (set merge)", () => ok(setDoc(doc(as("M"), `${G}/schedule/next`), { responses: { M: "going" } }, { merge: true })));
await t("membro nao responde por outro", () => no(setDoc(doc(as("M"), `${G}/schedule/next`), { responses: { O: "not_going" } }, { merge: true })));
await t("membro nao muda a data", () => no(setDoc(doc(as("M"), `${G}/schedule/next`), { date: "2027-01-01T00:00:00" }, { merge: true })));
await t("membro confirma sem jogo marcado (cria doc)", () => ok(setDoc(doc(as("M"), `${R}/groups/g2/schedule/next`), { responses: { M: "going" } }, { merge: true })));
await t("admin muda a data", () => ok(setDoc(doc(as("A"), `${G}/schedule/next`), { date: "2027-01-01T21:00:00", frequency: "weekly", responses: {} }, { merge: true })));

// --- treinos e liga ---
await t("membro responde ao treino", () => ok(updateDoc(doc(as("M"), `${G}/trainings/t1`), { "responses.M": "going" })));
await t("membro nao cria treino", () => no(addDoc(collection(as("M"), `${G}/trainings`), { date: "x", local: "y", responses: {} })));
await t("admin cria treino", () => ok(addDoc(collection(as("A"), `${G}/trainings`), { date: "x", local: "y", responses: {} })));
await t("membro nao mexe na liga", () => no(updateDoc(doc(as("M"), `${G}/leagueGames/l1`), { scoreA: 5, scoreB: 0 })));
await t("admin mexe na liga", () => ok(updateDoc(doc(as("A"), `${G}/leagueGames/l1`), { scoreA: 2, scoreB: 2 })));

// --- tesouraria ---
await t("membro inscreve-se", () => ok(setDoc(doc(as("M"), `${G}/treasury/month_2026-10`), { fixedIds: arrayUnion("pM") }, { merge: true })));
await t("membro inscreve-se em mes novo (cria doc)", () => ok(setDoc(doc(as("M"), `${G}/treasury/month_2026-11`), { fixedIds: arrayUnion("pM") }, { merge: true })));
await t("membro nao inscreve outro", () => no(setDoc(doc(as("M"), `${G}/treasury/month_2026-10`), { fixedIds: arrayUnion("pA") }, { merge: true })));
await t("membro nao tira outro", () => no(setDoc(doc(as("M"), `${G}/treasury/month_2026-10`), { fixedIds: arrayRemove("pO") }, { merge: true })));
await t("membro nao marca a mensalidade paga", () => no(setDoc(doc(as("M"), `${G}/treasury/month_2026-10`), { payments: { pM: true } }, { merge: true })));
await t("admin marca a mensalidade paga", () => ok(setDoc(doc(as("A"), `${G}/treasury/month_2026-10`), { payments: { pM: true } }, { merge: true })));

// --- perfis ---
await t("utilizador le o seu perfil", () => ok(getDoc(doc(as("M"), `${R}/users/M`))));
await t("utilizador nao le perfil alheio", () => no(getDoc(doc(as("O"), `${R}/users/M`))));

await env.cleanup();
console.log(`\n${passed} passaram, ${failures.length} falharam`);
if (failures.length) { console.log(failures.map((f) => " - " + f).join("\n")); process.exit(1); }
