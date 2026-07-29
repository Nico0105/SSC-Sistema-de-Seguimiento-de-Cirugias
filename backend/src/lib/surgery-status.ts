// ======================================================
// Máquina de estados de una cirugía (lib/surgery-status.ts)
// Define el flujo documentado del proceso quirúrgico:
//
//   programada → ingreso → preoperatorio → en_quirofano
//     → recuperacion → postoperatorio → alta
//
// Además, una cirugía puede cancelarse en cualquier etapa
// previa al quirófano. "alta" y "cancelada" son estados
// terminales. Esta regla se valida en el backend para que
// ningún cliente pueda saltear etapas del proceso.
// ======================================================
import type { SurgeryStatus } from "@prisma/client";

/** Transiciones válidas: estado actual → estados siguientes permitidos. */
export const ALLOWED_TRANSITIONS: Record<SurgeryStatus, SurgeryStatus[]> = {
  programada: ["ingreso", "cancelada"],
  ingreso: ["preoperatorio", "cancelada"],
  preoperatorio: ["en_quirofano", "cancelada"],
  en_quirofano: ["recuperacion"],
  recuperacion: ["postoperatorio"],
  postoperatorio: ["alta"],
  alta: [],      // terminal
  cancelada: [], // terminal
};

/** Indica si el cambio de `from` a `to` respeta el flujo quirúrgico. */
export function canTransition(from: SurgeryStatus, to: SurgeryStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Etiquetas en español de cada estado (para notificaciones y emails). */
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
