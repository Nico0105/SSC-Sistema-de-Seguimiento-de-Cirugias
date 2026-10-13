// ======================================================
// Queries de catálogos (hooks/use-catalog-queries.ts)
// Quirófanos, pacientes y turnos con TanStack Query. Varias
// pantallas los necesitan a la vez (Dashboard, Cirugías,
// Pacientes, Agenda); al compartir la clave de caché se piden
// UNA sola vez y se reutilizan al navegar entre pantallas.
// ======================================================
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type { Appointment, OperatingRoom, Patient } from "../lib/types";

export const ROOMS_QUERY_KEY = ["operating-rooms"] as const;
export const PATIENTS_QUERY_KEY = ["patients"] as const;
export const APPOINTMENTS_QUERY_KEY = ["appointments"] as const;

/** Quirófanos (cambian poco: caché de 5 minutos). */
export function useRoomsQuery() {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: () => api.get<OperatingRoom[]>("/api/operating-rooms"),
    staleTime: 5 * 60_000,
  });
}

export function usePatientsQuery() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: () => api.get<Patient[]>("/api/patients"),
  });
}

export function useAppointmentsQuery() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEY,
    queryFn: () => api.get<Appointment[]>("/api/appointments"),
  });
}
