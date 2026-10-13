// ======================================================
// Estado de quirófanos y métricas del día (lib/room-status.ts)
// Algoritmos puros que derivan, a partir del listado de
// cirugías y quirófanos, lo que muestra el centro de comando:
//   - estado de cada sala (en cirugía / retraso / próxima /
//     disponible) y la cirugía que la ocupa;
//   - retrasos: cirugías programadas cuyo horario ya pasó;
//   - métricas del día (ocupación, duración promedio).
// No hay datos inventados: todo sale de la API.
// ======================================================
import type { OperatingRoom, Surgery } from "./types";
import { isToday, minutesBetween } from "./format";

/** Tolerancia antes de considerar que una cirugía programada está demorada. */
export const DELAY_TOLERANCE_MIN = 15;

export type RoomState = "en_cirugia" | "retraso" | "proxima" | "disponible";

/** Etiqueta y punto de color (pastel) de cada estado de sala. */
export const ROOM_STATE_INFO: Record<RoomState, { label: string; dot: string }> = {
  en_cirugia: { label: "En cirugía", dot: "bg-blue-500" },
  retraso: { label: "Demorada", dot: "bg-rose-400" },
  proxima: { label: "Próxima", dot: "bg-amber-400" },
  disponible: { label: "Libre", dot: "bg-slate-300" },
};

export interface RoomSnapshot {
  room: OperatingRoom;
  state: RoomState;
  /** Cirugía que define el estado (la que está en curso, demorada o próxima). */
  surgery: Surgery | null;
  /** Minutos de demora (sólo en estado "retraso"). */
  delayMinutes: number;
  /** Cirugías del día restantes en la sala (sin contar la actual). */
  queued: number;
}

/** true si la cirugía sigue "programada" y su horario ya pasó la tolerancia. */
export function isDelayed(s: Surgery, now = new Date()): boolean {
  return s.status === "programada" && minutesBetween(s.scheduledAt, now) > DELAY_TOLERANCE_MIN && new Date(s.scheduledAt) < now;
}

/** Calcula el estado actual de cada quirófano activo. */
export function buildRoomSnapshots(rooms: OperatingRoom[], surgeries: Surgery[], now = new Date()): RoomSnapshot[] {
  return rooms
    .filter((r) => r.active)
    .map((room) => {
      const inRoom = surgeries.filter((s) => s.operatingRoom?.id === room.id);
      const pendingToday = inRoom
        .filter((s) => s.status === "programada" && isToday(s.scheduledAt))
        .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

      const current = inRoom.find((s) => s.status === "en_quirofano");
      if (current) {
        return { room, state: "en_cirugia" as const, surgery: current, delayMinutes: 0, queued: pendingToday.length };
      }
      const delayed = pendingToday.find((s) => isDelayed(s, now));
      if (delayed) {
        return {
          room,
          state: "retraso" as const,
          surgery: delayed,
          delayMinutes: minutesBetween(delayed.scheduledAt, now),
          queued: pendingToday.length - 1,
        };
      }
      const next = pendingToday[0];
      if (next) return { room, state: "proxima" as const, surgery: next, delayMinutes: 0, queued: pendingToday.length - 1 };
      return { room, state: "disponible" as const, surgery: null, delayMinutes: 0, queued: 0 };
    });
}

/** Métricas de la fila de KPIs del centro de comando. */
export function buildDayStats(surgeries: Surgery[], rooms: OperatingRoom[], now = new Date()) {
  const today = surgeries.filter((s) => isToday(s.scheduledAt) && s.status !== "cancelada");
  const finished = today.filter((s) => s.status === "postoperatorio" || s.status === "alta").length;
  const active = today.filter((s) => s.status === "en_quirofano" || s.status === "esperando_en_sala").length;
  const pending = today.filter((s) => s.status === "programada").length;

  const activeRooms = rooms.filter((r) => r.active);
  const busyRooms = new Set(
    surgeries.filter((s) => s.status === "en_quirofano" && s.operatingRoom).map((s) => s.operatingRoom!.id),
  ).size;
  const occupancy = activeRooms.length ? Math.round((busyRooms / activeRooms.length) * 100) : 0;

  // Duración real de las intervenciones terminadas hoy (entrada → salida de quirófano).
  const durations = today
    .filter((s) => s.startedAt && s.endedAt)
    .map((s) => minutesBetween(s.startedAt!, s.endedAt!));
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const delayed = surgeries
    .filter((s) => isToday(s.scheduledAt) && isDelayed(s, now))
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  return {
    total: today.length,
    finished,
    active,
    pending,
    busyRooms,
    activeRooms: activeRooms.length,
    occupancy,
    avgDuration,
    durationSample: durations.length,
    delayed,
  };
}
