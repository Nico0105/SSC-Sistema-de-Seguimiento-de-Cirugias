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

router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.patient.findMany({
      where: { deletedAt: null },
      orderBy: { lastName: "asc" },
    });
    res.json(list);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const p = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!p) return res.status(404).json({ error: "No encontrado" });
    res.json(p);
  } catch (e) { next(e); }
});

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
