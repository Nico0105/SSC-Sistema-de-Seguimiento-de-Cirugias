// ======================================================
// Servicio de emails transaccionales (lib/email.ts)
// Envía correos vía la API HTTP de Resend y deja auditoría
// de cada intento en la tabla EmailLog (enviado / fallido /
// omitido). El resto del backend usa los helpers de alto
// nivel (sendSurgeryConfirmation, etc.) sin conocer Resend.
//
// Diseño: si RESEND_API_KEY no está configurada, el envío
// se registra como "omitido" y la operación de negocio que
// lo disparó NUNCA falla por culpa del email.
// ======================================================
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Tipos de email del sistema (auditados en EmailLog.type). */
export type EmailType =
  | "confirmacion_cirugia"
  | "reprogramacion_cirugia"
  | "recordatorio_48h"
  | "recordatorio_24h"
  | "indicaciones_preoperatorias"
  | "alta_medica"
  | "confirmacion_control";

interface SendArgs {
  to: string | null | undefined;
  subject: string;
  html: string;
  type: EmailType;
  surgeryId?: string | null;
}

/**
 * Envía un email vía Resend y registra el resultado en EmailLog.
 * Nunca lanza: los fallos de email no deben romper la operación
 * de negocio que los disparó (se auditan como "fallido").
 */
export async function sendEmail({ to, subject, html, type, surgeryId }: SendArgs): Promise<void> {
  // Sin destinatario o sin API key: se audita como omitido.
  if (!to || !env.resendApiKey) {
    await logEmail(to ?? "(sin email)", subject, type, "omitido", surgeryId,
      !to ? "El paciente no tiene email cargado" : "RESEND_API_KEY no configurada");
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.emailFrom, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Resend HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    await logEmail(to, subject, type, "enviado", surgeryId);
  } catch (error) {
    console.error("[email] fallo el envío:", error);
    await logEmail(to, subject, type, "fallido", surgeryId,
      error instanceof Error ? error.message : String(error));
  }
}

/** Persiste el intento de envío para auditoría y control de duplicados. */
async function logEmail(
  to: string,
  subject: string,
  type: EmailType,
  status: "enviado" | "fallido" | "omitido",
  surgeryId?: string | null,
  error?: string,
) {
  try {
    await prisma.emailLog.create({
      data: { to, subject, type, status, error, surgeryId: surgeryId ?? null },
    });
  } catch (e) {
    console.error("[email] no se pudo registrar el log:", e);
  }
}

/** true si ya se envió (o intentó) un email de este tipo para la cirugía. */
export async function wasEmailSent(type: EmailType, surgeryId: string): Promise<boolean> {
  const count = await prisma.emailLog.count({
    where: { type, surgeryId, status: { in: ["enviado", "fallido"] } },
  });
  return count > 0;
}

// ------------------------------------------------------
// Plantillas HTML (simples y autocontenidas)
// ------------------------------------------------------

/** Layout base compartido por todos los emails del sistema. */
function layout(title: string, body: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <div style="background:#1d4ed8; color:#fff; padding:16px 24px; border-radius:12px 12px 0 0;">
      <strong style="font-size:18px;">SSC — Seguimiento de Cirugías</strong>
    </div>
    <div style="border:1px solid #e2e8f0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
      <h2 style="margin-top:0; font-size:18px;">${title}</h2>
      ${body}
      <p style="color:#94a3b8; font-size:12px; margin-top:24px;">
        Este es un mensaje automático del Sistema de Seguimiento de Cirugías. No responder a este correo.
      </p>
    </div>
  </div>`;
}

const fmtDate = (d: Date) =>
  d.toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" });

interface SurgeryEmailData {
  patientEmail: string | null;
  patientName: string;
  procedure: string;
  scheduledAt: Date;
  surgeryId: string;
}

/** Confirmación de cirugía programada. */
export function sendSurgeryConfirmation(s: SurgeryEmailData) {
  return sendEmail({
    to: s.patientEmail,
    type: "confirmacion_cirugia",
    surgeryId: s.surgeryId,
    subject: "Confirmación de cirugía programada",
    html: layout("Cirugía confirmada", `
      <p>Hola ${s.patientName},</p>
      <p>Tu cirugía <strong>${s.procedure}</strong> fue programada para el
      <strong>${fmtDate(s.scheduledAt)}</strong>.</p>
      <p>Recibirás recordatorios e indicaciones a medida que se acerque la fecha.</p>`),
  });
}

/** Aviso de cambio de fecha u horario. */
export function sendSurgeryReschedule(s: SurgeryEmailData) {
  return sendEmail({
    to: s.patientEmail,
    type: "reprogramacion_cirugia",
    surgeryId: s.surgeryId,
    subject: "Cambio de fecha/horario de tu cirugía",
    html: layout("Tu cirugía fue reprogramada", `
      <p>Hola ${s.patientName},</p>
      <p>Tu cirugía <strong>${s.procedure}</strong> tiene una nueva fecha:
      <strong>${fmtDate(s.scheduledAt)}</strong>.</p>
      <p>Si no podés asistir, comunicate con el hospital.</p>`),
  });
}

/** Recordatorio 48 h / 24 h antes de la cirugía. */
export function sendSurgeryReminder(s: SurgeryEmailData, hours: 48 | 24) {
  return sendEmail({
    to: s.patientEmail,
    type: hours === 48 ? "recordatorio_48h" : "recordatorio_24h",
    surgeryId: s.surgeryId,
    subject: `Recordatorio: tu cirugía es en ${hours} horas`,
    html: layout(`Faltan ${hours} horas para tu cirugía`, `
      <p>Hola ${s.patientName},</p>
      <p>Te recordamos que tu cirugía <strong>${s.procedure}</strong> está programada
      para el <strong>${fmtDate(s.scheduledAt)}</strong>.</p>
      <p>Recordá cumplir las indicaciones preoperatorias (ayuno, medicación, estudios).</p>`),
  });
}

/** Indicaciones preoperatorias (se envía junto con la confirmación). */
export function sendPreopInstructions(s: SurgeryEmailData) {
  return sendEmail({
    to: s.patientEmail,
    type: "indicaciones_preoperatorias",
    surgeryId: s.surgeryId,
    subject: "Indicaciones preoperatorias",
    html: layout("Indicaciones para tu cirugía", `
      <p>Hola ${s.patientName},</p>
      <p>Para tu cirugía <strong>${s.procedure}</strong> del
      <strong>${fmtDate(s.scheduledAt)}</strong> tené en cuenta:</p>
      <ul>
        <li>Ayuno de 8 horas previas.</li>
        <li>Traer los estudios prequirúrgicos.</li>
        <li>Firmar el consentimiento informado.</li>
        <li>Suspender la medicación indicada por tu médico.</li>
        <li>Higiene según indicaciones.</li>
        <li>Concurrir con un acompañante.</li>
      </ul>`),
  });
}

/** Aviso de alta médica. */
export function sendDischargeEmail(s: SurgeryEmailData) {
  return sendEmail({
    to: s.patientEmail,
    type: "alta_medica",
    surgeryId: s.surgeryId,
    subject: "Alta médica",
    html: layout("¡Alta médica!", `
      <p>Hola ${s.patientName},</p>
      <p>Recibiste el alta de tu cirugía <strong>${s.procedure}</strong>.</p>
      <p>Recordá registrar tus síntomas diariamente desde la app y asistir a los controles.</p>`),
  });
}

/** Confirmación de un turno de control/consulta. */
export function sendAppointmentConfirmation(args: {
  patientEmail: string | null;
  patientName: string;
  type: string;
  scheduledAt: Date;
}) {
  return sendEmail({
    to: args.patientEmail,
    type: "confirmacion_control",
    subject: "Confirmación de turno",
    html: layout("Turno confirmado", `
      <p>Hola ${args.patientName},</p>
      <p>Tu turno (<strong>${args.type}</strong>) fue registrado para el
      <strong>${fmtDate(args.scheduledAt)}</strong>.</p>`),
  });
}
