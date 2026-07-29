// ======================================================
// Roles y permisos (lib/permissions.ts)
// Catálogo de roles del sistema y grupos de permisos usados
// por la UI para mostrar/ocultar acciones. La autorización
// real siempre la valida el backend; esto es sólo UX.
// ======================================================

export type Role =
  | "admin"
  | "jefe_quirofano"
  | "medico"
  | "administrativo"
  | "enfermero"
  | "familiar"
  | "paciente";

/** Etiquetas en español que ve el usuario. */
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  jefe_quirofano: "Jefe de quirófano",
  medico: "Médico",
  administrativo: "Administrativo",
  enfermero: "Enfermero",
  familiar: "Familiar",
  paciente: "Paciente",
};

/** Pueden crear/editar/eliminar pacientes, cirugías, turnos y quirófanos. */
export const ABM_ROLES: Role[] = ["admin", "jefe_quirofano", "administrativo"];

/** Pueden avanzar el estado de una cirugía durante el proceso. */
export const STATUS_CHANGE_ROLES: Role[] = ["admin", "jefe_quirofano", "enfermero"];

/** Acceso a la gestión de usuarios. */
export const ADMIN_ROLES: Role[] = ["admin"];

/** Roles internos del hospital: acceden al panel de gestión completo. */
export const STAFF_ROLES: Role[] = ["admin", "jefe_quirofano", "medico", "administrativo", "enfermero"];

/** Personal clínico: carga controles postoperatorios. */
export const CLINICAL_ROLES: Role[] = ["admin", "jefe_quirofano", "medico", "enfermero"];

/** Rol de autogestión del paciente (portal "Mi seguimiento"). */
export const PATIENT_ROLES: Role[] = ["paciente"];

/** true si el usuario tiene al menos uno de los roles permitidos. */
export function hasAnyRole(userRoles: string[] | undefined, allowed: Role[]): boolean {
  if (!userRoles) return false;
  return userRoles.some((r) => allowed.includes(r as Role));
}
