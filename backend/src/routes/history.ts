// ======================================================
// Historial clínico consolidado (montado en /api)
//   - GET /patients/:id/history → staff
// Reúne en una sola respuesta todo lo del paciente: datos
// personales, cirugías (con timeline, checklist y controles
// postoperatorios), síntomas, alertas derivadas y emails
// enviados. El portal del paciente reutiliza el mismo
// armado vía buildPatientHistory().
// ======================================================
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

const router = Router();

/**
 * Alertas derivadas automáticamente del historial:
 *  - dolor fuerte (nivel >= 8) en los últimos 7 días
 *  - fiebre o sangrado reportados en los últimos 7 días
 *  - cirugía con complicaciones en el último control
 */
function deriveAlerts(
  symptoms: { symptoms: string[]; painLevel: number; reportedAt: Date }[],
  lastPostopBySurgery: { procedure: string; status: string }[],
): string[] {
  const alerts: string[] = [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = symptoms.filter((s) => s.reportedAt >= weekAgo);

  if (recent.some((s) => s.painLevel >= 8)) {
    alerts.push("Dolor intenso (≥ 8/10) reportado en los últimos 7 días");
  }
  if (recent.some((s) => s.symptoms.includes("fiebre"))) {
    alerts.push("Fiebre reportada en los últimos 7 días");
  }
  if (recent.some((s) => s.symptoms.includes("sangrado"))) {
    alerts.push("Sangrado reportado en los últimos 7 días");
  }
  for (const s of lastPostopBySurgery) {
    if (s.status === "con_complicaciones") {
      alerts.push(`Último control de "${s.procedure}" con complicaciones`);
    }
  }
  return alerts;
}

/**
 * Arma el historial clínico completo de un paciente.
 * Las consultas van en paralelo; todo se ordena cronológicamente
 * (lo más reciente primero).
 */
export async function buildPatientHistory(patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) return null;

  const [surgeries, symptoms, emails] = await Promise.all([
    prisma.surgery.findMany({
      where: { patientId },
      orderBy: { scheduledAt: "desc" },
      include: {
        operatingRoom: true,
        history: { orderBy: { createdAt: "desc" } },
        checklistItems: { orderBy: { order: "asc" } },
        postopRecords: {
          orderBy: { createdAt: "desc" },
          include: { createdByUser: { select: { fullName: true } } },
        },
      },
    }),
    prisma.symptomReport.findMany({
      where: { patientId },
      orderBy: { reportedAt: "desc" },
    }),
    prisma.emailLog.findMany({
      where: { surgery: { patientId } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const alerts = deriveAlerts(
    symptoms,
    surgeries
      .filter((s) => s.postopRecords.length > 0)
      .map((s) => ({ procedure: s.procedure, status: s.postopRecords[0].status })),
  );

  // Medicación vigente: la del control postoperatorio más reciente de cada cirugía.
  const medication = surgeries
    .map((s) => {
      const last = s.postopRecords.find((r) => r.medication);
      return last ? { procedure: s.procedure, medication: last.medication } : null;
    })
    .filter((m): m is { procedure: string; medication: string | null } => m !== null);

  return { patient, surgeries, symptoms, alerts, medication, emails };
}

/** Historial clínico completo (vista consolidada del staff). */
router.get("/patients/:id/history", requireAuth, requireStaff, async (req, res, next) => {
  try {
    const history = await buildPatientHistory(req.params.id);
    if (!history) return res.status(404).json({ error: "Paciente no encontrado" });
    res.json(history);
  } catch (e) { next(e); }
});

export default router;
