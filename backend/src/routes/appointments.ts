import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireAbm } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireStaff);

const schema = z.object({
  patientId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  type: z.string().min(1),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.appointment.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { patient: true },
    });
    res.json(list);
  } catch (e) { next(e); }
});

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

router.delete("/:id", requireAbm, async (req, res, next) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
