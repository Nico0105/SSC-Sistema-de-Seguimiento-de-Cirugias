// ======================================================
// Rutas públicas (/api/public)
// Endpoints SIN autenticación pensados para la pantalla
// de familiares en la sala de espera.
//
// Privacidad: como el endpoint es público, el paciente se
// identifica sólo por su código de seguimiento y un nombre
// abreviado (nombre de pila + inicial del apellido, ej.
// "Mateo R."). Nunca se envían el apellido completo, el
// documento ni el procedimiento.
// ======================================================
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/** "Mateo Rossi" → "Mateo R.": suficiente para que la familia lo reconozca. */
function shortName(firstName: string, lastName: string): string {
  const first = firstName.trim().split(/\s+/)[0] ?? "";
  const initial = lastName.trim().charAt(0).toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}

/**
 * Etapas que se muestran en la sala de espera. Cuando el paciente pasa a
 * postoperatorio, recibe el alta o se cancela su cirugía, sale de la
 * pantalla para dejar lugar a los que siguen en el circuito.
 */
const BOARD_STATUSES = ["programada", "en_quirofano", "esperando_en_sala"] as const;

/**
 * Tablero del día: cirugías de hoy que siguen en el circuito, con su
 * estado en tiempo real. Devuelve código público, nombre abreviado,
 * estado, horarios y quirófano.
 */
router.get("/board", async (_req, res, next) => {
  try {
    // Rango [hoy 00:00, mañana 00:00) en hora local del servidor.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const list = await prisma.surgery.findMany({
      where: { scheduledAt: { gte: start, lt: end }, status: { in: [...BOARD_STATUSES] } },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        publicCode: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        // Sala de espera post-quirófano: dato operativo, no identifica al paciente.
        waitingRoom: true,
        operatingRoom: { select: { code: true, name: true } },
        // Sólo para armar el nombre abreviado; no se reenvía tal cual.
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    res.json(
      list.map(({ patient, ...surgery }) => ({
        ...surgery,
        patientName: shortName(patient.firstName, patient.lastName),
      })),
    );
  } catch (e) { next(e); }
});

export default router;
