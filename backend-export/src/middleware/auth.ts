import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });
    const ok = req.user.roles.some((r) => roles.includes(r));
    if (!ok) return res.status(403).json({ error: "Permiso denegado" });
    next();
  };
}

export const requireStaff = requireRole(
  "admin",
  "administrativo",
  "jefe_quirofano",
  "medico",
);
