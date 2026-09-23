// ======================================================
// Rutas de auditoría de emails (/api/email-logs)
// Listado de los correos enviados/fallidos/omitidos por el
// sistema (Resend), para control administrativo.
// Acceso: roles ABM (admin, jefa de quirófano, administrativo).
// ======================================================
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAbm } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAbm);

/** Últimos 200 emails registrados, del más reciente al más viejo. */
router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { surgery: { select: { publicCode: true, procedure: true } } },
    });
    res.json(list);
  } catch (e) { next(e); }
});

export default router;
