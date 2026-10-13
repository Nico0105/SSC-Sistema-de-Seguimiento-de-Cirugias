// ======================================================
// Cliente de TanStack Query (lib/query-client.ts)
// Reemplaza el patrón repetido en cada página de
// `useCallback(load) + useEffect + try/catch/setErr/finally`
// por queries/mutaciones declarativas con caché, refetch y
// manejo de loading/error consistente en toda la app.
//
// Configuración: sin refetch automático al enfocar la ventana
// (el panel ya se actualiza por Socket.IO en las pantallas que
// lo necesitan — ver hooks/use-realtime.ts) y reintentos
// desactivados por defecto, porque los errores de negocio
// (permisos, validación) no se resuelven reintentando.
// ======================================================
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 10_000,
    },
    mutations: {
      retry: false,
    },
  },
});
