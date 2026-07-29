// ======================================================
// Rutas públicas (/api/public)
// Endpoints SIN autenticación pensados para la pantalla
// de familiares en la sala de espera.
//
// Privacidad: nunca se exponen datos del paciente. Cada
// cirugía se identifica sólo por su código público anónimo
// (los familiares lo reciben al ingresar el paciente).
// ======================================================
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * Tablero del día: cirugías programadas para la fecha actual con su
 * estado en tiempo real. Devuelve únicamente código público, estado,
 * horarios y quirófano.
 */
router.get("/board", async (_req, res, next) => {
  try {
    // Rango [hoy 00:00, mañana 00:00) en hora local del servidor.
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
