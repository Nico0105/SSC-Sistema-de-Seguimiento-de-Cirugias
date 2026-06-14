import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * Pantalla pública para familiares.
 * Sin auth. NO devuelve datos del paciente — sólo código público y estado.
 */
router.get("/board", async (_req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const list = await prisma.surgery.findMany({
      where: { scheduledAt: { gte: start, lt: end } },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        publicCode: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        operatingRoom: { select: { code: true, name: true } },
      },
    });
    res.json(list);
  } catch (e) { next(e); }
});

export default router;
