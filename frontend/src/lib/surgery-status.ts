// ======================================================
// Estados de cirugía (lib/surgery-status.ts)
// Catálogo de estados del proceso quirúrgico, sus etiquetas
// visibles, su tono visual y las transiciones permitidas.
// Debe mantenerse alineado con el enum SurgeryStatus y la
// máquina de estados del backend (que es quien valida).
//
// Cada estado tiene UN tono (STATUS_TONE) que se reutiliza en
// toda la UI: píldoras, borde superior de las tarjetas de
// quirófano, pasos de la línea de tiempo y la pantalla pública.
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

/** Clases de un tono: píldora (fondo+texto+borde), punto y acento (bordes/barras). */
export interface StatusTone {
  pill: string;
  dot: string;
  accent: string;
}

// Paleta deliberadamente sobria: fondos pastel desaturados y puntos de color
// suaves. El único color fuerte de la interfaz es el azul de acento.
export const STATUS_TONE: Record<SurgeryStatus, StatusTone> = {
  programada: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400", accent: "border-slate-200" },
  en_quirofano: { pill: "bg-blue-50 text-blue-800", dot: "bg-blue-500", accent: "border-blue-400" },
  esperando_en_sala: { pill: "bg-violet-50 text-violet-700", dot: "bg-violet-400", accent: "border-violet-300" },
  postoperatorio: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400", accent: "border-emerald-300" },
  alta: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", accent: "border-emerald-400" },
  cancelada: { pill: "bg-rose-50 text-rose-700", dot: "bg-rose-400", accent: "border-rose-300" },
};

/** Compatibilidad: clases de píldora por estado (usado por código previo). */
export const STATUS_COLOR: Record<SurgeryStatus, string> = Object.fromEntries(
  SURGERY_STATUSES.map((s) => [s, STATUS_TONE[s].pill]),
) as Record<SurgeryStatus, string>;

/** Estados que todavía no terminaron (siguen en el circuito quirúrgico). */
export const ACTIVE_STATUSES: SurgeryStatus[] = ["programada", "en_quirofano", "esperando_en_sala", "postoperatorio"];

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

/** Orden lineal del flujo (sin "cancelada"), para la línea de tiempo por pasos. */
export const FLOW_STEPS: SurgeryStatus[] = ["programada", "en_quirofano", "esperando_en_sala", "postoperatorio", "alta"];

/** Descripción corta de cada paso, mostrada bajo el paso en la línea de tiempo. */
export const STEP_HINT: Record<SurgeryStatus, string> = {
  programada: "Admisión y validación",
  en_quirofano: "Intervención en curso",
  esperando_en_sala: "Recuperación en sala",
  postoperatorio: "Controles clínicos",
  alta: "Egreso del paciente",
  cancelada: "Cirugía cancelada",
};

/** Etiqueta completa: "Esperando en sala 3" cuando hay número de sala. */
export function statusText(status: SurgeryStatus, waitingRoom?: string | null): string {
  if (status === "esperando_en_sala" && waitingRoom) return `Esperando en sala ${waitingRoom}`;
  return STATUS_LABEL[status];
}
