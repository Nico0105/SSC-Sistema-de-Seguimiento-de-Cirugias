// ======================================================
// Panel de seguimiento postoperatorio (components/PostopPanel.tsx)
// Historial cronológico de controles de una cirugía y
// formulario de carga para el personal clínico (estado,
// evolución, medicación, cumplimiento y observaciones).
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { POSTOP_STATUS_LABEL, POSTOP_STATUS_OPTIONS } from "../lib/symptoms";
import { ErrorAlert, Input, Loading, PrimaryButton, Select } from "./ui";
import type { PostopRecord } from "../lib/types";

const EMPTY_FORM = {
  status: "estable",
  evolution: "",
  medication: "",
  compliance: true,
  observations: "",
};

/** Colores del badge según el estado del control. */
const POSTOP_COLOR: Record<string, string> = {
  estable: "bg-sky-100 text-sky-700",
  mejorando: "bg-emerald-100 text-emerald-700",
  con_complicaciones: "bg-rose-100 text-rose-700",
  alta: "bg-green-100 text-green-700",
};

export default function PostopPanel({
  surgeryId,
  canCreate,
}: {
  surgeryId: string;
  canCreate: boolean;
}) {
  const [records, setRecords] = useState<PostopRecord[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRecords(await api.get<PostopRecord[]>(`/api/surgeries/${surgeryId}/postop`));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [surgeryId]);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post(`/api/surgeries/${surgeryId}/postop`, {
        ...form,
        evolution: form.evolution || null,
        medication: form.medication || null,
        observations: form.observations || null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!records) return <Loading label="Cargando seguimiento…" />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">Seguimiento postoperatorio</h2>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-brand-600 text-sm hover:underline"
          >
            {showForm ? "Cancelar" : "+ Nuevo control"}
          </button>
        )}
      </div>

      <ErrorAlert message={err} />

      {showForm && canCreate && (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 my-3 bg-slate-50">
          <Select label="Estado del paciente" value={form.status} onChange={(v) => setForm({ ...form, status: v })} required>
            {POSTOP_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input label="Medicación indicada" value={form.medication} onChange={(v) => setForm({ ...form, medication: v })} />
          <Input label="Evolución" value={form.evolution} onChange={(v) => setForm({ ...form, evolution: v })} />
          <Input label="Observaciones" value={form.observations} onChange={(v) => setForm({ ...form, observations: v })} />
          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={form.compliance}
              onChange={(e) => setForm({ ...form, compliance: e.target.checked })}
            />
            El paciente cumple las indicaciones
          </label>
          <div className="md:col-span-2">
            <PrimaryButton busy={saving}>Guardar control</PrimaryButton>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-slate-400">Sin controles registrados.</p>
      ) : (
        <ol className="space-y-4 mt-2">
          {records.map((r) => (
            <li key={r.id} className="border-l-2 border-slate-200 pl-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${POSTOP_COLOR[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                  {POSTOP_STATUS_LABEL[r.status] ?? r.status}
                </span>
                {!r.compliance && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    No cumple indicaciones
                  </span>
                )}
                <span className="text-xs text-slate-400 ml-auto">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.createdByUser && ` · ${r.createdByUser.fullName}`}
                </span>
              </div>
              {r.evolution && <p className="text-sm text-slate-700 mt-1">Evolución: {r.evolution}</p>}
              {r.medication && <p className="text-sm text-slate-700 mt-0.5">Medicación: {r.medication}</p>}
              {r.observations && <p className="text-sm text-slate-500 mt-0.5">{r.observations}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
