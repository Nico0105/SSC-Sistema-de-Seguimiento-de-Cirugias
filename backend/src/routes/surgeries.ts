import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import { emit } from "../lib/realtime.js";

const router = Router();
router.use(requireAuth, requireStaff);

const STATUSES = [
  "programada", "ingreso", "preoperatorio", "en_quirofano",
  "recuperacion", "postoperatorio", "alta", "cancelada",
] as const;

const surgerySchema = z.object({
  publicCode: z.string().min(1),
  patientId: z.string().uuid(),
  operatingRoomId: z.string().uuid().optional().nullable(),
  procedure: z.string().min(1),
  surgeonName: z.string().optional().nullable(),
  scheduledAt: z.string().datetime(),
  priority: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(STATUSES).optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.surgery.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { patient: true, operatingRoom: true },
    });
    res.json(list);
  } catch (e) { next(e); }
});

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
    if (!s) return res.status(404).json({ error: "No encontrada" });
    res.json(s);
  } catch (e) { next(e); }
});

router.get("/:id/history", async (req, res, next) => {
  try {
    const h = await prisma.surgeryStatusHistory.findMany({
      where: { surgeryId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(h);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = surgerySchema.parse(req.body);
    const created = await prisma.surgery.create({
      data: {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
        history: { create: { status: data.status ?? "programada", changedBy: req.user!.sub } },
      },
      include: { patient: true, operatingRoom: true },
    });
    emit("surgery:created", created);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = surgerySchema.partial().parse(req.body);
    const current = await prisma.surgery.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: "No encontrada" });

    const updated = await prisma.surgery.update({
      where: { id: req.params.id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
      include: { patient: true, operatingRoom: true },
    });

    if (data.status && data.status !== current.status) {
      await prisma.surgeryStatusHistory.create({
        data: { surgeryId: updated.id, status: data.status, changedBy: req.user!.sub },
      });
    }

    emit("surgery:update", updated);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.surgery.delete({ where: { id: req.params.id } });
    emit("surgery:deleted", { id: req.params.id });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
