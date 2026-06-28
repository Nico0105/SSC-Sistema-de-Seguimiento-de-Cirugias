import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/auth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const ROLES = [
  "admin", "jefe_quirofano", "medico", "administrativo", "enfermero", "familiar",
] as const;

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  roles: z.array(z.enum(ROLES)).min(1),
});

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  roles: z.array(z.enum(ROLES)).min(1).optional(),
  active: z.boolean().optional(),
});

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

router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.user.findMany({
      include: { roles: true },
      orderBy: { fullName: "asc" },
    });
    res.json(list.map(serialize));
  } catch (e) { next(e); }
});

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

router.patch("/:id", async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);

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

router.patch("/:id/password", async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(8) }).parse(req.body);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await hashPassword(password) },
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
