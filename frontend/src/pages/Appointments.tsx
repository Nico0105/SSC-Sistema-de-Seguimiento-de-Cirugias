import { useEffect, useState } from "react";
import { api } from "../lib/api-client";

interface Appointment {
  id: string;
  scheduledAt: string;
  type: string;
  status: string;
  notes: string | null;
  patient: { firstName: string; lastName: string };
}
interface Patient { id: string; firstName: string; lastName: string; }

export default function Appointments() {
  const [list, setList] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", scheduledAt: "", type: "consulta", notes: "" });
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [a, p] = await Promise.all([
      api.get<Appointment[]>("/api/appointments"),
      api.get<Patient[]>("/api/patients"),
    ]);
    setList(a); setPatients(p);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api.post("/api/appointments", {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ patientId: "", scheduledAt: "", type: "consulta", notes: "" });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Turnos</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {showForm ? "Cancelar" : "+ Nuevo turno"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Paciente</label>
            <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Seleccionar…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha y hora</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="consulta">Consulta</option>
              <option value="prequirurgica">Prequirúrgica</option>
              <option value="control">Control</option>
              <option value="estudio">Estudio</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {err && <div className="col-span-2 text-rose-600 text-sm">{err}</div>}
          <div className="col-span-2"><button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button></div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
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
            {list.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Sin turnos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
