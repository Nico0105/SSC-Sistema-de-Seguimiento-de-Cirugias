// ======================================================
// Roles y permisos (lib/permissions.ts)
// Espejo de la matriz PERMISSIONS del backend
// (backend/src/middleware/auth.ts). La UI la usa para mostrar
// u ocultar pantallas y acciones; la autorización real siempre
// la valida el backend. Si se cambia un permiso allá, se
// cambia también acá.
// ======================================================

export type Role =
  | "admin"
  | "jefe_quirofano"
  | "medico"
  | "enfermero"
  | "recepcionista"
  | "administrativo"
  | "paciente";

/** Etiquetas en español que ve el usuario. */
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  jefe_quirofano: "Jefe de quirófano",
  medico: "Médico",
  enfermero: "Enfermero",
  recepcionista: "Recepcionista",
  administrativo: "Administrativo",
  paciente: "Paciente",
};

/** Todo el personal del hospital: puede entrar al panel interno. */
const STAFF: Role[] = ["admin", "jefe_quirofano", "medico", "enfermero", "recepcionista", "administrativo"];

/** Personal con acceso a información clínica (la recepción queda afuera). */
const CLINICAL_READERS: Role[] = ["admin", "jefe_quirofano", "medico", "enfermero", "administrativo"];

export const PERMISSIONS = {
  "panel:ver": STAFF,
  "pacientes:escribir": ["admin", "jefe_quirofano", "administrativo", "recepcionista"],
  "turnos:escribir": ["admin", "jefe_quirofano", "administrativo"],
  "cirugias:escribir": ["admin", "jefe_quirofano", "administrativo"],
  "cirugias:cambiar_estado": ["admin", "jefe_quirofano", "enfermero"],
  "quirofanos:escribir": ["admin", "jefe_quirofano", "administrativo"],
  "clinica:ver": CLINICAL_READERS,
  "clinica:escribir": CLINICAL_READERS,
  "checklist:configurar": ["admin", "jefe_quirofano"],
  "postop:escribir": ["admin", "jefe_quirofano", "medico", "enfermero"],
  "mensajes:escribir": ["admin", "medico"],
  "insumos:ver": CLINICAL_READERS,
  "insumos:gestionar": ["admin", "jefe_quirofano", "enfermero"],
  "insumos:consumir": ["admin", "jefe_quirofano", "medico", "enfermero"],
  "emails:ver": ["admin", "jefe_quirofano", "administrativo"],
  "usuarios:gestionar": ["admin"],
  "portal:paciente": ["paciente"],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/** true si alguno de los roles del usuario tiene el permiso. */
export function can(userRoles: string[] | undefined, permission: Permission): boolean {
  if (!userRoles) return false;
  const allowed: readonly string[] = PERMISSIONS[permission];
  return userRoles.some((r) => allowed.includes(r));
}
