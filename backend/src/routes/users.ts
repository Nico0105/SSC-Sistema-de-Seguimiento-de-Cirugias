// ======================================================
// Rutas de gestión de usuarios (/api/users)
// ABM de usuarios internos y asignación de roles.
// Acceso exclusivo del rol "admin".
// Reglas de seguridad:
//   - Un admin no puede desactivarse a sí mismo.
//   - Un admin no puede quitarse su propio rol de admin.
//   (evitan dejar el sistema sin administradores)
// ======================================================
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/auth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth, requireAdmin);

/** Roles válidos del sistema (deben coincidir con el enum AppRole de Prisma). */
const ROLES = [
  "admin", "jefe_quirofano", "medico", "administrativo", "enfermero", "familiar",
] as const;

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  fullName: z.string().min(2),
  roles: z.array(z.enum(ROLES)).min(1, "Debe asignarse al menos un rol"),
});

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  roles: z.array(z.enum(ROLES)).min(1).optional(),
  active: z.boolean().optional(),
});

/** Serializa un usuario para la API sin exponer el hash de contraseña. */
function serialize(user: { id: string; email: string; fullName: string; active: boolean; createdAt: Date; roles: { role: string }[] }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    active: user.active,
    createdAt: user.createdAt,
    roles: user.roles.map((r) => r.role),
  };
}

/** Lista todos los usuarios con sus roles, ordenados por nombre. */
router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.user.findMany({
      include: { roles: true },
      orderBy: { fullName: "asc" },
    });
    res.json(list.map(serialize));
  } catch (e) { next(e); }
});

/** Crea un usuario con contraseña hasheada y sus roles iniciales. */
router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const created = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: await hashPassword(data.password),
        roles: { create: data.roles.map((role) => ({ role })) },
      },
      include: { roles: true },
    });
    res.status(201).json(serialize(created));
  } catch (e) { next(e); }
});

/**
 * Actualiza nombre, roles y/o estado activo.
 * Los roles se reemplazan de forma atómica (delete + create en una
 * transacción) para que nunca quede un usuario con roles a medias.
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const isSelf = req.params.id === req.user!.sub;

    // Protecciones contra dejar el sistema sin administradores.
    if (isSelf && data.active === false) {
      throw new HttpError(400, "No podés desactivar tu propia cuenta");
    }
    if (isSelf && data.roles && !data.roles.includes("admin")) {
      throw new HttpError(400, "No podés quitarte tu propio rol de administrador");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.roles) {
        await tx.userRole.deleteMany({ where: { userId: req.params.id } });
      }
      return tx.user.update({
        where: { id: req.params.id },
        data: {
          fullName: data.fullName,
          active: data.active,
          roles: data.roles ? { create: data.roles.map((role) => ({ role })) } : undefined,
        },
        include: { roles: true },
      });
    });

    res.json(serialize(updated));
  } catch (e) { next(e); }
});

/** Resetea la contraseña de un usuario (la define el administrador). */
router.patch("/:id/password", async (req, res, next) => {
  try {
    const { password } = z
      .object({ password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres") })
      .parse(req.body);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await hashPassword(password) },
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
