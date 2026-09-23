// ======================================================
// Pantalla pública para familiares (pages/Board.tsx)
// Vista fullscreen pensada para un televisor en la sala de
// espera. Muestra las cirugías del día identificadas SOLO
// por su código público (sin datos del paciente) y su
// estado actual. Se actualiza por Socket.io y, como red de
// seguridad, cada 30 segundos por polling.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { useRealtime, SURGERY_EVENTS } from "../hooks/use-realtime";
import { StatusBadge } from "../components/ui";
import type { BoardItem } from "../lib/types";

/** Frecuencia del polling de respaldo (si el socket se cae). */
const REFRESH_INTERVAL_MS = 30_000;

/** Reloj que se actualiza cada segundo (antes quedaba congelado al render). */
function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Board() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [error, setError] = useState(false);
  const now = useClock();

  const load = useCallback(async () => {
    try {
      setItems(await api.get<BoardItem[]>("/api/public/board"));
      setError(false);
    } catch {
      // En una pantalla pública no se muestran errores técnicos:
      // se indica de forma discreta que la información puede estar desactualizada.
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Actualización inmediata cuando el backend informa cambios.
  useRealtime(SURGERY_EVENTS, load);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold">Estado de Cirugías</h1>
          <p className="text-slate-400 mt-2 text-lg">Información en tiempo real para familiares</p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-3xl font-mono">{now.toLocaleTimeString()}</div>
          <div className="text-slate-400">{now.toLocaleDateString()}</div>
          {error && <div className="text-amber-400 text-sm mt-1">Reintentando conexión…</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((s) => (
          <div key={s.id} className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Código</div>
                <div className="text-4xl font-mono font-bold">{s.publicCode}</div>
              </div>
              <StatusBadge status={s.status} waitingRoom={s.waitingRoom} size="lg" />
            </div>
            <div className="mt-6 flex items-center gap-6 text-slate-300">
              <div>
                <div className="text-xs text-slate-500 uppercase">Quirófano</div>
                <div className="text-xl">{s.operatingRoom?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">Programada</div>
                <div className="text-xl">
                  {new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-20 text-xl">
            No hay cirugías programadas para hoy.
          </div>
        )}
      </div>
    </div>
  );
}
