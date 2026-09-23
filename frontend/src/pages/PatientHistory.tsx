// ======================================================
// Historial clínico consolidado (pages/PatientHistory.tsx)
// Vista del staff con TODO lo del paciente en una página:
// datos personales, alertas automáticas, medicación vigente,
// cirugías (estado, timeline, checklist y controles postop),
// registro de síntomas y emails enviados. Todo ordenado
// cronológicamente (lo más reciente primero).
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api-client";
import { SYMPTOM_LABEL, POSTOP_STATUS_LABEL } from "../lib/symptoms";
import { ErrorAlert, Loading, StatusBadge } from "../components/ui";
import type { PatientHistoryData } from "../lib/types";

export default function PatientHistory() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PatientHistoryData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setData(await api.get<PatientHistoryData>(`/api/patients/${id}/history`));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (err) return <div className="p-8"><ErrorAlert message={err} /></div>;
  if (!data) return <Loading label="Cargando historial clínico…" />;

  const { patient } = data;

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <Link to="/patients" className="text-sm text-brand-600 hover:underline">← Volver a pacientes</Link>

      {/* Encabezado con los datos del paciente */}
      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {patient.lastName}, {patient.firstName}
        </h1>
        <div className="text-sm text-slate-500 font-mono">{patient.documentId}</div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-2">
          {patient.birthDate && <span>Nacimiento: {new Date(patient.birthDate).toLocaleDateString()}</span>}
          {patient.bloodType && <span>Sangre: {patient.bloodType}</span>}
          {patient.phone && <span>Tel: {patient.phone}</span>}
          {patient.email && <span>Email: {patient.email}</span>}
          {patient.allergies && <span className="text-rose-600">Alergias: {patient.allergies}</span>}
        </div>
      </div>

      {/* Alertas derivadas automáticamente */}
      {data.alerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6" role="alert">
          <h2 className="font-semibold text-rose-700 mb-2">⚠ Alertas</h2>
          <ul className="list-disc pl-5 text-sm text-rose-700 space-y-1">
            {data.alerts.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Medicación vigente */}
      {data.medication.length > 0 && (
        <Section title="Medicación vigente">
          <ul className="text-sm text-slate-700 space-y-1">
            {data.medication.map((m) => (
              <li key={m.procedure}><span className="text-slate-500">{m.procedure}:</span> {m.medication}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Cirugías con checklist y seguimiento */}
      <Section title={`Cirugías (${data.surgeries.length})`}>
        {data.surgeries.length === 0 && <p className="text-sm text-slate-400">Sin cirugías registradas.</p>}
        <div className="space-y-4">
          {data.surgeries.map((s) => {
            const checked = s.checklistItems.filter((i) => i.checked).length;
            return (
              <div key={s.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Link to={`/surgeries/${s.id}`} className="font-medium text-brand-700 hover:underline">
                      {s.procedure}
                    </Link>
                    <span className="text-xs text-slate-400 font-mono ml-2">{s.publicCode}</span>
                  </div>
                  <StatusBadge status={s.status} waitingRoom={s.waitingRoom} />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Programada: {new Date(s.scheduledAt).toLocaleString()}
                  {s.checklistItems.length > 0 && ` · Checklist: ${checked}/${s.checklistItems.length}`}
                  {s.postopRecords.length > 0 && ` · Controles postop: ${s.postopRecords.length}`}
                </div>
                {s.postopRecords[0] && (
                  <div className="text-xs text-slate-500 mt-1">
                    Último control: {POSTOP_STATUS_LABEL[s.postopRecords[0].status] ?? s.postopRecords[0].status}
                    {s.postopRecords[0].evolution && ` — ${s.postopRecords[0].evolution}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Síntomas reportados */}
      <Section title={`Síntomas reportados (${data.symptoms.length})`}>
        {data.symptoms.length === 0 && <p className="text-sm text-slate-400">Sin reportes de síntomas.</p>}
        <ol className="space-y-3">
          {data.symptoms.map((r) => (
            <li key={r.id} className="border-l-2 border-slate-200 pl-4">
              <div className="flex items-center gap-2 flex-wrap">
                {r.symptoms.map((sym) => (
                  <span key={sym} className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                    {SYMPTOM_LABEL[sym] ?? sym}
                  </span>
                ))}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.painLevel >= 8 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                  Dolor {r.painLevel}/10
                </span>
                <span className="text-xs text-slate-400 ml-auto">{new Date(r.reportedAt).toLocaleString()}</span>
              </div>
              {r.notes && <p className="text-sm text-slate-500 mt-1">{r.notes}</p>}
            </li>
          ))}
        </ol>
      </Section>

      {/* Emails enviados al paciente */}
      <Section title={`Emails enviados (${data.emails.length})`}>
        {data.emails.length === 0 && <p className="text-sm text-slate-400">Sin emails registrados.</p>}
        <ul className="text-sm space-y-1">
          {data.emails.map((e) => (
            <li key={e.id} className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs ${e.status === "enviado" ? "bg-emerald-100 text-emerald-700" : e.status === "fallido" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                {e.status}
              </span>
              <span className="text-slate-700">{e.subject}</span>
              <span className="text-xs text-slate-400 ml-auto">{new Date(e.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** Tarjeta-sección del historial. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
      <h2 className="font-semibold text-slate-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}
