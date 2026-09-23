// ======================================================
// Estados de cirugía (lib/surgery-status.ts)
// Catálogo de estados del proceso quirúrgico, sus etiquetas
// visibles, colores de badge y las transiciones permitidas.
// Debe mantenerse alineado con el enum SurgeryStatus y la
// máquina de estados del backend (que es quien valida).
// ======================================================

export const SURGERY_STATUSES = [
  "programada",
  "en_quirofano",
  "esperando_en_sala",
  "postoperatorio",
  "alta",
  "cancelada",
] as const;

export type SurgeryStatus = (typeof SURGERY_STATUSES)[number];

/** Etiquetas en español que ve el usuario. */
export const STATUS_LABEL: Record<SurgeryStatus, string> = {
  programada: "Programada",
  en_quirofano: "En quirófano",
  esperando_en_sala: "Esperando en sala",
  postoperatorio: "Postoperatorio",
  alta: "Alta",
  cancelada: "Cancelada",
};

/** Clases Tailwind del badge de cada estado. */
export const STATUS_COLOR: Record<SurgeryStatus, string> = {
  programada: "bg-slate-100 text-slate-700",
  en_quirofano: "bg-amber-100 text-amber-800",
  esperando_en_sala: "bg-violet-100 text-violet-700",
  postoperatorio: "bg-emerald-100 text-emerald-700",
  alta: "bg-green-100 text-green-700",
  cancelada: "bg-rose-100 text-rose-700",
};

/**
 * Flujo quirúrgico (espejo de la validación del backend):
 * programada → en_quirofano → esperando_en_sala (N) → postoperatorio
 * → alta, con cancelación sólo mientras está programada. Se usa para
 * ofrecer al usuario sólo los pasos válidos.
 */
export const ALLOWED_TRANSITIONS: Record<SurgeryStatus, SurgeryStatus[]> = {
  programada: ["en_quirofano", "cancelada"],
  en_quirofano: ["esperando_en_sala"],
  esperando_en_sala: ["postoperatorio"],
  postoperatorio: ["alta"],
  alta: [],
  cancelada: [],
};

/** Etiqueta completa: "Esperando en sala 3" cuando hay número de sala. */
export function statusText(status: SurgeryStatus, waitingRoom?: string | null): string {
  if (status === "esperando_en_sala" && waitingRoom) return `Esperando en sala ${waitingRoom}`;
  return STATUS_LABEL[status];
}
