import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, arrayUnion } from "firebase/firestore";
import { getMessaging, getToken, isSupported as isMessagingSupported } from "firebase/messaging";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCgfsrpIIj0XWp7Uc2FNGgKIibtWriHR_c",
  authDomain: "futeboladas-v2-dev.firebaseapp.com",
  projectId: "futeboladas-v2-dev",
  storageBucket: "futeboladas-v2-dev.firebasestorage.app",
  messagingSenderId: "899361657772",
  appId: "1:899361657772:web:cdd265c50fc9574119e009",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.useDeviceLanguage(); // emails do Firebase (ex: repor palavra-passe) na lingua do telemovel

export const db = getFirestore(app);

const storage = getStorage(app);

export const APP_ID = "futeboladas-v3"; // <-- reset: novo namespace de dados (clean)

// Entrar num grupo com codigo de convite (validado no servidor, ver functions/index.js)
export const joinGroupFn = httpsCallable(getFunctions(app), "joinGroup");

/* Fotos de perfil vivem no Storage; o Firestore so guarda o URL (antes era base64 copiado para todo o lado). */
export const uploadAvatar = async (uid, blob) => {
  const r = storageRef(storage, `avatars/${uid}.jpg`);
  await uploadBytes(r, blob, { contentType: "image/jpeg" });
  return `${await getDownloadURL(r)}&v=${Date.now()}`; // &v= fura a cache do browser, o caminho e sempre o mesmo
};

const VAPID_KEY = "BOp0T6S2cuvzGGJ4bcjDKl_bncxCmiHrW80czfeisDWtgMUBak39g2wmG0AoEjCHk1fGR5N3GAys-z82Hsg6GtA";

/* ---------------------------- Notificacoes push --------------------------- */
/* Pede permissao ao browser, regista o service worker dedicado do FCM e
   guarda o token resultante no perfil do utilizador (Firestore).
   Devolve true/false conforme o sucesso; nunca lanca excecao para nao
   bloquear o resto da app caso o browser nao suporte push (ex: Safari iOS

   sem PWA instalada). */
export const enablePushNotifications = async (uid) => {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
    const supported = await isMessagingSupported().catch(() => false);
    if (!supported) return false;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return false;
    await setDoc(doc(db, "artifacts", APP_ID, "users", uid), { fcmTokens: arrayUnion(token), notifEnabled: true }, { merge: true });
    return true;
  } catch (e) { console.error("Erro a ativar notificacoes:", e); return false; }
};

export const disablePushNotifications = async (uid) => {
  try { await setDoc(doc(db, "artifacts", APP_ID, "users", uid), { notifEnabled: false }, { merge: true }); } catch (e) { /* noop */ }
};
