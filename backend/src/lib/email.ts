// ======================================================
// Servicio de emails transaccionales (lib/email.ts)
// Envía correos vía la API HTTP de Brevo (plan gratuito:
// 300 emails por día, sin dominio propio: alcanza con
// verificar el email remitente) y deja auditoría de cada
// intento en la tabla EmailLog (enviado / fallido / omitido).
// El resto del backend usa los helpers de alto nivel
// (sendSurgeryConfirmation, etc.) sin conocer al proveedor.
//
// Diseño: si BREVO_API_KEY o EMAIL_FROM_ADDRESS no están
// configuradas, el envío se registra como "omitido" y la
// operación de negocio que lo disparó NUNCA falla por
// culpa del email.
// ======================================================
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/** Tipos de email del sistema (auditados en EmailLog.type). */
export type EmailType =
  | "confirmacion_cirugia"
  | "reprogramacion_cirugia"
  | "recordatorio_48h"
  | "recordatorio_24h"
  | "indicaciones_preoperatorias"
  | "alta_medica"
  | "confirmacion_control"
  | "mensaje_medico"
  | "prueba";

interface SendArgs {
  to: string | null | undefined;
  subject: string;
  html: string;
  type: EmailType;
  surgeryId?: string | null;
  /** Paciente destinatario (para emails que no dependen de una cirugía). */
  patientId?: string | null;
}

/** Resultado de un intento de envío (lo usa el comando de prueba). */
export type SendResult = { status: "enviado" | "fallido" | "omitido"; detail?: string };

/** Motivo por el que no se puede enviar, o null si la configuración está completa. */
function missingConfig(): string | null {
  if (!env.brevoApiKey) return "BREVO_API_KEY no configurada";
  if (!env.emailFromAddress) return "EMAIL_FROM_ADDRESS no configurada";
  return null;
}

/**
 * Envía un email vía Brevo y registra el resultado en EmailLog.
 * Nunca lanza: los fallos de email no deben romper la operación
 * de negocio que los disparó (se auditan como "fallido").
 */
export async function sendEmail({ to, subject, html, type, surgeryId, patientId }: SendArgs): Promise<SendResult> {
  // Sin destinatario o sin configuración: se audita como omitido.
  const skipReason = !to ? "El destinatario no tiene email cargado" : missingConfig();
  if (!to || skipReason) {
    await logEmail(to ?? "(sin email)", subject, type, "omitido", { surgeryId, patientId }, skipReason ?? undefined);
    return { status: "omitido", detail: skipReason ?? undefined };
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": env.brevoApiKey!,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: env.emailFromName, email: env.emailFromAddress },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    await logEmail(to, subject, type, "enviado", { surgeryId, patientId });
    return { status: "enviado" };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[email] fallo el envío:", detail);
    await logEmail(to, subject, type, "fallido", { surgeryId, patientId }, detail);
    return { status: "fallido", detail };
  }
}

/** Persiste el intento de envío para auditoría y control de duplicados. */
async function logEmail(
  to: string,
  subject: string,
  type: EmailType,
  status: "enviado" | "fallido" | "omitido",
  refs: { surgeryId?: string | null; patientId?: string | null },
  error?: string,
) {
  try {
    await prisma.emailLog.create({
      data: {
        to, subject, type, status, error,
        surgeryId: refs.surgeryId ?? null,
        patientId: refs.patientId ?? null,
      },
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

/**
 * Escapa texto para insertarlo en el HTML de un email. Todo dato cargado
 * por usuarios (nombres, procedimientos, mensajes) pasa por acá: sin esto,
 * un "<" en el texto rompe el formato o permite inyectar HTML.
 */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Layout base compartido por todos los emails del sistema. */
function layout(title: string, body: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <div style="background:#1d4ed8; color:#fff; padding:16px 24px; border-radius:12px 12px 0 0;">
      <strong style="font-size:18px;">MediQ's — Seguimiento de Cirugías</strong>
    </div>
    <div style="border:1px solid #e2e8f0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
      <h2 style="margin-top:0; font-size:18px;">${title}</h2>
      ${body}
      <p style="color:#94a3b8; font-size:12px; margin-top:24px;">
        Este es un mensaje automático de MediQ's. No responder a este correo.
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
      <p>Hola ${esc(s.patientName)},</p>
      <p>Tu cirugía <strong>${esc(s.procedure)}</strong> fue programada para el
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
      <p>Hola ${esc(s.patientName)},</p>
      <p>Tu cirugía <strong>${esc(s.procedure)}</strong> tiene una nueva fecha:
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
      <p>Hola ${esc(s.patientName)},</p>
      <p>Te recordamos que tu cirugía <strong>${esc(s.procedure)}</strong> está programada
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
      <p>Hola ${esc(s.patientName)},</p>
      <p>Para tu cirugía <strong>${esc(s.procedure)}</strong> del
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
      <p>Hola ${esc(s.patientName)},</p>
      <p>Recibiste el alta de tu cirugía <strong>${esc(s.procedure)}</strong>.</p>
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
      <p>Hola ${esc(args.patientName)},</p>
      <p>Tu turno (<strong>${esc(args.type)}</strong>) fue registrado para el
      <strong>${fmtDate(args.scheduledAt)}</strong>.</p>`),
  });
}

/**
 * Mensaje que el médico le deja al paciente desde su historia clínica.
 * El texto se escapa y se respetan los saltos de línea.
 */
export function sendDoctorMessage(args: {
  patientId: string;
  patientEmail: string | null;
  patientName: string;
  authorName: string;
  body: string;
}) {
  return sendEmail({
    to: args.patientEmail,
    type: "mensaje_medico",
    patientId: args.patientId,
    subject: `Nuevo mensaje de ${args.authorName}`,
    html: layout("Tenés un mensaje de tu médico", `
      <p>Hola ${esc(args.patientName)},</p>
      <p><strong>${esc(args.authorName)}</strong> te dejó el siguiente mensaje:</p>
      <div style="background:#f8fafc; border-left:3px solid #1d4ed8; padding:12px 16px; margin:16px 0; white-space:normal;">
        ${esc(args.body).replace(/\r?\n/g, "<br>")}
      </div>
      <p>También podés verlo en tu portal de MediQ's, en "Mi seguimiento".</p>`),
  });
}
