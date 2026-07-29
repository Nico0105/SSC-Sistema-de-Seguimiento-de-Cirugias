// ======================================================
// Tipos de Vite (vite-env.d.ts)
// Habilita el tipado de import.meta.env y declara las
// variables de entorno propias del proyecto.
// ======================================================
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend (ej.: http://localhost:4000). */
  readonly VITE_API_URL?: string;

  // Configuración pública de Firebase para push web (opcional:
  // si falta alguna, las notificaciones push quedan deshabilitadas).
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** Clave VAPID pública de FCM (Configuración web push de Firebase). */
  readonly VITE_FIREBASE_VAPID_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
