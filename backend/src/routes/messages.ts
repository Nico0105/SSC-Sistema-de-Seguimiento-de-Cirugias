// ======================================================
// Mensajes del médico al paciente (montadas en /api)
//   - GET  /patients/:id/messages → personal clínico: el hilo completo
//   - POST /patients/:id/messages → médico/admin: nuevo mensaje
// Es un hilo individual por paciente donde sólo escribe el
// equipo médico. Cada mensaje se envía por email al paciente
// (Brevo) y genera un aviso push; el paciente lo ve también en
// su portal (GET /api/me/messages, en routes/me.ts).
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { sendDoctorMessage } from "../lib/email.js";
import { notifyDoctorMessage } from "../lib/notifications.js";

const router = Router();

const messageSchema = z.object({
  body: z.string().trim().min(1, "El mensaje está vacío").max(2000, "Máximo 2000 caracteres"),
});

/** Campos del autor que se exponen junto a cada mensaje. */
export const MESSAGE_INCLUDE = { author: { select: { fullName: true } } } as const;

/** Hilo de mensajes del paciente, del más reciente al más viejo. */
router.get("/patients/:id/messages", requireAuth, requirePermission("clinica:ver"), async (req, res, next) => {
  try {
    const list = await prisma.patientMessage.findMany({
      where: { patientId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: MESSAGE_INCLUDE,
    });
    res.json(list);
  } catch (e) { next(e); }
});

/**
 * Nuevo mensaje para el paciente. Se guarda primero (el mensaje nunca se
 * pierde aunque falle el email), después se envía por email y se registra
 * el resultado en el propio mensaje para mostrarlo en la interfaz.
 */
router.post("/patients/:id/messages", requireAuth, requirePermission("mensajes:escribir"), async (req, res, next) => {
  try {
    const { body } = messageSchema.parse(req.body);
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

    const author = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { fullName: true },
    });
    const authorName = author?.fullName ?? "Tu médico";

    const message = await prisma.patientMessage.create({
      data: { patientId: patient.id, authorId: req.user!.sub, body },
    });

    const email = await sendDoctorMessage({
      patientId: patient.id,
      patientEmail: patient.email,
      patientName: patient.firstName,
      authorName,
      body,
    });
    void notifyDoctorMessage(patient.id, authorName);

    const saved = await prisma.patientMessage.update({
      where: { id: message.id },
      data: { emailStatus: email.status },
      include: MESSAGE_INCLUDE,
    });
    res.status(201).json(saved);
  } catch (e) { next(e); }
});

export default router;
