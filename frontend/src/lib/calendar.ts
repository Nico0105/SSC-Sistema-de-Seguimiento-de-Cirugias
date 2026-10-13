// ======================================================
// Agenda semanal (lib/calendar.ts)
// Helpers de la vista de calendario de Turnos & Agenda:
// cálculo de la semana (lunes a domingo), número de semana
// ISO, y unificación de turnos y cirugías en una sola lista
// de "eventos" con el mismo formato.
// ======================================================
import type { Appointment, Surgery } from "./types";

/** Franja horaria visible en la grilla (las horas fuera de rango se agrupan en los extremos). */
export const FIRST_HOUR = 7;
export const LAST_HOUR = 20;

/** Tipos de turno con etiqueta y tono pastel del evento en la grilla. */
export const APPOINTMENT_TYPES = [
  { value: "consulta", label: "Consulta", tone: "bg-sky-50 text-sky-800" },
  { value: "prequirurgica", label: "Prequirúrgica", tone: "bg-amber-50 text-amber-800" },
  { value: "control", label: "Control", tone: "bg-emerald-50 text-emerald-800" },
  { value: "estudio", label: "Estudio", tone: "bg-violet-50 text-violet-800" },
] as const;

export const APPOINTMENT_TYPE_INFO: Record<string, { label: string; tone: string }> = Object.fromEntries(
  APPOINTMENT_TYPES.map((t) => [t.value, { label: t.label, tone: t.tone }]),
);

/** Estados de turno (mismo enum que valida el backend). */
export const APPOINTMENT_STATUS_INFO: Record<string, { label: string; pill: string }> = {
  pendiente: { label: "Pendiente", pill: "bg-amber-50 text-amber-700" },
  confirmado: { label: "Confirmado", pill: "bg-blue-50 text-blue-700" },
  completado: { label: "Completado", pill: "bg-emerald-50 text-emerald-700" },
  cancelado: { label: "Cancelado", pill: "bg-rose-50 text-rose-700" },
};

/** Lunes 00:00 de la semana que contiene `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Número de semana ISO-8601 (la que muestran las agendas hospitalarias). */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Evento unificado de la agenda: un turno o una cirugía. */
export type AgendaEvent =
  | { kind: "turno"; id: string; at: Date; data: Appointment }
  | { kind: "cirugia"; id: string; at: Date; data: Surgery };

/** Junta turnos y cirugías (sin las canceladas) dentro de la semana, ordenados por hora. */
export function buildWeekEvents(weekStart: Date, appointments: Appointment[], surgeries: Surgery[]): AgendaEvent[] {
  const weekEnd = addDays(weekStart, 7);
  const inWeek = (d: Date) => d >= weekStart && d < weekEnd;
  const events: AgendaEvent[] = [
    ...appointments
      .map((a) => ({ kind: "turno" as const, id: a.id, at: new Date(a.scheduledAt), data: a }))
      .filter((e) => inWeek(e.at)),
    ...surgeries
      .filter((s) => s.status !== "cancelada")
      .map((s) => ({ kind: "cirugia" as const, id: s.id, at: new Date(s.scheduledAt), data: s }))
      .filter((e) => inWeek(e.at)),
  ];
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Fila horaria donde cae un evento (las horas fuera de la franja van a los extremos). */
export function hourRow(date: Date): number {
  return Math.min(LAST_HOUR, Math.max(FIRST_HOUR, date.getHours()));
}
