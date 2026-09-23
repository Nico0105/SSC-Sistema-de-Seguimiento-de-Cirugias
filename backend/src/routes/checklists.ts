// ======================================================
// Rutas del checklist preoperatorio (montadas en /api)
//
// Dos niveles:
// 1. Plantilla configurable (ChecklistTemplate):
//    - GET    /checklist-templates          → staff
//    - POST   /checklist-templates          → admin / jefa de quirófano
//    - PATCH  /checklist-templates/:id      → admin / jefa de quirófano
//    - DELETE /checklist-templates/:id      → admin / jefa de quirófano
// 2. Checklist de una cirugía (SurgeryChecklistItem):
//    - GET   /surgeries/:id/checklist       → staff (se genera desde la
//      plantilla activa la primera vez que se consulta)
//    - PATCH /checklist-items/:id           → staff (marcar / desmarcar)
//
// El paciente ve su checklist por el portal /api/me (sólo lectura).
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff, requireChecklistAdmin } from "../middleware/auth.js";

const router = Router();
// Este router se monta en /api: los middlewares se acotan a sus prefijos
// para no interceptar requests de otros routers (ej. /api/me del paciente).
router.use(["/checklist-templates", "/checklist-items", "/surgeries"], requireAuth, requireStaff);

const templateSchema = z.object({
  label: z.string().min(1),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// ------------------------------------------------------
// Plantilla configurable
// ------------------------------------------------------

/** Lista los ítems de la plantilla (activos e inactivos, ordenados). */
router.get("/checklist-templates", async (_req, res, next) => {
  try {
    const list = await prisma.checklistTemplate.findMany({ orderBy: { order: "asc" } });
    res.json(list);
  } catch (e) { next(e); }
});

/** Agrega un ítem a la plantilla. */
router.post("/checklist-templates", requireChecklistAdmin, async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);
    res.status(201).json(await prisma.checklistTemplate.create({ data }));
  } catch (e) { next(e); }
});

/** Edita un ítem de la plantilla (texto, orden o activo/inactivo). */
router.patch("/checklist-templates/:id", requireChecklistAdmin, async (req, res, next) => {
  try {
    const data = templateSchema.partial().parse(req.body);
    res.json(await prisma.checklistTemplate.update({ where: { id: req.params.id }, data }));
  } catch (e) { next(e); }
});

/** Elimina un ítem de la plantilla (no afecta checklists ya generados). */
router.delete("/checklist-templates/:id", requireChecklistAdmin, async (req, res, next) => {
  try {
    await prisma.checklistTemplate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

// ------------------------------------------------------
// Checklist de una cirugía
// ------------------------------------------------------

/**
 * Genera (si no existen) los ítems del checklist de una cirugía a partir
 * de la plantilla activa y los devuelve ordenados. Compartido con el
 * portal del paciente (routes/me.ts).
 */
export async function getOrCreateChecklist(surgeryId: string) {
  const existing = await prisma.surgeryChecklistItem.findMany({
    where: { surgeryId },
    orderBy: { order: "asc" },
    include: { checkedByUser: { select: { fullName: true } } },
  });
  if (existing.length > 0) return existing;

  const templates = await prisma.checklistTemplate.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  if (templates.length === 0) return [];

  await prisma.surgeryChecklistItem.createMany({
    data: templates.map((t) => ({ surgeryId, label: t.label, order: t.order })),
  });
  return prisma.surgeryChecklistItem.findMany({
    where: { surgeryId },
    orderBy: { order: "asc" },
    include: { checkedByUser: { select: { fullName: true } } },
  });
}

/** Checklist de la cirugía (se materializa desde la plantilla al primer acceso). */
router.get("/surgeries/:id/checklist", async (req, res, next) => {
  try {
    const surgery = await prisma.surgery.findUnique({ where: { id: req.params.id } });
    if (!surgery) return res.status(404).json({ error: "Cirugía no encontrada" });
    res.json(await getOrCreateChecklist(surgery.id));
  } catch (e) { next(e); }
});

/** Marca o desmarca un ítem, registrando quién y cuándo lo hizo. */
router.patch("/checklist-items/:id", async (req, res, next) => {
  try {
    const { checked } = z.object({ checked: z.boolean() }).parse(req.body);
    const updated = await prisma.surgeryChecklistItem.update({
      where: { id: req.params.id },
      data: {
        checked,
        checkedBy: checked ? req.user!.sub : null,
        checkedAt: checked ? new Date() : null,
      },
      include: { checkedByUser: { select: { fullName: true } } },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
