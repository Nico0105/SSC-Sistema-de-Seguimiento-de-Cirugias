// ======================================================
// Rutas de seguimiento postoperatorio (montadas en /api)
//   - GET  /surgeries/:id/postop → staff: historial cronológico
//   - POST /surgeries/:id/postop → personal clínico: nuevo control
// Cada control registra estado del paciente, evolución,
// medicación, cumplimiento y observaciones. Al crearse, se
// notifica por push al paciente ("nuevo seguimiento cargado").
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireClinical } from "../middleware/auth.js";
import { notifyNewPostopRecord } from "../lib/notifications.js";

const router = Router();
router.use(requireAuth, requireStaff);

/** Estados posibles de un control postoperatorio. */
export const POSTOP_STATUSES = ["estable", "mejorando", "con_complicaciones", "alta"] as const;

const recordSchema = z.object({
  status: z.enum(POSTOP_STATUSES),
  evolution: z.string().optional().nullable(),
  medication: z.string().optional().nullable(),
  compliance: z.boolean().optional(),
  observations: z.string().optional().nullable(),
});

/** Historial cronológico de controles de una cirugía (más reciente primero). */
router.get("/surgeries/:id/postop", async (req, res, next) => {
  try {
    const list = await prisma.postopRecord.findMany({
      where: { surgeryId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: { createdByUser: { select: { fullName: true } } },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Alta de un control diario (sólo personal clínico). */
router.post("/surgeries/:id/postop", requireClinical, async (req, res, next) => {
  try {
    const data = recordSchema.parse(req.body);
    const surgery = await prisma.surgery.findUnique({ where: { id: req.params.id } });
    if (!surgery) return res.status(404).json({ error: "Cirugía no encontrada" });

    const created = await prisma.postopRecord.create({
      data: {
        surgeryId: surgery.id,
        status: data.status,
        evolution: data.evolution,
        medication: data.medication,
        compliance: data.compliance ?? true,
        observations: data.observations,
        createdBy: req.user!.sub,
      },
      include: { createdByUser: { select: { fullName: true } } },
    });

    // Aviso push al paciente (no bloquea la respuesta).
    void notifyNewPostopRecord(surgery.patientId, surgery.id);

    res.status(201).json(created);
  } catch (e) { next(e); }
});

export default router;
