import { useEffect, useState } from "react";
import { api, getSocket } from "../lib/api-client";
import { STATUS_LABEL, STATUS_COLOR, type SurgeryStatus } from "../lib/surgery-status";

interface Surgery {
  id: string;
  publicCode: string;
  procedure: string;
  status: SurgeryStatus;
  scheduledAt: string;
  patient: { firstName: string; lastName: string };
  operatingRoom: { code: string; name: string } | null;
}

export default function Dashboard() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const list = await api.get<Surgery[]>("/api/surgeries");
    setSurgeries(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on("surgery:update", refresh);
    socket.on("surgery:created", refresh);
    socket.on("surgery:deleted", refresh);
    return () => {
      socket.off("surgery:update", refresh);
      socket.off("surgery:created", refresh);
      socket.off("surgery:deleted", refresh);
    };
  }, []);

  const stats = {
    total: surgeries.length,
    enQuirofano: surgeries.filter((s) => s.status === "en_quirofano").length,
    programadas: surgeries.filter((s) => s.status === "programada").length,
    alta: surgeries.filter((s) => s.status === "alta").length,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total cirugías" value={stats.total} />
        <StatCard label="En quirófano" value={stats.enQuirofano} highlight />
        <StatCard label="Programadas" value={stats.programadas} />
        <StatCard label="Altas" value={stats.alta} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Cirugías recientes</h2>
        </div>
        {loading ? (
          <div className="p-8 text-slate-500">Cargando…</div>
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
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {surgeries.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Sin cirugías cargadas</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${highlight ? "bg-brand-50 border-brand-100" : "bg-white border-slate-200"}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${highlight ? "text-brand-700" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}
