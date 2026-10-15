import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, APP_ID, uploadAvatar, enablePushNotifications } from "./firebase";
import { STYLES } from "./styles";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthScreen } from "./screens/AuthScreen";
import { GroupSelector } from "./screens/GroupSelector";
import { ConfirmDialogHost } from "./components/ConfirmDialog";

/* =========================================================================
   FUTEBOLADAS V3 - app completa (Firebase) com revamp visual + novas funcoes:
   chat de grupo, quadro tatico (5/7/11 + banco de suplentes + add/remove),
   modelos de pagamento (jogo-a-jogo / mensal / época) e golos & assistencias.
   RESET DA BASE DE DADOS: APP_ID mudou para "futeboladas-v3", por isso a app
   arranca com um espaco de dados novo e limpo (os dados antigos em
   "futeboladas-v2" deixam de ser referenciados).
   ========================================================================= */

const APP_VERSION = "3.0.0";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = event?.message?.toLowerCase() || "";
    if (msg.includes("loading chunk") || msg.includes("unexpected token") || msg.includes("importing a module") || msg.includes("failed to load resource")) {
      const last = sessionStorage.getItem("app_last_rescue");
      if (!last || Date.now() - parseInt(last) > 10000) {
        sessionStorage.setItem("app_last_rescue", Date.now().toString());
        window.location.reload();
      }
    }
  }, true);
  try {
    const stored = localStorage.getItem("app_version");
    if (stored !== APP_VERSION) {
      // nao desregistar service workers: isso mata a subscricao push do FCM
      if ("caches" in window) caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
      localStorage.setItem("app_version", APP_VERSION);
    }
  } catch (e) { /* noop */ }
}

/* ============================== ROOT ===================================== */
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }); return () => unsub(); }, []);
  // Manutencao no arranque: migra foto base64 antiga para o Storage e renova o token FCM (sem pedir permissao)
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "artifacts", APP_ID, "users", user.uid);
    getDoc(ref).then(async (s) => {
      const d = s.data() || {};
      if (d.notifEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") enablePushNotifications(user.uid);
      if (d.photoUrl?.startsWith("data:")) {
        const url = await uploadAvatar(user.uid, await (await fetch(d.photoUrl)).blob());
        await setDoc(ref, { photoUrl: url }, { merge: true });
      }
    }).catch((e) => console.error("Erro na manutencao do perfil:", e));
  }, [user]);
  if (loading) return <div className="ft" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{STYLES}</style><Loader2 size={40} role="status" aria-label="A carregar" style={{ color: "var(--grass-bright)", animation: "ftspin 1s linear infinite" }} /></div>;
  return (
    <div className="ft" style={{ minHeight: "100vh" }}>
      <style>{STYLES}</style>
      {!user ? <AuthScreen /> : <GroupSelector user={user} onLogout={() => signOut(auth)} />}
      <ConfirmDialogHost />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
