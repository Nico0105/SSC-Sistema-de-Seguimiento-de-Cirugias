// ======================================================
// Gestión de turnos (pages/Appointments.tsx)
// Listado y alta de turnos de pacientes: consultas,
// evaluaciones prequirúrgicas, controles postoperatorios
// y estudios. La escritura es exclusiva de los roles ABM.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { ABM_ROLES, hasAnyRole } from "../lib/permissions";
import { EmptyRow, ErrorAlert, Input, Loading, PrimaryButton, Select, TableCard } from "../components/ui";
import type { Appointment, Patient } from "../lib/types";

/** Tipos de turno definidos por la documentación funcional. */
const APPOINTMENT_TYPES = [
  { value: "consulta", label: "Consulta" },
  { value: "prequirurgica", label: "Prequirúrgica" },
  { value: "control", label: "Control" },
  { value: "estudio", label: "Estudio" },
];

const EMPTY_FORM = { patientId: "", scheduledAt: "", type: "consulta", notes: "" };

export default function Appointments() {
  const { user } = useAuth();
  const canEdit = hasAnyRole(user?.roles, ABM_ROLES);

  const [list, setList] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [a, p] = await Promise.all([
        api.get<Appointment[]>("/api/appointments"),
        api.get<Patient[]>("/api/patients"),
      ]);
      setList(a);
      setPatients(p);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post("/api/appointments", {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Turnos</h1>
        {canEdit && (
          <PrimaryButton type="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo turno"}
          </PrimaryButton>
        )}
      </div>

      {showForm && canEdit && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Paciente" value={form.patientId} onChange={(v) => setForm({ ...form, patientId: v })} required>
            <option value="">Seleccionar…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
          </Select>
          <Input label="Fecha y hora" type="datetime-local" value={form.scheduledAt} onChange={(v) => setForm({ ...form, scheduledAt: v })} required />
          <Select label="Tipo" value={form.type} onChange={(v) => setForm({ ...form, type: v })}>
            {APPOINTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <div className="md:col-span-2"><ErrorAlert message={err} /></div>
          <div className="md:col-span-2">
            <PrimaryButton busy={saving}>Guardar</PrimaryButton>
          </div>
        </form>
      )}

      {!showForm && <div className="mb-4"><ErrorAlert message={err} /></div>}

      <TableCard>
        {loading ? (
          <Loading />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-6 py-3">Fecha</th>
                <th className="text-left px-6 py-3">Paciente</th>
                <th className="text-left px-6 py-3">Tipo</th>
                <th className="text-left px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-6 py-3">{new Date(a.scheduledAt).toLocaleString()}</td>
                  <td className="px-6 py-3">{a.patient.lastName}, {a.patient.firstName}</td>
                  <td className="px-6 py-3 capitalize">{a.type}</td>
                  <td className="px-6 py-3 capitalize">{a.status}</td>
                </tr>
              ))}
              {list.length === 0 && <EmptyRow colSpan={4}>Sin turnos</EmptyRow>}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
