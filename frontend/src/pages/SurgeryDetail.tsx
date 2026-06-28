import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, getSocket } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { STATUS_CHANGE_ROLES, hasAnyRole } from "../lib/permissions";
import { SURGERY_STATUSES, STATUS_LABEL, STATUS_COLOR, type SurgeryStatus } from "../lib/surgery-status";

interface Surgery {
  id: string;
  publicCode: string;
  procedure: string;
  surgeonName: string | null;
  status: SurgeryStatus;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
  patient: { firstName: string; lastName: string; documentId: string };
  operatingRoom: { code: string; name: string } | null;
  history: { id: string; status: SurgeryStatus; createdAt: string; note: string | null }[];
}

export default function SurgeryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canChangeStatus = hasAnyRole(user?.roles, STATUS_CHANGE_ROLES);
  const [surgery, setSurgery] = useState<Surgery | null>(null);

  async function load() {
    if (!id) return;
    setSurgery(await api.get<Surgery>(`/api/surgeries/${id}`));
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on("surgery:update", load);
    return () => { socket.off("surgery:update", load); };
  }, [id]);

  async function changeStatus(status: SurgeryStatus) {
    await api.patch(`/api/surgeries/${id}/status`, { status });
    load();
  }

  if (!surgery) return <div className="p-8 text-slate-500">Cargando…</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/surgeries" className="text-sm text-brand-600 hover:underline">← Volver</Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{surgery.procedure}</h1>
          <div className="text-sm text-slate-500 font-mono">{surgery.publicCode}</div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLOR[surgery.status]}`}>
          {STATUS_LABEL[surgery.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="Paciente">
          <div className="font-medium">{surgery.patient.lastName}, {surgery.patient.firstName}</div>
          <div className="text-sm text-slate-500 font-mono">{surgery.patient.documentId}</div>
        </Card>
        <Card title="Quirófano">
          <div>{surgery.operatingRoom ? `${surgery.operatingRoom.code} · ${surgery.operatingRoom.name}` : "Sin asignar"}</div>
        </Card>
        <Card title="Cirujano">
          <div>{surgery.surgeonName ?? "—"}</div>
        </Card>
        <Card title="Programada">
          <div>{new Date(surgery.scheduledAt).toLocaleString()}</div>
        </Card>
      </div>

      {canChangeStatus && (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Cambiar estado</h2>
        <div className="flex flex-wrap gap-2">
          {SURGERY_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => changeStatus(st)}
              disabled={st === surgery.status}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                st === surgery.status
                  ? "bg-brand-600 text-white border-brand-600 cursor-default"
                  : "bg-white text-slate-700 border-slate-200 hover:border-brand-300"
              }`}
            >
              {STATUS_LABEL[st]}
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Línea de tiempo</h2>
        <ol className="space-y-3">
          {surgery.history.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[h.status].split(" ")[0]}`} />
              <span className="text-sm font-medium">{STATUS_LABEL[h.status]}</span>
              <span className="text-xs text-slate-400 ml-auto">{new Date(h.createdAt).toLocaleString()}</span>
            </li>
          ))}
          {surgery.history.length === 0 && <li className="text-slate-400 text-sm">Sin cambios registrados</li>}
        </ol>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-xs text-slate-500 mb-2">{title}</div>
      {children}
    </div>
  );
}
