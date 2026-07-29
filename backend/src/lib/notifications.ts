// ======================================================
// Orquestador de notificaciones (lib/notifications.ts)
// Punto único desde el que las rutas disparan avisos al
// paciente. Resuelve el usuario vinculado al paciente y
// combina los dos canales:
//   - Push (Firebase Cloud Messaging) → lib/fcm.ts
//   - Email (Resend)                  → lib/email.ts
// Todas las funciones son "fire and forget": nunca lanzan,
// para que un fallo de notificación no rompa la operación
// de negocio que la originó.
// ======================================================
import { prisma } from "./prisma.js";
import { sendPushToUser } from "./fcm.js";
import { STATUS_LABEL } from "./surgery-status.js";
import type { SurgeryStatus } from "@prisma/client";

/** Envía una push al usuario vinculado a un paciente (si tiene cuenta). */
export async function notifyPatient(
  patientId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true },
    });
    if (!patient?.userId) return; // el paciente no tiene cuenta de acceso
    await sendPushToUser(patient.userId, { title, body, data });
  } catch (error) {
    console.error("[notifications] error notificando al paciente:", error);
  }
}

/** Push por cambio de estado de la cirugía del paciente. */
export function notifySurgeryStatusChange(
  patientId: string,
  surgeryId: string,
  procedure: string,
  status: SurgeryStatus,
) {
  return notifyPatient(
    patientId,
    "Actualización de tu cirugía",
    `${procedure}: ${STATUS_LABEL[status]}`,
    { surgeryId, type: "surgery_status" },
  );
}

/** Push cuando el equipo médico carga un nuevo control postoperatorio. */
export function notifyNewPostopRecord(patientId: string, surgeryId: string) {
  return notifyPatient(
    patientId,
    "Nuevo seguimiento cargado",
    "Tu equipo médico registró un nuevo control postoperatorio.",
    { surgeryId, type: "postop_record" },
  );
}

/** Push de alta médica. */
export function notifyDischarge(patientId: string, surgeryId: string) {
  return notifyPatient(
    patientId,
    "¡Alta médica!",
    "Recibiste el alta. Recordá registrar tus síntomas y asistir a los controles.",
    { surgeryId, type: "discharge" },
  );
}

/** Push de recordatorio de cirugía (48/24 h antes). */
export function notifySurgeryReminder(patientId: string, surgeryId: string, hours: number) {
  return notifyPatient(
    patientId,
    `Tu cirugía es en ${hours} horas`,
    "Recordá el ayuno, la medicación indicada y traer tus estudios.",
    { surgeryId, type: "surgery_reminder" },
  );
}
