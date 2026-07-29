// ======================================================
// Portal del paciente (/api/me)
// Endpoints de AUTOGESTIÓN: el usuario con rol "paciente"
// sólo accede a la información del paciente vinculado a su
// propia cuenta (Patient.userId). Nunca puede ver ni editar
// datos de otros pacientes ni administrar el sistema.
//
//   GET  /me/patient                → sus datos personales
//   GET  /me/surgeries              → sus cirugías (con timeline)
//   GET  /me/surgeries/:id/checklist→ su checklist (sólo lectura)
//   GET  /me/postop                 → sus controles/indicaciones
//   GET  /me/symptoms               → sus reportes de síntomas
//   POST /me/symptoms               → registrar síntomas del día
//   GET  /me/history                → su historial consolidado
// ======================================================
import { Router } from "express";
import type { Request } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requirePatient } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { getOrCreateChecklist } from "./checklists.js";
import { symptomSchema } from "./symptoms.js";
import { buildPatientHistory } from "./history.js";

const router = Router();
router.use(requireAuth, requirePatient);

/**
 * Resuelve el paciente vinculado a la cuenta autenticada.
 * 404 si el admin todavía no asoció la cuenta a un paciente.
 */
async function getOwnPatient(req: Request) {
  const patient = await prisma.patient.findFirst({
    where: { userId: req.user!.sub, deletedAt: null },
  });
  if (!patient) {
    throw new HttpError(404, "Tu cuenta no está vinculada a un paciente. Contactá al hospital.");
  }
  return patient;
}

/** Datos personales del paciente (sólo lectura). */
router.get("/me/patient", async (req, res, next) => {
  try {
    res.json(await getOwnPatient(req));
  } catch (e) { next(e); }
});

/** Cirugías propias, con quirófano y timeline de estados. */
router.get("/me/surgeries", async (req, res, next) => {
  try {
    const patient = await getOwnPatient(req);
    const list = await prisma.surgery.findMany({
      where: { patientId: patient.id },
      orderBy: { scheduledAt: "desc" },
      include: {
        operatingRoom: true,
        history: { orderBy: { createdAt: "desc" } },
      },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Checklist preoperatorio de una cirugía propia (sólo visualización). */
router.get("/me/surgeries/:id/checklist", async (req, res, next) => {
  try {
    const patient = await getOwnPatient(req);
    // Se valida la PROPIEDAD de la cirugía antes de exponer el checklist.
    const surgery = await prisma.surgery.findFirst({
      where: { id: req.params.id, patientId: patient.id },
    });
    if (!surgery) return res.status(404).json({ error: "Cirugía no encontrada" });
    res.json(await getOrCreateChecklist(surgery.id));
  } catch (e) { next(e); }
});

/** Controles postoperatorios propios (indicaciones, medicación, evolución). */
router.get("/me/postop", async (req, res, next) => {
  try {
    const patient = await getOwnPatient(req);
    const list = await prisma.postopRecord.findMany({
      where: { surgery: { patientId: patient.id } },
      orderBy: { createdAt: "desc" },
      include: { surgery: { select: { procedure: true, publicCode: true } } },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Historial de síntomas propios. */
router.get("/me/symptoms", async (req, res, next) => {
  try {
    const patient = await getOwnPatient(req);
    const list = await prisma.symptomReport.findMany({
      where: { patientId: patient.id },
      orderBy: { reportedAt: "desc" },
      include: { surgery: { select: { procedure: true } } },
    });
    res.json(list);
  } catch (e) { next(e); }
});

/** Registro diario de síntomas por el propio paciente. */
router.post("/me/symptoms", async (req, res, next) => {
  try {
    const patient = await getOwnPatient(req);
    const data = symptomSchema.parse(req.body);

    // Si el reporte se asocia a una cirugía, debe ser una propia.
    if (data.surgeryId) {
      const owns = await prisma.surgery.findFirst({
        where: { id: data.surgeryId, patientId: patient.id },
      });
      if (!owns) throw new HttpError(400, "La cirugía indicada no te pertenece");
    }

    const created = await prisma.symptomReport.create({
      data: {
        patientId: patient.id,
        symptoms: [...data.symptoms],
        painLevel: data.painLevel,
        notes: data.notes,
        surgeryId: data.surgeryId ?? null,
        reportedAt: data.reportedAt ? new Date(data.reportedAt) : undefined,
      },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

/** Historial clínico consolidado del propio paciente. */
router.get("/me/history", async (req, res, next) => {
  try {
    const patient = await getOwnPatient(req);
    res.json(await buildPatientHistory(patient.id));
  } catch (e) { next(e); }
});

export default router;
