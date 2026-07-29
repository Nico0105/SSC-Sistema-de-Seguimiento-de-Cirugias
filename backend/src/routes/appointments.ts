// ======================================================
// Rutas de turnos (/api/appointments)
// Gestión de turnos de pacientes: consultas, evaluaciones
// prequirúrgicas, controles postoperatorios y estudios.
// Lectura: cualquier rol interno. Escritura: roles ABM.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireAbm } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);

/** Tipos y estados de turno definidos por la documentación funcional. */
const APPOINTMENT_TYPES = ["consulta", "prequirurgica", "control", "estudio"] as const;
const APPOINTMENT_STATUSES = ["pendiente", "confirmado", "cancelado", "completado"] as const;

const schema = z.object({
  patientId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  type: z.enum(APPOINTMENT_TYPES),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  notes: z.string().optional().nullable(),
});

/** Lista todos los turnos con su paciente, ordenados por fecha. */
router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.appointment.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { patient: true },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Alta de turno (nace "pendiente" salvo que se indique otro estado). */
router.post("/", requireAbm, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const created = await prisma.appointment.create({
      data: { ...data, scheduledAt: new Date(data.scheduledAt) },
      include: { patient: true },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

/** Edición parcial de un turno (reprogramar, confirmar, cancelar, etc.). */
router.patch("/:id", requireAbm, async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

/** Baja física de un turno. */
router.delete("/:id", requireAbm, async (req, res, next) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
