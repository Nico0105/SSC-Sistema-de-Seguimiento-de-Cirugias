// ======================================================
// Middlewares de autenticación y autorización
// - requireAuth: valida el JWT del header Authorization y
//   adjunta el payload en req.user.
// - requirePermission: exige que alguno de los roles del
//   usuario tenga el permiso pedido según PERMISSIONS.
// PERMISSIONS es la matriz de permisos de todo el sistema:
// para cambiar qué puede hacer un rol se edita sólo acá
// (y su espejo en frontend/src/lib/permissions.ts).
// ======================================================
import type { Request, Response, NextFunction } from "express";
import type { AppRole } from "@prisma/client";
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

// ------------------------------------------------------
// Matriz de permisos
// ------------------------------------------------------

/** Todo el personal del hospital: puede entrar al panel interno. */
const STAFF: AppRole[] = ["admin", "jefe_quirofano", "medico", "enfermero", "recepcionista", "administrativo"];

/**
 * Personal que accede a información clínica (historial, síntomas,
 * checklist, seguimiento). La recepción queda afuera: gestiona datos
 * administrativos del paciente, no su historia clínica.
 */
const CLINICAL_READERS: AppRole[] = ["admin", "jefe_quirofano", "medico", "enfermero", "administrativo"];

export const PERMISSIONS = {
  /** Ver panel interno: dashboard, listados de cirugías, pacientes y turnos. */
  "panel:ver": STAFF,
  "pacientes:escribir": ["admin", "jefe_quirofano", "administrativo", "recepcionista"],
  "turnos:escribir": ["admin", "jefe_quirofano", "administrativo"],
  "cirugias:escribir": ["admin", "jefe_quirofano", "administrativo"],
  "cirugias:cambiar_estado": ["admin", "jefe_quirofano", "enfermero"],
  "quirofanos:escribir": ["admin", "jefe_quirofano", "administrativo"],
  "clinica:ver": CLINICAL_READERS,
  /** Marcar ítems del checklist y cargar síntomas en nombre del paciente. */
  "clinica:escribir": CLINICAL_READERS,
  "checklist:configurar": ["admin", "jefe_quirofano"],
  "postop:escribir": ["admin", "jefe_quirofano", "medico", "enfermero"],
  /** Dejarle mensajes al paciente desde su historia (le llegan por email). */
  "mensajes:escribir": ["admin", "medico"],
  "insumos:ver": CLINICAL_READERS,
  "insumos:gestionar": ["admin", "jefe_quirofano", "enfermero"],
  "insumos:consumir": ["admin", "jefe_quirofano", "medico", "enfermero"],
  "emails:ver": ["admin", "jefe_quirofano", "administrativo"],
  "usuarios:gestionar": ["admin"],
  /** Portal de autogestión: sólo ve su propia información. */
  "portal:paciente": ["paciente"],
} satisfies Record<string, AppRole[]>;

export type Permission = keyof typeof PERMISSIONS;

/** true si alguno de los roles tiene el permiso. */
export function hasPermission(roles: string[], permission: Permission): boolean {
  const allowed: readonly string[] = PERMISSIONS[permission];
  return roles.some((r) => allowed.includes(r));
}

/**
 * Fabrica un middleware que permite el acceso sólo si el usuario
 * tiene el permiso (un usuario puede tener varios roles a la vez).
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });
    if (!hasPermission(req.user.roles, permission)) {
      return res.status(403).json({ error: "Permiso denegado" });
    }
    next();
  };
}
