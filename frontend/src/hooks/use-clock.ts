// ======================================================
// useClock (hooks/use-clock.ts)
// Hora actual que se actualiza sola cada `intervalMs`.
// La usan el reloj del encabezado, la pantalla pública y los
// cronómetros de cirugías en curso (minutos transcurridos).
// ======================================================
import { useEffect, useState } from "react";

export function useClock(intervalMs = 1_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
