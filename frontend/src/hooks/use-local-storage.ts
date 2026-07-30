// ======================================================
// useLocalStorage (hooks/use-local-storage.ts)
// Estado de React persistido en localStorage — se usa para
// recordar preferencias de UI entre sesiones (ej. si el
// usuario dejó el sidebar colapsado). No es para datos de
// negocio: eso siempre vive en el servidor.
// ======================================================
import { useCallback, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // localStorage puede fallar en modo privado; no es crítico.
      }
    },
    [key],
  );

  return [value, set] as const;
}
