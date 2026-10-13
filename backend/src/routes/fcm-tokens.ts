// ======================================================
// Rutas de tokens FCM (/api/fcm-tokens)
// Registro y baja del token de notificaciones push de cada
// dispositivo. Disponible para CUALQUIER usuario autenticado
// (staff y pacientes): cada uno administra sólo sus tokens.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const tokenSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["web", "android", "ios"]).optional(),
});

/**
 * Registra (o reasigna) el token del dispositivo actual.
 * upsert: si el token ya existía (ej. otro usuario en el mismo
 * dispositivo), pasa a pertenecer al usuario autenticado.
 */
router.post("/", async (req, res, next) => {
  try {
    const { token, platform } = tokenSchema.parse(req.body);
    const saved = await prisma.fcmToken.upsert({
      where: { token },
      update: { userId: req.user!.sub, platform },
      create: { token, platform, userId: req.user!.sub },
    });
    res.status(201).json({ id: saved.id });
  } catch (e) { next(e); }
});

/** Da de baja un token (al cerrar sesión en el dispositivo). */
router.delete("/", async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(10) }).parse(req.body);
    // Sólo puede borrar tokens propios.
    await prisma.fcmToken.deleteMany({ where: { token, userId: req.user!.sub } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
