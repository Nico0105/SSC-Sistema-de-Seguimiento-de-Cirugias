export type Role =
  | "admin"
  | "jefe_quirofano"
  | "medico"
  | "administrativo"
  | "enfermero"
  | "familiar";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  jefe_quirofano: "Jefe de quirófano",
  medico: "Médico",
  administrativo: "Administrativo",
  enfermero: "Enfermero",
  familiar: "Familiar",
};

export const ABM_ROLES: Role[] = ["admin", "jefe_quirofano", "administrativo"];
export const STATUS_CHANGE_ROLES: Role[] = ["admin", "jefe_quirofano", "enfermero"];
export const ADMIN_ROLES: Role[] = ["admin"];

export function hasAnyRole(userRoles: string[] | undefined, allowed: Role[]): boolean {
  if (!userRoles) return false;
  return userRoles.some((r) => allowed.includes(r as Role));
}
