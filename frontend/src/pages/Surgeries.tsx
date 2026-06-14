import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getSocket } from "../lib/api-client";
import { STATUS_LABEL, STATUS_COLOR, type SurgeryStatus } from "../lib/surgery-status";

interface Surgery {
  id: string;
  publicCode: string;
  procedure: string;
  status: SurgeryStatus;
  scheduledAt: string;
  patient: { firstName: string; lastName: string };
  operatingRoom: { code: string } | null;
}

interface Patient { id: string; firstName: string; lastName: string; }
interface Room { id: string; code: string; name: string; }

export default function Surgeries() {
  const [list, setList] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    publicCode: "", patientId: "", operatingRoomId: "", procedure: "",
    surgeonName: "", scheduledAt: "",
  });
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [s, p, r] = await Promise.all([
      api.get<Surgery[]>("/api/surgeries"),
      api.get<Patient[]>("/api/patients"),
      api.get<Room[]>("/api/operating-rooms"),
    ]);
    setList(s); setPatients(p); setRooms(r);
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on("surgery:update", load);
    socket.on("surgery:created", load);
    socket.on("surgery:deleted", load);
    return () => {
      socket.off("surgery:update", load);
      socket.off("surgery:created", load);
      socket.off("surgery:deleted", load);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api.post("/api/surgeries", {
        ...form,
        operatingRoomId: form.operatingRoomId || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setShowForm(false);
      setForm({ publicCode: "", patientId: "", operatingRoomId: "", procedure: "", surgeonName: "", scheduledAt: "" });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cirugías</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {showForm ? "Cancelar" : "+ Nueva cirugía"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
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
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Programada para</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {err && <div className="col-span-2 text-rose-600 text-sm">{err}</div>}
          <div className="col-span-2">
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Crear</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
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
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  <Link to={`/surgeries/${s.id}`} className="text-brand-600 text-xs hover:underline">Ver →</Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Sin cirugías</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}

function Select({ label, value, onChange, children, required }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
        {children}
      </select>
    </div>
  );
}
