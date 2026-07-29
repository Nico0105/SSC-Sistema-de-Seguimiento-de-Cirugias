// ======================================================
// Rutas de cirugías (/api/surgeries)
// Núcleo del sistema: ABM de cirugías, cambio de estado
// siguiendo la máquina de estados documentada y timeline
// de cambios (SurgeryStatusHistory).
//
// Cada cambio relevante emite un evento por Socket.io con
// un payload MÍNIMO (sin datos del paciente) porque la
// pantalla pública de familiares también recibe estos
// eventos; los clientes internos recargan por REST con JWT.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireAbm, requireSurgeryStatusChange } from "../middleware/auth.js";
import { emit } from "../lib/realtime.js";
import { canTransition, ALLOWED_TRANSITIONS } from "../lib/surgery-status.js";
import { HttpError } from "../middleware/error.js";
import {
  sendSurgeryConfirmation,
  sendPreopInstructions,
  sendSurgeryReschedule,
  sendDischargeEmail,
} from "../lib/email.js";
import { notifySurgeryStatusChange, notifyDischarge } from "../lib/notifications.js";

const router = Router();
router.use(requireAuth, requireStaff);

const STATUSES = [
  "programada", "ingreso", "preoperatorio", "en_quirofano",
  "recuperacion", "postoperatorio", "alta", "cancelada",
] as const;

const PRIORITIES = ["baja", "normal", "alta", "urgencia"] as const;

// Datos generales de la cirugía (ABM). El estado NO se edita por acá:
// se cambia únicamente por PATCH /:id/status para respetar el flujo.
const surgerySchema = z.object({
  publicCode: z.string().min(1),
  patientId: z.string().uuid(),
  operatingRoomId: z.string().uuid().optional().nullable(),
  procedure: z.string().min(1),
  surgeonName: z.string().optional().nullable(),
  scheduledAt: z.string().datetime(),
  priority: z.enum(PRIORITIES).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const statusSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().optional().nullable(),
});

/** Payload mínimo y anónimo para los eventos de tiempo real. */
function toRealtimePayload(s: { id: string; publicCode: string; status: string }) {
  return { id: s.id, publicCode: s.publicCode, status: s.status };
}

/** Lista todas las cirugías con paciente y quirófano, por fecha programada. */
router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.surgery.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { patient: true, operatingRoom: true },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Detalle completo de una cirugía, incluido su timeline de estados. */
router.get("/:id", async (req, res, next) => {
  try {
    const s = await prisma.surgery.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        operatingRoom: true,
        history: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!s) return res.status(404).json({ error: "Cirugía no encontrada" });
    res.json(s);
  } catch (e) { next(e); }
});

/** Timeline de cambios de estado de una cirugía. */
router.get("/:id/history", async (req, res, next) => {
  try {
    const h = await prisma.surgeryStatusHistory.findMany({
      where: { surgeryId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(h);
  } catch (e) { next(e); }
});

/**
 * Alta de cirugía. Nace siempre en estado "programada" y se registra
 * la primera entrada del timeline con el usuario que la creó.
 */
router.post("/", requireAbm, async (req, res, next) => {
  try {
    const data = surgerySchema.parse(req.body);
    const created = await prisma.surgery.create({
      data: {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
        history: { create: { status: "programada", changedBy: req.user!.sub } },
      },
      include: { patient: true, operatingRoom: true },
    });
    emit("surgery:created", toRealtimePayload(created));

    // Emails automáticos al paciente: confirmación + indicaciones
    // preoperatorias (no bloquean la respuesta; se auditan en EmailLog).
    const emailData = {
      patientEmail: created.patient.email,
      patientName: created.patient.firstName,
      procedure: created.procedure,
      scheduledAt: created.scheduledAt,
      surgeryId: created.id,
    };
    void sendSurgeryConfirmation(emailData);
    void sendPreopInstructions(emailData);

    res.status(201).json(created);
  } catch (e) { next(e); }
});

/** Edición de datos generales (no del estado) de una cirugía. */
router.patch("/:id", requireAbm, async (req, res, next) => {
  try {
    const data = surgerySchema.partial().parse(req.body);
    const current = await prisma.surgery.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: "Cirugía no encontrada" });

    const updated = await prisma.surgery.update({
      where: { id: req.params.id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
      include: { patient: true, operatingRoom: true },
    });
    emit("surgery:update", toRealtimePayload(updated));

    // Si cambió la fecha/hora, se avisa al paciente por email.
    if (data.scheduledAt && updated.scheduledAt.getTime() !== current.scheduledAt.getTime()) {
      void sendSurgeryReschedule({
        patientEmail: updated.patient.email,
        patientName: updated.patient.firstName,
        procedure: updated.procedure,
        scheduledAt: updated.scheduledAt,
        surgeryId: updated.id,
      });
    }

    res.json(updated);
  } catch (e) { next(e); }
});

/**
 * Cambio de estado de la cirugía.
 * - Valida la transición contra la máquina de estados documentada.
 * - Registra automáticamente startedAt (al entrar a quirófano) y
 *   endedAt (al salir a recuperación).
 * - Actualiza el estado y escribe el timeline en UNA transacción,
 *   para que nunca quede un cambio de estado sin historial.
 */
router.patch("/:id/status", requireSurgeryStatusChange, async (req, res, next) => {
  try {
    const data = statusSchema.parse(req.body);
    const current = await prisma.surgery.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: "Cirugía no encontrada" });

    if (data.status === current.status) {
      // Cambio idempotente: no hay nada que hacer.
      return res.json(current);
    }
    if (!canTransition(current.status, data.status)) {
      const allowed = ALLOWED_TRANSITIONS[current.status];
      throw new HttpError(
        409,
        allowed.length
          ? `Transición inválida: de "${current.status}" sólo se puede pasar a: ${allowed.join(", ")}`
          : `La cirugía está en un estado terminal ("${current.status}") y no admite cambios`,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const surgery = await tx.surgery.update({
        where: { id: current.id },
        data: {
          status: data.status,
          // Marca automática de inicio/fin de la intervención.
          startedAt: data.status === "en_quirofano" ? new Date() : undefined,
          endedAt: data.status === "recuperacion" ? new Date() : undefined,
        },
        include: { patient: true, operatingRoom: true },
      });
      await tx.surgeryStatusHistory.create({
        data: { surgeryId: surgery.id, status: data.status, changedBy: req.user!.sub, note: data.note },
      });
      return surgery;
    });

    emit("surgery:update", toRealtimePayload(updated));

    // Notificación push al paciente por el cambio de estado.
    void notifySurgeryStatusChange(updated.patientId, updated.id, updated.procedure, updated.status);

    // El alta médica además dispara email + push dedicados.
    if (data.status === "alta") {
      void sendDischargeEmail({
        patientEmail: updated.patient.email,
        patientName: updated.patient.firstName,
        procedure: updated.procedure,
        scheduledAt: updated.scheduledAt,
        surgeryId: updated.id,
      });
      void notifyDischarge(updated.patientId, updated.id);
    }

    res.json(updated);
  } catch (e) { next(e); }
});

/** Baja física de una cirugía (su historial se elimina en cascada). */
router.delete("/:id", requireAbm, async (req, res, next) => {
  try {
    await prisma.surgery.delete({ where: { id: req.params.id } });
    emit("surgery:deleted", { id: req.params.id });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
