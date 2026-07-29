// ======================================================
// Servicio de notificaciones push (lib/fcm.ts)
// Integración con Firebase Cloud Messaging vía firebase-admin.
//
// Flujo:
//   1. Cada cliente (web / mobile) obtiene su token FCM y lo
//      registra en POST /api/fcm-tokens.
//   2. El backend, ante eventos de negocio (cambio de estado,
//      nuevo seguimiento, alta, recordatorios), llama a
//      sendPushToUser(userId, ...) que envía a TODOS los
//      dispositivos del usuario.
//   3. Los tokens rechazados por FCM se eliminan de la base.
//
// Si no hay credencial de Firebase configurada, el servicio
// queda deshabilitado (no-op con log) y el resto del sistema
// funciona igual.
// ======================================================
import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

let initialized = false;
let enabled = false;

/** Inicializa firebase-admin una única vez, si hay credencial. */
function ensureInit(): boolean {
  if (initialized) return enabled;
  initialized = true;

  try {
    let credentialJson: string | null = null;
    if (env.firebaseServiceAccountBase64) {
      credentialJson = Buffer.from(env.firebaseServiceAccountBase64, "base64").toString("utf8");
    } else if (env.firebaseServiceAccountPath) {
      credentialJson = readFileSync(env.firebaseServiceAccountPath, "utf8");
    }

    if (!credentialJson) {
      console.warn("[fcm] Sin credencial de Firebase: notificaciones push deshabilitadas.");
      return false;
    }

    initializeApp({
      credential: cert(JSON.parse(credentialJson)),
    });
    enabled = true;
    console.log("[fcm] Firebase Cloud Messaging inicializado.");
  } catch (error) {
    console.error("[fcm] Error inicializando Firebase:", error);
  }
  return enabled;
}

export interface PushMessage {
  title: string;
  body: string;
  /** Datos extra para que el cliente navegue (ej. { surgeryId }). */
  data?: Record<string, string>;
}

/**
 * Envía una push a todos los dispositivos registrados de un usuario.
 * Nunca lanza: los fallos se loguean y los tokens inválidos se limpian.
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  if (!ensureInit()) return;

  const tokens = await prisma.fcmToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title: message.title, body: message.body },
      data: message.data,
    });

    // Limpieza de tokens que FCM reporta como inválidos/vencidos.
    const invalid: string[] = [];
    response.responses.forEach((r, i) => {
      const code = r.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalid.push(tokens[i].token);
      }
    });
    if (invalid.length > 0) {
      await prisma.fcmToken.deleteMany({ where: { token: { in: invalid } } });
      console.log(`[fcm] ${invalid.length} token(s) inválidos eliminados.`);
    }
  } catch (error) {
    console.error("[fcm] error enviando push:", error);
  }
}
