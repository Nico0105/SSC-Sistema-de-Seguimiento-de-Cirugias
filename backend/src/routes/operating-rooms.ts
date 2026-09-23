// ======================================================
// Rutas de quirófanos (/api/operating-rooms)
// ABM simple de quirófanos (código único, nombre, piso).
// Lectura: cualquier rol interno. Escritura: roles ABM.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireAbm } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  floor: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

/** Lista los quirófanos ordenados por código. */
router.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.operatingRoom.findMany({ orderBy: { code: "asc" } }));
  } catch (e) { next(e); }
});

/** Alta de quirófano (código único: 409 si se repite). */
router.post("/", requireAbm, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    res.status(201).json(await prisma.operatingRoom.create({ data }));
  } catch (e) { next(e); }
});

/** Edición parcial de un quirófano. */
router.patch("/:id", requireAbm, async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    res.json(await prisma.operatingRoom.update({ where: { id: req.params.id }, data }));
  } catch (e) { next(e); }
});

/**
 * Baja de quirófano. Si tiene cirugías asociadas, la clave foránea
 * lo impide y el error handler responde 409 (usar `active: false`
 * para retirarlo de servicio sin perder historial).
 */
router.delete("/:id", requireAbm, async (req, res, next) => {
  try {
    await prisma.operatingRoom.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
