// ======================================================
// Gestión de cirugías (pages/Surgeries.tsx)
// Listado en tiempo real y alta de cirugías. Toda cirugía
// nace "programada"; su estado se avanza desde la página
// de detalle siguiendo el flujo quirúrgico documentado.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { ABM_ROLES, hasAnyRole } from "../lib/permissions";
import { useRealtime, SURGERY_EVENTS } from "../hooks/use-realtime";
import { EmptyRow, ErrorAlert, Input, Loading, PrimaryButton, Select, StatusBadge, TableCard } from "../components/ui";
import type { OperatingRoom, Patient, Surgery } from "../lib/types";

const EMPTY_FORM = {
  publicCode: "",
  patientId: "",
  operatingRoomId: "",
  procedure: "",
  surgeonName: "",
  scheduledAt: "",
};

export default function Surgeries() {
  const { user } = useAuth();
  const canEdit = hasAnyRole(user?.roles, ABM_ROLES);

  const [list, setList] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<OperatingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Carga en paralelo el listado y los catálogos del formulario.
  const load = useCallback(async () => {
    try {
      setErr(null);
      const [s, p, r] = await Promise.all([
        api.get<Surgery[]>("/api/surgeries"),
        api.get<Patient[]>("/api/patients"),
        api.get<OperatingRoom[]>("/api/operating-rooms"),
      ]);
      setList(s);
      setPatients(p);
      setRooms(r);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useRealtime(SURGERY_EVENTS, load);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post("/api/surgeries", {
        ...form,
        surgeonName: form.surgeonName || null,
        operatingRoomId: form.operatingRoomId || null,
        // El input datetime-local devuelve hora local; se envía en ISO/UTC.
        scheduledAt: new Date(form.scheduledAt).toISOString(),
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
        <h1 className="text-2xl font-bold text-slate-800">Cirugías</h1>
        {canEdit && (
          <PrimaryButton type="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nueva cirugía"}
          </PrimaryButton>
        )}
      </div>

      {showForm && canEdit && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Código público" value={form.publicCode} onChange={(v) => setForm({ ...form, publicCode: v })} required />
          <Input label="Procedimiento" value={form.procedure} onChange={(v) => setForm({ ...form, procedure: v })} required />
          <Select label="Paciente" value={form.patientId} onChange={(v) => setForm({ ...form, patientId: v })} required>
            <option value="">Seleccionar…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
          </Select>
          <Select label="Quirófano" value={form.operatingRoomId} onChange={(v) => setForm({ ...form, operatingRoomId: v })}>
            <option value="">—</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}
          </Select>
          <Input label="Cirujano" value={form.surgeonName} onChange={(v) => setForm({ ...form, surgeonName: v })} />
          <Input label="Programada para" type="datetime-local" value={form.scheduledAt} onChange={(v) => setForm({ ...form, scheduledAt: v })} required />
          <div className="md:col-span-2"><ErrorAlert message={err} /></div>
          <div className="md:col-span-2">
            <PrimaryButton busy={saving}>Crear</PrimaryButton>
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
                <th className="text-left px-6 py-3">Código</th>
                <th className="text-left px-6 py-3">Paciente</th>
                <th className="text-left px-6 py-3">Procedimiento</th>
                <th className="text-left px-6 py-3">Horario</th>
                <th className="text-left px-6 py-3">Estado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs">{s.publicCode}</td>
                  <td className="px-6 py-3">{s.patient.lastName}, {s.patient.firstName}</td>
                  <td className="px-6 py-3">{s.procedure}</td>
                  <td className="px-6 py-3 text-slate-500">{new Date(s.scheduledAt).toLocaleString()}</td>
                  <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-3 text-right">
                    <Link to={`/surgeries/${s.id}`} className="text-brand-600 text-xs hover:underline">Ver →</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <EmptyRow colSpan={6}>Sin cirugías</EmptyRow>}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
