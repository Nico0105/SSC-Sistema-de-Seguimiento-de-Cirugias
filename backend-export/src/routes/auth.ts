import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken, hashPassword, comparePassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "administrativo";

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: await hashPassword(data.password),
        roles: { create: { role } },
      },
      include: { roles: true },
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    });
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, roles: user.roles.map(r => r.role) } });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    });
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, roles: user.roles.map(r => r.role) } });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { roles: true },
    });
    if (!user) return res.status(404).json({ error: "No encontrado" });
    res.json({ id: user.id, email: user.email, fullName: user.fullName, roles: user.roles.map(r => r.role) });
  } catch (e) { next(e); }
});

export default router;
