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

router.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.operatingRoom.findMany({ orderBy: { code: "asc" } }));
  } catch (e) { next(e); }
});

router.post("/", requireAbm, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    res.status(201).json(await prisma.operatingRoom.create({ data }));
  } catch (e) { next(e); }
});

router.patch("/:id", requireAbm, async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    res.json(await prisma.operatingRoom.update({ where: { id: req.params.id }, data }));
  } catch (e) { next(e); }
});

router.delete("/:id", requireAbm, async (req, res, next) => {
  try {
    await prisma.operatingRoom.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
