// ======================================================
// Middlewares de autenticación y autorización
// - requireAuth: valida el JWT del header Authorization y
//   adjunta el payload en req.user.
// - requireRole: fabrica middlewares que exigen al menos
//   uno de los roles indicados.
// Los alias exportados (requireStaff, requireAbm, etc.)
// son la matriz de permisos del sistema en un solo lugar.
// ======================================================
import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      /** Payload del JWT del usuario autenticado (seteado por requireAuth). */
      user?: JwtPayload;
    }
  }
}

/**
 * Exige un token válido con formato "Authorization: Bearer <jwt>".
 * Responde 401 si falta, es inválido o expiró.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/**
 * Fabrica un middleware que permite el acceso sólo si el usuario
 * tiene AL MENOS UNO de los roles indicados (un usuario puede
 * tener varios roles a la vez).
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });
    const ok = req.user.roles.some((r) => roles.includes(r));
    if (!ok) return res.status(403).json({ error: "Permiso denegado" });
    next();
  };
}

// ------------------------------------------------------
// Matriz de permisos del sistema
// ------------------------------------------------------

/** Cualquier rol interno del hospital (excluye "familiar"): lectura general. */
export const requireStaff = requireRole(
  "admin",
  "jefe_quirofano",
  "medico",
  "administrativo",
  "enfermero",
);

/** Alta/edición/baja de pacientes, turnos, quirófanos y cirugías. */
export const requireAbm = requireRole("admin", "jefe_quirofano", "administrativo");

/** Avanzar el estado de una cirugía durante el proceso quirúrgico. */
export const requireSurgeryStatusChange = requireRole("admin", "jefe_quirofano", "enfermero");

/** Gestión de usuarios y roles (sólo administradores). */
export const requireAdmin = requireRole("admin");

/** Portal de autogestión del paciente (sólo ve su propia información). */
export const requirePatient = requireRole("paciente");

/** Personal clínico: carga controles postoperatorios y marca checklists. */
export const requireClinical = requireRole("admin", "jefe_quirofano", "medico", "enfermero");

/** Configuración de la plantilla del checklist preoperatorio. */
export const requireChecklistAdmin = requireRole("admin", "jefe_quirofano");
