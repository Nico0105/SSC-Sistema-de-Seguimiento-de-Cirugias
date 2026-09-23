// ======================================================
// Máquina de estados de una cirugía (lib/surgery-status.ts)
// Define el flujo del proceso quirúrgico:
//
//   programada → en_quirofano → esperando_en_sala (N)
//     → postoperatorio → alta
//
// La cirugía sólo puede cancelarse mientras está programada.
// "alta" y "cancelada" son estados terminales. Al pasar a
// "esperando_en_sala" es obligatorio informar el número de
// sala (Surgery.waitingRoom), que ven los familiares.
// Esta regla se valida en el backend para que ningún cliente
// pueda saltear etapas del proceso.
// ======================================================
import type { SurgeryStatus } from "@prisma/client";

/** Transiciones válidas: estado actual → estados siguientes permitidos. */
export const ALLOWED_TRANSITIONS: Record<SurgeryStatus, SurgeryStatus[]> = {
  programada: ["en_quirofano", "cancelada"],
  en_quirofano: ["esperando_en_sala"],
  esperando_en_sala: ["postoperatorio"],
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
  en_quirofano: "En quirófano",
  esperando_en_sala: "Esperando en sala",
  postoperatorio: "Postoperatorio",
  alta: "Alta",
  cancelada: "Cancelada",
};

/** Etiqueta completa: agrega el número de sala cuando corresponde. */
export function statusText(status: SurgeryStatus, waitingRoom?: string | null): string {
  if (status === "esperando_en_sala" && waitingRoom) return `Esperando en sala ${waitingRoom}`;
  return STATUS_LABEL[status];
}
