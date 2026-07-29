// ======================================================
// Estados de cirugía (lib/surgery-status.ts)
// Catálogo de estados del proceso quirúrgico, sus etiquetas
// visibles, colores de badge y las transiciones permitidas.
// Debe mantenerse alineado con el enum SurgeryStatus y la
// máquina de estados del backend (que es quien valida).
// ======================================================

export const SURGERY_STATUSES = [
  "programada",
  "ingreso",
  "preoperatorio",
  "en_quirofano",
  "recuperacion",
  "postoperatorio",
  "alta",
  "cancelada",
] as const;

export type SurgeryStatus = (typeof SURGERY_STATUSES)[number];

/** Etiquetas en español que ve el usuario. */
export const STATUS_LABEL: Record<SurgeryStatus, string> = {
  programada: "Programada",
  ingreso: "Ingreso",
  preoperatorio: "Preoperatorio",
  en_quirofano: "En quirófano",
  recuperacion: "Recuperación",
  postoperatorio: "Postoperatorio",
  alta: "Alta",
  cancelada: "Cancelada",
};

/** Clases Tailwind del badge de cada estado. */
export const STATUS_COLOR: Record<SurgeryStatus, string> = {
  programada: "bg-slate-100 text-slate-700",
  ingreso: "bg-sky-100 text-sky-700",
  preoperatorio: "bg-indigo-100 text-indigo-700",
  en_quirofano: "bg-amber-100 text-amber-800",
  recuperacion: "bg-violet-100 text-violet-700",
  postoperatorio: "bg-emerald-100 text-emerald-700",
  alta: "bg-green-100 text-green-700",
  cancelada: "bg-rose-100 text-rose-700",
};

/**
 * Flujo quirúrgico documentado (espejo de la validación del backend):
 * programada → ingreso → preoperatorio → en_quirofano → recuperacion
 * → postoperatorio → alta, con cancelación posible hasta entrar a
 * quirófano. Se usa para ofrecer al usuario sólo los pasos válidos.
 */
export const ALLOWED_TRANSITIONS: Record<SurgeryStatus, SurgeryStatus[]> = {
  programada: ["ingreso", "cancelada"],
  ingreso: ["preoperatorio", "cancelada"],
  preoperatorio: ["en_quirofano", "cancelada"],
  en_quirofano: ["recuperacion"],
  recuperacion: ["postoperatorio"],
  postoperatorio: ["alta"],
  alta: [],
  cancelada: [],
};
