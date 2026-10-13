// ======================================================
// Rutas de autenticación (/api/auth)
// - POST /login : valida credenciales y emite el JWT.
// - GET  /me    : devuelve el usuario de la sesión actual
//                 (usado por el frontend al recargar la página).
// El login está protegido con rate limiting para frenar
// ataques de fuerza bruta.
// ======================================================
import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { signToken, comparePassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** Máximo 10 intentos de login por IP cada 15 minutos. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Probá de nuevo en unos minutos." },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Forma pública de un usuario: nunca se expone el hash de contraseña. */
function toPublicUser(user: { id: string; email: string; fullName: string; roles: { role: string }[] }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles.map((r) => r.role),
  };
}

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    // Mismo mensaje si el email no existe o la contraseña es incorrecta,
    // para no revelar qué cuentas están registradas.
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    if (!user.active) {
      return res.status(401).json({ error: "Usuario desactivado. Contactá al administrador." });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    });
    res.json({ token, user: toPublicUser(user) });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { roles: true, patient: { select: { id: true } } },
    });
    // Si el usuario fue eliminado o desactivado después de emitir el
    // token, la sesión deja de ser válida.
    if (!user || !user.active) return res.status(401).json({ error: "Sesión inválida" });
    // patientId permite a los clientes saber si la cuenta es de un paciente.
    res.json({ ...toPublicUser(user), patientId: user.patient?.id ?? null });
  } catch (e) { next(e); }
});

/**
 * Renovación del token de sesión (usado por la app móvil al abrir).
 * Requiere un token todavía válido: emite uno nuevo con la expiración
 * completa y los roles actuales del usuario (por si cambiaron).
 */
router.post("/refresh", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { roles: true },
    });
    if (!user || !user.active) return res.status(401).json({ error: "Sesión inválida" });

    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    });
    res.json({ token, user: toPublicUser(user) });
  } catch (e) { next(e); }
});

export default router;
