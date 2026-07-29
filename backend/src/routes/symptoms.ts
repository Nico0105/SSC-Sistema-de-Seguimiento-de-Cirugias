// ======================================================
// Rutas de registro de síntomas (montadas en /api)
//   - GET  /patients/:id/symptoms → staff: historial de síntomas
//   - POST /patients/:id/symptoms → staff: carga en nombre del paciente
// El paciente registra y consulta sus propios síntomas por el
// portal /api/me (routes/me.ts), que reutiliza estos schemas.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);

/** Catálogo de síntomas ofrecidos por la documentación funcional. */
export const SYMPTOMS = [
  "dolor", "ardor", "vision_borrosa", "fiebre", "inflamacion", "sangrado", "otros",
] as const;

/** Datos de un reporte de síntomas (compartido con el portal del paciente). */
export const symptomSchema = z.object({
  symptoms: z.array(z.enum(SYMPTOMS)).min(1, "Marcá al menos un síntoma"),
  painLevel: z.number().int().min(0).max(10),
  notes: z.string().optional().nullable(),
  surgeryId: z.string().uuid().optional().nullable(),
  /** Fecha/hora del reporte; por defecto, el momento de la carga. */
  reportedAt: z.string().datetime().optional(),
});

/** Historial de síntomas de un paciente, del más reciente al más viejo. */
router.get("/patients/:id/symptoms", async (req, res, next) => {
  try {
    const list = await prisma.symptomReport.findMany({
      where: { patientId: req.params.id },
      orderBy: { reportedAt: "desc" },
      include: { surgery: { select: { procedure: true, publicCode: true } } },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Carga de un reporte de síntomas por parte del staff. */
router.post("/patients/:id/symptoms", async (req, res, next) => {
  try {
    const data = symptomSchema.parse(req.body);
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

    const created = await prisma.symptomReport.create({
      data: {
        patientId: patient.id,
        symptoms: [...data.symptoms],
        painLevel: data.painLevel,
        notes: data.notes,
        surgeryId: data.surgeryId ?? null,
        reportedAt: data.reportedAt ? new Date(data.reportedAt) : undefined,
      },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

export default router;
