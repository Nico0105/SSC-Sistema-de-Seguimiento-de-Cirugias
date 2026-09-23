// ======================================================
// Notificaciones push web (lib/push.ts)
// Integración del frontend con Firebase Cloud Messaging:
//   1. Al iniciar sesión se pide permiso de notificaciones.
//   2. Se obtiene el token FCM del navegador (requiere el
//      service worker public/firebase-messaging-sw.js).
//   3. El token se registra en el backend (POST /api/fcm-tokens)
//      para que éste pueda enviar avisos al usuario.
//
// Si las variables VITE_FIREBASE_* no están configuradas, el
// módulo queda deshabilitado silenciosamente: la app funciona
// igual, sólo que sin push en el navegador.
// ======================================================
import { api } from "./api-client";

/** Configuración pública de Firebase tomada del entorno de Vite. */
function getFirebaseConfig() {
  const {
    VITE_FIREBASE_API_KEY: apiKey,
    VITE_FIREBASE_PROJECT_ID: projectId,
    VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
    VITE_FIREBASE_APP_ID: appId,
  } = import.meta.env;
  if (!apiKey || !projectId || !messagingSenderId || !appId) return null;
  return {
    apiKey,
    projectId,
    messagingSenderId,
    appId,
    authDomain: `${projectId}.firebaseapp.com`,
  };
}

let registered = false;

/**
 * Pide permiso, obtiene el token FCM y lo registra en el backend.
 * Se llama después del login. Es idempotente por sesión de página
 * y nunca lanza (el push es un extra, no una funcionalidad crítica).
 */
export async function registerWebPush(): Promise<void> {
  if (registered) return;
  const config = getFirebaseConfig();
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!config || !vapidKey || !("Notification" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Import dinámico: Firebase sólo se carga si está configurado.
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

    const app = initializeApp(config);
    const messaging = getMessaging(app);

    const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
    if (!token) return;

    await api.post("/api/fcm-tokens", { token, platform: "web" });
    registered = true;

    // Con la pestaña en primer plano, FCM no muestra la notificación
    // del sistema: se muestra manualmente.
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "SSC";
      const body = payload.notification?.body ?? "";
      new Notification(title, { body });
    });
  } catch (error) {
    console.warn("[push] no se pudo registrar el push web:", error);
  }
}
