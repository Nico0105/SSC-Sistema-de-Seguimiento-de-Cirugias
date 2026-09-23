// ======================================================
// Service worker de Firebase Cloud Messaging
// Recibe las notificaciones push cuando la pestaña del SSC
// está cerrada o en segundo plano. Usa los scripts "compat"
// de Google (los service workers no soportan módulos ES en
// todos los navegadores). Debe vivir en la raíz pública del
// sitio (frontend/public/) para que FCM lo encuentre.
//
// IMPORTANTE: completar firebaseConfig con los MISMOS valores
// públicos usados en las variables VITE_FIREBASE_* del .env.
// ======================================================
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// Configuración PÚBLICA del proyecto de Firebase (no es secreta).
const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  projectId: "REEMPLAZAR_PROJECT_ID",
  messagingSenderId: "REEMPLAZAR_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Notificación del sistema cuando llega un push en segundo plano.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "SSC";
  const body = (payload.notification && payload.notification.body) || "";
  self.registration.showNotification(title, { body });
});
