import { useEffect, useState } from "react";
import { api } from "../lib/api-client";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string | null;
  email: string | null;
  bloodType: string | null;
}

export default function Patients() {
  const [list, setList] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", documentId: "", phone: "", email: "", bloodType: "" });
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setList(await api.get<Patient[]>("/api/patients"));
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api.post("/api/patients", {
        ...form,
        phone: form.phone || null,
        email: form.email || null,
        bloodType: form.bloodType || null,
      });
      setForm({ firstName: "", lastName: "", documentId: "", phone: "", email: "", bloodType: "" });
      setShowForm(false);
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar paciente?")) return;
    await api.delete(`/api/patients/${id}`);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo paciente"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-3 gap-4">
          {(["firstName","lastName","documentId","phone","email","bloodType"] as const).map((f) => (
            <div key={f}>
              <label className="text-xs font-medium text-slate-600 mb-1 block capitalize">{f}</label>
              <input
                value={(form as any)[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                required={["firstName","lastName","documentId"].includes(f)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          {err && <div className="col-span-3 text-rose-600 text-sm">{err}</div>}
          <div className="col-span-3">
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">Documento</th>
              <th className="text-left px-6 py-3">Nombre</th>
              <th className="text-left px-6 py-3">Contacto</th>
              <th className="text-left px-6 py-3">Sangre</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-6 py-3 font-mono text-xs">{p.documentId}</td>
                <td className="px-6 py-3">{p.lastName}, {p.firstName}</td>
                <td className="px-6 py-3 text-slate-500">{p.phone ?? p.email ?? "—"}</td>
                <td className="px-6 py-3">{p.bloodType ?? "—"}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => remove(p.id)} className="text-rose-600 text-xs hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Sin pacientes</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
