// ======================================================
// Detalle de cirugía (pages/SurgeryDetail.tsx)
// Muestra la ficha completa de una cirugía, permite avanzar
// su estado (sólo a los roles autorizados y sólo hacia las
// transiciones válidas del flujo quirúrgico) y presenta el
// timeline de cambios con fecha y nota.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { STATUS_CHANGE_ROLES, hasAnyRole } from "../lib/permissions";
import { ALLOWED_TRANSITIONS, STATUS_COLOR, STATUS_LABEL, type SurgeryStatus } from "../lib/surgery-status";
import { useRealtime } from "../hooks/use-realtime";
import { ErrorAlert, Loading, StatusBadge } from "../components/ui";
import type { SurgeryDetail as SurgeryDetailData } from "../lib/types";

export default function SurgeryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canChangeStatus = hasAnyRole(user?.roles, STATUS_CHANGE_ROLES);

  const [surgery, setSurgery] = useState<SurgeryDetailData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setSurgery(await api.get<SurgeryDetailData>(`/api/surgeries/${id}`));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  // Si otro usuario cambia el estado, esta vista se actualiza sola.
  useRealtime(["surgery:update"], load);

  /** Avanza la cirugía al estado indicado (validado también por el backend). */
  async function changeStatus(status: SurgeryStatus) {
    setErr(null);
    setChanging(true);
    try {
      await api.patch(`/api/surgeries/${id}/status`, { status });
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setChanging(false);
    }
  }

  if (!surgery) {
    return (
      <div className="p-8">
        {err ? <ErrorAlert message={err} /> : <Loading />}
      </div>
    );
  }

  // Sólo se ofrecen los pasos válidos desde el estado actual.
  const nextStatuses = ALLOWED_TRANSITIONS[surgery.status];

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <Link to="/surgeries" className="text-sm text-brand-600 hover:underline">← Volver</Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{surgery.procedure}</h1>
          <div className="text-sm text-slate-500 font-mono">{surgery.publicCode}</div>
        </div>
        <StatusBadge status={surgery.status} size="lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
          {/* Horarios reales de la intervención (los marca el backend). */}
          {surgery.startedAt && (
            <div className="text-xs text-slate-500 mt-1">
              Inicio: {new Date(surgery.startedAt).toLocaleTimeString()}
              {surgery.endedAt && ` · Fin: ${new Date(surgery.endedAt).toLocaleTimeString()}`}
            </div>
          )}
        </Card>
      </div>

      <div className="mb-4"><ErrorAlert message={err} /></div>

      {canChangeStatus && nextStatuses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-3">Avanzar estado</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((st) => (
              <button
                key={st}
                onClick={() => void changeStatus(st)}
                disabled={changing}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition bg-white text-slate-700 border-slate-200 hover:border-brand-300 disabled:opacity-50"
              >
                {STATUS_LABEL[st]} →
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Sólo se muestran los pasos válidos del flujo quirúrgico.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Línea de tiempo</h2>
        <ol className="space-y-3">
          {surgery.history.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              {/* Punto de color acorde al estado (primera clase = fondo). */}
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[h.status].split(" ")[0]}`} />
              <span className="text-sm font-medium">{STATUS_LABEL[h.status]}</span>
              {h.note && <span className="text-xs text-slate-500">— {h.note}</span>}
              <span className="text-xs text-slate-400 ml-auto">{new Date(h.createdAt).toLocaleString()}</span>
            </li>
          ))}
          {surgery.history.length === 0 && <li className="text-slate-400 text-sm">Sin cambios registrados</li>}
        </ol>
      </div>
    </div>
  );
}

/** Tarjeta simple de la ficha (título + contenido). */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-xs text-slate-500 mb-2">{title}</div>
      {children}
    </div>
  );
}
