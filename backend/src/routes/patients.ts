// ======================================================
// Rutas de pacientes (/api/patients)
// ABM de pacientes con borrado lógico (soft delete):
// eliminar un paciente marca `deletedAt` en lugar de
// borrar la fila, para preservar el historial clínico
// y las cirugías asociadas.
// Lectura: cualquier rol interno. Escritura: roles ABM.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireAbm } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  documentId: z.string().min(1),
  birthDate: z.string().datetime().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Lista los pacientes activos (no eliminados).
 * Soporta búsqueda opcional con `?q=` por nombre, apellido o documento.
 */
router.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const list = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { documentId: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { lastName: "asc" },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Detalle de un paciente. Los eliminados lógicamente responden 404. */
router.get("/:id", async (req, res, next) => {
  try {
    const p = await prisma.patient.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!p) return res.status(404).json({ error: "Paciente no encontrado" });
    res.json(p);
  } catch (e) { next(e); }
});

/** Alta de paciente. El documento debe ser único (409 si se repite). */
router.post("/", requireAbm, async (req, res, next) => {
  try {
    const data = patientSchema.parse(req.body);
    const created = await prisma.patient.create({
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

/** Edición parcial de los datos de un paciente. */
router.patch("/:id", requireAbm, async (req, res, next) => {
  try {
    const data = patientSchema.partial().parse(req.body);
    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

/** Borrado lógico: marca la fecha de eliminación sin destruir datos. */
router.delete("/:id", requireAbm, async (req, res, next) => {
  try {
    await prisma.patient.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
