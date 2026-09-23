// ======================================================
// Portal del paciente (pages/MyCare.tsx)
// Única pantalla del rol "paciente" en la web. Consume los
// endpoints /api/me/* (el backend garantiza que sólo ve SU
// información):
//   - Sus datos y sus cirugías con estado
//   - Su checklist preoperatorio (sólo lectura)
//   - Sus indicaciones / evolución (controles postop)
//   - Registro diario de síntomas (formulario) e historial
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { SYMPTOM_LABEL, SYMPTOM_OPTIONS, POSTOP_STATUS_LABEL } from "../lib/symptoms";
import { ErrorAlert, Input, Loading, PrimaryButton, StatusBadge } from "../components/ui";
import ChecklistPanel from "../components/ChecklistPanel";
import type { Patient, PostopRecord, Surgery, SymptomReport } from "../lib/types";

type OwnSurgery = Omit<Surgery, "patient">;

const EMPTY_FORM = { symptoms: [] as string[], painLevel: 0, notes: "" };

export default function MyCare() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [surgeries, setSurgeries] = useState<OwnSurgery[]>([]);
  const [postop, setPostop] = useState<PostopRecord[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [p, s, po, sy] = await Promise.all([
        api.get<Patient>("/api/me/patient"),
        api.get<OwnSurgery[]>("/api/me/surgeries"),
        api.get<PostopRecord[]>("/api/me/postop"),
        api.get<SymptomReport[]>("/api/me/symptoms"),
      ]);
      setPatient(p);
      setSurgeries(s);
      setPostop(po);
      setSymptoms(sy);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Alterna un síntoma en el formulario. */
  function toggleSymptom(value: string) {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(value)
        ? f.symptoms.filter((s) => s !== value)
        : [...f.symptoms, value],
    }));
  }

  /** Envía el reporte diario de síntomas. */
  async function submitSymptoms(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.post("/api/me/symptoms", {
        symptoms: form.symptoms,
        painLevel: form.painLevel,
        notes: form.notes || null,
      });
      setForm(EMPTY_FORM);
      setSaved(true);
      await load();
    } catch (error) {
      setFormErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Cargando tu información…" />;
  if (err) return <div className="p-8"><ErrorAlert message={err} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Mi seguimiento</h1>
      <p className="text-sm text-slate-500 mb-6">
        Hola {patient?.firstName}. Acá podés ver el estado de tus cirugías, tu checklist,
        tus indicaciones y registrar cómo te sentís cada día.
      </p>

      {/* Cirugías propias con su checklist */}
      <h2 className="font-semibold text-slate-800 mb-3">Mis cirugías</h2>
      {surgeries.length === 0 && (
        <p className="text-sm text-slate-400 mb-6">No tenés cirugías registradas.</p>
      )}
      <div className="space-y-4 mb-8">
        {surgeries.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <div className="font-medium text-slate-800">{s.procedure}</div>
              <StatusBadge status={s.status} waitingRoom={s.waitingRoom} />
            </div>
            <div className="text-xs text-slate-500 mb-4">
              Programada: {new Date(s.scheduledAt).toLocaleString()}
              {s.operatingRoom && ` · Quirófano ${s.operatingRoom.code}`}
            </div>
            {/* Checklist en modo sólo lectura, vía el endpoint del portal. */}
            <ChecklistPanel
              surgeryId={s.id}
              canEdit={false}
              endpoint={`/api/me/surgeries/${s.id}/checklist`}
            />
          </div>
        ))}
      </div>

      {/* Indicaciones y evolución (controles del equipo médico) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold text-slate-800 mb-3">Mis indicaciones y evolución</h2>
        {postop.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no hay controles cargados por tu equipo médico.</p>
        ) : (
          <ol className="space-y-3">
            {postop.map((r) => (
              <li key={r.id} className="border-l-2 border-slate-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">
                    {POSTOP_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  {r.surgery && <span className="text-xs text-slate-400">({r.surgery.procedure})</span>}
                  <span className="text-xs text-slate-400 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                {r.medication && <p className="text-sm text-slate-700 mt-0.5">Medicación: {r.medication}</p>}
                {r.evolution && <p className="text-sm text-slate-600 mt-0.5">Evolución: {r.evolution}</p>}
                {r.observations && <p className="text-sm text-slate-500 mt-0.5">{r.observations}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Registro diario de síntomas */}
      <form onSubmit={submitSymptoms} className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold text-slate-800 mb-1">¿Cómo te sentís hoy?</h2>
        <p className="text-xs text-slate-500 mb-4">Marcá los síntomas que tengas y tu nivel de dolor.</p>

        <div className="flex flex-wrap gap-3 mb-4">
          {SYMPTOM_OPTIONS.map((s) => (
            <label key={s.value} className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition ${form.symptoms.includes(s.value) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-700 border-slate-200 hover:border-brand-300"}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.symptoms.includes(s.value)}
                onChange={() => toggleSymptom(s.value)}
              />
              {s.label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1 block">
              Nivel de dolor: <strong>{form.painLevel}/10</strong>
            </span>
            <input
              type="range"
              min={0}
              max={10}
              value={form.painLevel}
              onChange={(e) => setForm({ ...form, painLevel: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <Input label="Observaciones" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </div>

        <ErrorAlert message={formErr} />
        {saved && <p className="text-sm text-emerald-600 mb-2">✓ Síntomas registrados. ¡Gracias!</p>}
        <PrimaryButton busy={saving} disabled={form.symptoms.length === 0}>Registrar síntomas</PrimaryButton>
      </form>

      {/* Historial de reportes propios */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Mis reportes anteriores</h2>
        {symptoms.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no registraste síntomas.</p>
        ) : (
          <ol className="space-y-3">
            {symptoms.map((r) => (
              <li key={r.id} className="flex items-center gap-2 flex-wrap border-l-2 border-slate-200 pl-4">
                {r.symptoms.map((sym) => (
                  <span key={sym} className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                    {SYMPTOM_LABEL[sym] ?? sym}
                  </span>
                ))}
                <span className="text-xs text-slate-500">Dolor {r.painLevel}/10</span>
                <span className="text-xs text-slate-400 ml-auto">{new Date(r.reportedAt).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
