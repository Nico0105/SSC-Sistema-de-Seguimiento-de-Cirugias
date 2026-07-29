// ======================================================
// Dashboard (pages/Dashboard.tsx)
// Resumen operativo del día a día: tarjetas con métricas
// (total, en quirófano, programadas, altas) y tabla de
// cirugías. Se refresca automáticamente ante cualquier
// evento de tiempo real del backend.
// ======================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { useRealtime, SURGERY_EVENTS } from "../hooks/use-realtime";
import { EmptyRow, ErrorAlert, Loading, StatusBadge, TableCard } from "../components/ui";
import type { Surgery } from "../lib/types";

export default function Dashboard() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      setSurgeries(await api.get<Surgery[]>("/api/surgeries"));
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  // Recarga ante altas, cambios de estado o bajas de cirugías.
  useRealtime(SURGERY_EVENTS, load);

  // Las métricas sólo se recalculan cuando cambia la lista.
  const stats = useMemo(
    () => ({
      total: surgeries.length,
      enQuirofano: surgeries.filter((s) => s.status === "en_quirofano").length,
      programadas: surgeries.filter((s) => s.status === "programada").length,
      alta: surgeries.filter((s) => s.status === "alta").length,
    }),
    [surgeries],
  );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total cirugías" value={stats.total} />
        <StatCard label="En quirófano" value={stats.enQuirofano} highlight />
        <StatCard label="Programadas" value={stats.programadas} />
        <StatCard label="Altas" value={stats.alta} />
      </div>

      <div className="mb-4"><ErrorAlert message={err} /></div>

      <TableCard>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Cirugías recientes</h2>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-6 py-3">Código</th>
                <th className="text-left px-6 py-3">Paciente</th>
                <th className="text-left px-6 py-3">Procedimiento</th>
                <th className="text-left px-6 py-3">Quirófano</th>
                <th className="text-left px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {surgeries.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs">{s.publicCode}</td>
                  <td className="px-6 py-3">{s.patient.lastName}, {s.patient.firstName}</td>
                  <td className="px-6 py-3">{s.procedure}</td>
                  <td className="px-6 py-3">{s.operatingRoom?.code ?? "—"}</td>
                  <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
              {surgeries.length === 0 && <EmptyRow colSpan={5}>Sin cirugías cargadas</EmptyRow>}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}

/** Tarjeta de métrica del encabezado del dashboard. */
function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${highlight ? "bg-brand-50 border-brand-100" : "bg-white border-slate-200"}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${highlight ? "text-brand-700" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}
