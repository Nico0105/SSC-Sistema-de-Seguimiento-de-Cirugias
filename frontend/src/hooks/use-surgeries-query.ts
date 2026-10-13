// ======================================================
// useSurgeriesQuery (hooks/use-surgeries-query.ts)
// TanStack Query para el listado de cirugías, con
// invalidación automática ante eventos de Socket.IO
// (alta/cambio de estado/baja). Reemplaza el
// useCallback(load)+useEffect+useRealtime que Dashboard y
// Surgeries repetían cada uno por su cuenta.
// ======================================================
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { useRealtime, SURGERY_EVENTS } from "./use-realtime";
import type { Surgery } from "../lib/types";

export const SURGERIES_QUERY_KEY = ["surgeries"] as const;

/** `enabled: false` evita pedir el listado a usuarios sin acceso al panel (ej. pacientes). */
export function useSurgeriesQuery({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SURGERIES_QUERY_KEY,
    queryFn: () => api.get<Surgery[]>("/api/surgeries"),
    enabled,
  });

  useRealtime(SURGERY_EVENTS, () => {
    void queryClient.invalidateQueries({ queryKey: SURGERIES_QUERY_KEY });
  });

  return query;
}
