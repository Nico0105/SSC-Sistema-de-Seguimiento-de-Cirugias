// ======================================================
// Pantalla pública para familiares (pages/Board.tsx)
// Vista fullscreen para un televisor en la sala de espera.
// Cada fila responde lo que busca un familiar: código, nombre
// abreviado ("Mateo R."), dónde está (quirófano o sala) y en
// qué etapa. Sólo aparecen los pacientes que siguen en el
// circuito: al pasar a postoperatorio, recibir el alta o
// cancelarse, el backend deja de enviarlos y la fila
// desaparece para dejar lugar a los demás. Nunca se muestran
// apellido completo, documento ni procedimiento.
// Tipografía grande para leer a distancia.
// Se actualiza por Socket.IO y, como red de seguridad,
// cada 30 segundos por polling.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { useRealtime, SURGERY_EVENTS } from "../hooks/use-realtime";
import { useClock } from "../hooks/use-clock";
import type { SurgeryStatus } from "../lib/surgery-status";
import { formatCode, formatLongDate, formatTime } from "../lib/format";
import { cn } from "../lib/cn";
import { BrandMark } from "../components/layout/BrandMark";
import type { BoardItem } from "../lib/types";

/** Frecuencia del polling de respaldo (si el socket se cae). */
const REFRESH_INTERVAL_MS = 30_000;

/** Columnas: código · paciente · ubicación · estado (una sola columna en mobile). */
const ROW_GRID = "grid-cols-1 md:grid-cols-[0.9fr_1.1fr_1fr_1.1fr] md:gap-8";

/** Estado expresado para familiares, con un punto de color sobrio. */
const FAMILY_STATUS: Record<SurgeryStatus, { label: string; dot: string }> = {
  programada: { label: "En espera de ingreso", dot: "bg-slate-300" },
  en_quirofano: { label: "Cirugía en curso", dot: "bg-blue-500" },
  esperando_en_sala: { label: "En recuperación", dot: "bg-violet-400" },
  postoperatorio: { label: "Postoperatorio", dot: "bg-emerald-400" },
  alta: { label: "Finalizada", dot: "bg-emerald-500" },
  cancelada: { label: "Cancelada", dot: "bg-slate-300" },
};

/** Lugar físico del paciente: el quirófano (asignado o en uso) o la sala donde espera. */
function location(item: BoardItem): string {
  if (item.status === "esperando_en_sala") return item.waitingRoom ? `Sala ${item.waitingRoom}` : "";
  return item.operatingRoom?.name ?? "";
}

export default function Board() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const now = useClock();

  const load = useCallback(async () => {
    try {
      setItems(await api.get<BoardItem[]>("/api/public/board"));
      setError(false);
    } catch {
      // En una pantalla pública no se muestran errores técnicos:
      // sólo se indica, discretamente, que puede estar desactualizada.
      setError(true);
    } finally {
      setLoaded(true);
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
    <div className="flex min-h-screen flex-col px-8 py-10 md:px-16 md:py-14">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <BrandMark size="lg" />
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Sala de espera</h1>
          <p className="mt-3 text-lg text-slate-500">Busque el código que figura en su comprobante de ingreso.</p>
        </div>
        <div className="md:text-right">
          <p className="font-mono text-5xl font-medium text-slate-900">{formatTime(now)}</p>
          <p className="mt-2 text-slate-500">{formatLongDate(now)}</p>
          {error && <p className="mt-1 text-sm text-amber-600">Reconectando…</p>}
        </div>
      </header>

      <main className="mt-14 flex-1">
        {!loaded ? null : items.length === 0 ? (
          <div className="rounded-3xl bg-white px-10 py-20 text-center">
            <p className="text-3xl font-medium text-slate-900">No hay pacientes en el circuito quirúrgico</p>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
              Cuando su familiar ingrese al circuito quirúrgico, su código aparecerá aquí con la etapa en tiempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white">
            {/* Encabezados discretos: sólo en pantallas anchas (televisor). */}
            <div className={cn(ROW_GRID, "hidden px-10 pt-6 pb-2 text-sm text-slate-400 md:grid")}>
              <span>Código</span>
              <span>Paciente</span>
              <span>Ubicación</span>
              <span>Estado</span>
            </div>
            <ul>
              {items.map((item) => {
                const status = FAMILY_STATUS[item.status];
                return (
                  <li key={item.id} className={cn(ROW_GRID, "grid gap-2 border-t border-slate-100 px-10 py-6 md:items-center")}>
                    <span className="font-mono text-3xl font-medium text-slate-900 md:text-4xl">{formatCode(item.publicCode)}</span>
                    <span className="text-lg font-medium text-slate-900 md:text-xl">{item.patientName}</span>
                    <span className="text-lg text-slate-500 md:text-xl">{location(item) || <span className="text-slate-300">—</span>}</span>
                    <span className="flex items-center gap-3 text-lg text-slate-900 md:text-xl">
                      <span className={cn("h-3 w-3 shrink-0 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-sm text-slate-400">
        Por privacidad, sólo se muestra el nombre y la inicial del apellido. Ante cualquier consulta, acérquese a informes.
      </footer>
    </div>
  );
}
